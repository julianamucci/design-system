// Captura de erro no primeiro statement do preview — o mesmo instante em que o
// `startFaro` rodava antes —, mas sem o SDK no chunk de entrada: o ouvinte e
// sincrono e nao importa nada. O Faro entra ocioso e reproduz o que o buffer
// guardou. O porque e a medicao (62 KB gzip, 18% do critico) estao no primitivo.
import { bufferarErros, iniciarFaroQuandoOcioso, marcarStory } from '@shared/primitives/faro';
import '../src/lib/reload-on-chunk-error';
import { getThemeFromSubdomain } from '@shared/themes/theme-config';
import type { Preview } from '@storybook/html-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect, addons } from 'storybook/preview-api';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

bufferarErros();

iniciarFaroQuandoOcioso(
  async () => {
    const [sdk, tracing] = await Promise.all([
      import('@grafana/faro-web-sdk'),
      import('@grafana/faro-web-tracing'),
    ]);
    return {
      initializeFaro: sdk.initializeFaro,
      getWebInstrumentations: sdk.getWebInstrumentations,
      TracingInstrumentation: tracing.TracingInstrumentation,
    };
  },
  { stack: 'vanilla', env: import.meta.env },
);

// A story renderizada vira a view do Faro — sem isto, erro e Web Vital de
// qualquer componente ficariam atribuidos a primeira story aberta.
if (typeof document !== 'undefined') {
  const assinarStory = () => {
    try {
      addons.getChannel().on('storyRendered', (id: string) => marcarStory(id));
    } catch {
      setTimeout(assinarStory, 50);   // canal ainda nao existe no module-eval
    }
  };
  assinarStory();
}

function applyClasses(brand: string, density: string, font: string, typescale: string, typebase: string) {
  const html = document.documentElement;
  const ours = new Set([
    'tema-default', 'tema-warm', 'tema-cold',
    'densidade-default', 'densidade-condensado', 'densidade-confortavel',
    'fonte-default', 'fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai',
    'escala-minor-second', 'escala-major-second', 'escala-minor-third', 'escala-major-third',
    'escala-perfect-fourth', 'escala-augmented-fourth', 'escala-perfect-fifth', 'escala-golden',
    'base-tipo-s', 'base-tipo-m', 'base-tipo-l',
  ]);
  const preserved = Array.from(html.classList).filter(c => !ours.has(c));
  html.className = [
    ...preserved,
    `tema-${brand}`,
    `densidade-${density}`,
    `fonte-${font}`,
    `escala-${typescale}`,
    `base-tipo-${typebase}`,
  ].join(' ');
}

// Aplica `data-reduced-motion` no <html>. 'reduce' força o override do
// motion.css (zera durações de transition/animation). 'default' remove o
// atributo — passa a respeitar o @media (prefers-reduced-motion) do SO.
function applyMotion(motion: string) {
  const html = document.documentElement;
  if (motion === 'reduce') html.dataset['reducedMotion'] = 'true';
  else delete html.dataset['reducedMotion'];
}

const preview: Preview = {
  parameters: {
    // O seletor de cor de fundo sai da toolbar. Ele pinta o canvas com
    // `background: … !important` e NÃO acompanha o modo claro/escuro: o
    // resultado é texto de tema escuro sobre fundo claro fixo, o que faz o
    // design system parecer que não se adapta — quando o que não se adapta é a
    // ferramenta. Quem troca o modo é o seletor de tema, e ele já funciona.
    //
    // Só a cor de fundo sai: `grid.disable` é chave própria, então a grade e o
    // contorno continuam disponíveis.
    backgrounds: { disable: true },

    options: {
      storySort: {
        // Sem isto a ordem NÃO é alfabética, e o '*' engana: quando os DOIS
        // nomes comparados caem no curinga, o comparador do Storybook devolve
        // 0 — empate — e o método default ('configure') deixa a ordem de
        // DESCOBERTA DOS ARQUIVOS decidir. Foi o que pôs as categorias em
        // Disclosure, Feedback, Overlay, Layout, Display: a ordem do primeiro
        // arquivo de cada uma (accordion, alert, alert-dialog, aspect-ratio,
        // avatar). Só 'alphabetical' faz o empate cair no localeCompare.
        //
        // Não afeta o que está NOMEADO na lista abaixo, que continua na ordem
        // escrita, nem os nomes de story dentro de um arquivo — sem
        // 'includeNames', títulos iguais saem do comparador antes disso.
        method: 'alphabetical',
        order: [
          'About', ['Overview', 'Accessibility', 'Analytics', 'SEO and GEO', 'Tone of Voice'],
          'Foundations', ['Getting Started', 'Colors and Themes', 'Typography', 'Spacing', 'Elevation, Borders and Shadows', 'Icons', 'Motion', 'Densities', 'Theme System', 'Internationalization', 'Cross-Stack Divergences'],
          'Primitives', ['*', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']]],
          '*',
        ],
      },
    },
    a11y: {
      test: 'error',
      // WCAG 2.2: target-size (2.5.8) — axe não roda regras 2.2 por default
      config: { rules: [{ id: 'target-size', enabled: true }] },
    },
    docs: {
      codePanel: true,
      canvas: { sourceState: 'shown' },
      source: { type: 'dynamic', excludeDecorators: true },
    },
  },

  globalTypes: {
    brand: {
      description: 'Tema de cor (Default / Warm / Cold)',
      // Tema inicial pelo subdomínio (warm.* / cold.*) — toolbar segue trocável
      defaultValue: getThemeFromSubdomain(),
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'warm', title: 'Warm' },
          { value: 'cold', title: 'Cold' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    density: {
      description: 'Densidade (afeta padding, gap, margin e alturas)',
      defaultValue: 'default',
      toolbar: {
        title: 'Density',
        icon: 'grow',
        items: [
          { value: 'condensado', title: 'Condensado' },
          { value: 'default', title: 'Default' },
          { value: 'confortavel', title: 'Confortável' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    font: {
      description: 'Fonte da interface',
      defaultValue: 'default',
      toolbar: {
        title: 'Font',
        icon: 'type',
        items: [
          { value: 'default', title: 'Inter (padrão)' },
          { value: 'lexend', title: 'Lexend' },
          { value: 'pt-serif', title: 'PT Serif' },
          { value: 'lxgw-wenkai', title: 'LXGW WenKai TC' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    typescale: {
      description: 'Type scale — ratio entre os degraus tipográficos (modelo typescale.com)',
      defaultValue: 'minor-third',
      toolbar: {
        title: 'Type scale',
        icon: 'ruler',
        items: [
          { value: 'minor-second', title: '1.067 — Minor Second' },
          { value: 'major-second', title: '1.125 — Major Second' },
          { value: 'minor-third', title: '1.200 — Minor Third (padrão)' },
          { value: 'major-third', title: '1.250 — Major Third' },
          { value: 'perfect-fourth', title: '1.333 — Perfect Fourth' },
          { value: 'augmented-fourth', title: '1.414 — Augmented Fourth' },
          { value: 'perfect-fifth', title: '1.500 — Perfect Fifth' },
          { value: 'golden', title: '1.618 — Golden Ratio' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    typebase: {
      description: 'Base do type scale (rem — respeita a preferência de fonte do navegador)',
      defaultValue: 'm',
      toolbar: {
        title: 'Type base',
        icon: 'zoom',
        items: [
          { value: 's', title: 'S — 0.875rem' },
          { value: 'm', title: 'M — 1rem (padrão)' },
          { value: 'l', title: 'L — 1.125rem' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
    motion: {
      description: 'Reduced motion — força animações instantâneas (WCAG 2.3.3)',
      defaultValue: 'default',
      toolbar: {
        title: 'Motion',
        icon: 'play',
        items: [
          { value: 'default', title: 'Respeita SO' },
          { value: 'reduce', title: 'Reduzido (forçado)' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
  },

  decorators: [
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Sweep stale portals from previous stories. Vanilla factories portal to
    // document.body and aren't auto-cleaned when Storybook swaps the canvas.
    // This decorator runs synchronously on every render, removing any leftover
    // portal content (popover, sheet/drawer, tooltip, hover-card, dropdown,
    // dialog) before the next story's render/play executes.
    (Story) => {
      if (typeof document !== 'undefined') {
        const stalePortalSelectors = [
          '[data-slot="popover-content"]',
          '[data-slot="sheet-content"]',
          '[data-slot="sheet-overlay"]',
          '[data-slot="tooltip-content"]',
          '[data-slot="hover-card-content"]',
          '[data-slot="dropdown-menu-content"]',
          '[data-slot="dialog-content"]',
          '[data-slot="dialog-overlay"]',
          // Fallback class selectors (defensive — primitives should set data-slot
          // but some still rely on className only).
          '.nds-dropdown-menu-content',
          '.nds-hover-card-content',
          '.nds-popover-content',
          '.nds-tooltip-content',
          '.nds-context-menu-content',
          // Ultimate fallback: any orphan element with overlay role anywhere
          // outside #storybook-root. Stories that build custom menus (e.g.
          // dropdown-menu-compositions uses Tailwind raw classes) won't match
          // data-slot or .nds-* selectors.
          '[role="menu"]',
          '[role="dialog"]',
          '[role="tooltip"]',
          '[role="listbox"]',
        ];
        document
          .querySelectorAll(stalePortalSelectors.join(','))
          .forEach((node) => {
            // Sweep any portal node that lives in <body> outside the canvas root.
            // Most factories portal to document.body directly, but some chain
            // through a positioning wrapper.
            const root = document.getElementById('storybook-root');
            if (!root || !root.contains(node)) {
              node.remove();
            }
          });
      }
      return Story();
    },

    (Story, context) => {
      const brand = (context.globals['brand'] as string) || 'default';
      const density = (context.globals['density'] as string) || 'default';
      const font = (context.globals['font'] as string) || 'default';
      const typescale = (context.globals['typescale'] as string) || 'minor-third';
      const typebase = (context.globals['typebase'] as string) || 'm';
      const motion = (context.globals['motion'] as string) || 'default';
      // useEffect do storybook/preview-api — mesma estratégia do addon-themes.
      // Re-executa em mudança de deps, inclusive em docs autodocs.
      useEffect(() => {
        applyClasses(brand, density, font, typescale, typebase);
        applyMotion(motion);
      }, [brand, density, font, typescale, typebase, motion]);
      return Story();
    },
  ],
};

export default preview;
