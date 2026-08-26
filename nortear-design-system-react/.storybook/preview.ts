// Faro primeiro, antes de qualquer import: e o que garante captura de erro
// desde o carregamento. No-op silencioso sem STORYBOOK_FARO_URL.
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { startFaro, marcarStory } from '@shared/primitives/faro';
import '../src/lib/reload-on-chunk-error';
import { getThemeFromSubdomain } from '@shared/themes/theme-config';
import type { Preview, Decorator } from '@storybook/react-vite'
import { useEffect, addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { withThemeByClassName } from '@storybook/addon-themes';

// Decorator que reseta scroll-lock entre stories. Stories de Dialog/Popover/
// DropdownMenu/Sheet/Drawer abrem portais que aplicam `pointer-events: none`,
// `overflow: hidden`, `data-scroll-locked`, `aria-hidden` ou `inert` no <body>.
// Quando a story fecha, esses estados às vezes vazam para a próxima story.
// Limpamos no início de cada Story para garantir DOM neutro.
const scrollLockCleanupDecorator: Decorator = (Story) => {
  if (typeof document !== 'undefined') {
    const body = document.body;
    // Remove estilos inline de scroll-lock que portais podem ter vazado
    body.style.removeProperty('pointer-events');
    body.style.removeProperty('overflow');
    body.style.removeProperty('padding-right');
    body.style.removeProperty('margin-right');
    // Remove atributos que portais podem ter setado
    body.removeAttribute('data-scroll-locked');
    body.removeAttribute('aria-hidden');
    body.removeAttribute('inert');
    const root = document.getElementById('storybook-root');
    if (root) {
      root.removeAttribute('aria-hidden');
      root.removeAttribute('inert');
    }
    // Remove órfãos de portais que possam ter sobrado de stories anteriores.
    // Inclui fallback: qualquer overlay (dialog/menu/tooltip/listbox) que esteja
    // FORA de #storybook-root é resíduo de portal de story anterior.
    const selectors = [
      '[data-base-ui-popup-root]:empty',
      '[data-base-ui-portal]:empty',
      '[data-state="closed"][role="dialog"]',
      '[data-state="closed"][role="tooltip"]',
      '[data-state="closed"][role="menu"]',
      '[data-state="closed"][role="listbox"]',
      '[role="dialog"]',
      '[role="menu"]',
      '[role="tooltip"]',
      '[role="listbox"]',
    ];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      if (root && root.contains(el)) return;
      if (el.contains(document.activeElement)) return;
      el.remove();
    });
  }
  return Story();
};

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
  const preserved = Array.from(html.classList).filter((c) => !ours.has(c));
  html.className = [...preserved, `tema-${brand}`, `densidade-${density}`, `fonte-${font}`, `escala-${typescale}`, `base-tipo-${typebase}`].join(' ');
}

// Aplica `data-reduced-motion` no <html>. 'reduce' força o override do
// motion.css (zera durações). 'default' remove o atributo — passa a respeitar
// o @media (prefers-reduced-motion) do SO.
function applyMotion(motion: string) {
  const html = document.documentElement;
  if (motion === 'reduce') html.dataset.reducedMotion = 'true';
  else delete html.dataset.reducedMotion;
}

// Assinatura direta do canal do preview. O manager emite GLOBALS_UPDATED em
// TODA mudança de toolbar — inclusive ao voltar pro Default — mas os renderers
// react/vue/svelte pulam o re-render do decorator nesse caso, então o effect
// do decorator não re-roda e o cascade de tema não revertia. Páginas MDX
// não-atreladas (ex: "Cores e Temas") também não rodam o decorator. Ouvir o
// canal resolve os dois casos. Guard `typeof document` evita execução durante
// a indexação no Node (onde não há canal nem DOM).
if (typeof document !== 'undefined') {
  const onGlobals = ({ globals = {} }: { globals?: Record<string, string> }) => {
    applyClasses(globals.brand || 'default', globals.density || 'default', globals.font || 'default', globals.typescale || 'minor-third', globals.typebase || 'm');
    applyMotion(globals.motion || 'default');
  };
  const subscribe = () => {
    try {
      const channel = addons.getChannel();
      channel.on(GLOBALS_UPDATED, onGlobals);
      channel.on(SET_GLOBALS, onGlobals);
    } catch {
      setTimeout(subscribe, 50);
    }
  };
  subscribe();
}
import '../src/styles/globals.css'
import '../src/styles/storybook-docs.css'

startFaro(
  { initializeFaro, getWebInstrumentations, TracingInstrumentation },
  { stack: 'react', env: import.meta.env },
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
        order: [
          'About', ['Overview', 'Accessibility', 'Analytics', 'SEO and GEO', 'Tone of Voice'],
          'Foundations', ['Getting Started', 'Colors and Themes', 'Typography', 'Spacing', 'Elevation, Borders and Shadows', 'Icons', 'Motion', 'Densities', 'Theme System', 'Internationalization', 'Cross-Stack Divergences'],
          'UI', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],
          '*',
        ],
      },
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
      // WCAG 2.2: target-size (2.5.8) — axe não roda regras 2.2 por default
      config: { rules: [{ id: 'target-size', enabled: true }] },
    },
    docs: {
      codePanel: true,
      canvas: {
        sourceState: 'shown',
      },
      source: {
        type: 'dynamic',
        excludeDecorators: true,
      },
    },
  },

  // Definição do seletor de Marca na barra de ferramentas
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
    // 0. Cleanup de scroll-lock vazado por portais de stories anteriores
    scrollLockCleanupDecorator,

    // 1. Gerencia Light/Dark Mode (via addon-themes)
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // 2. Gerencia brand + densidade + fonte via reconstrução atômica do
    //    className do <html>. Sempre aplica `tema-${brand}` (incl. tema-default,
    //    que re-declara os tokens em default.css) para que voltar ao Default
    //    vindo de Warm/Cold reverta o cascade. Preserva 'dark' (addon-themes).
    (Story, context) => {
      const brand = (context.globals.brand as string) || 'default';
      const density = (context.globals.density as string) || 'default';
      const font = (context.globals.font as string) || 'default';
      const typescale = (context.globals.typescale as string) || 'minor-third';
      const typebase = (context.globals.typebase as string) || 'm';
      const motion = (context.globals.motion as string) || 'default';
      // Aplica no mount inicial das stories (canvas). A reversão pro Default e
      // as páginas MDX são cobertas pela assinatura de canal no topo do módulo.
      useEffect(() => {
        applyClasses(brand, density, font, typescale, typebase);
        applyMotion(motion);
      }, [brand, density, font, typescale, typebase, motion]);
      return Story();
    },
  ],
};

export default preview;