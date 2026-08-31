// Captura de erro no primeiro statement do preview, sem o SDK no chunk de
// entrada: o ouvinte e sincrono e nao importa nada. O Faro entra ocioso e
// reproduz o que o buffer guardou. O porque esta no primitivo compartilhado.
import { bufferarErros, iniciarFaroQuandoOcioso, marcarStory } from '@shared/primitives/faro';
import '../src/lib/reload-on-chunk-error';
import { getThemeFromSubdomain } from '@shared/themes/theme-config';
import type { Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { provideZonelessChangeDetection } from '@angular/core';
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect, addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
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
  { stack: 'angular', env: import.meta.env },
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

function applyClasses(
  brand: string,
  density: string,
  font: string,
  typescale: string,
  typebase: string,
) {
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
  html.className = [
    ...preserved,
    `tema-${brand}`,
    `densidade-${density}`,
    `fonte-${font}`,
    `escala-${typescale}`,
    `base-tipo-${typebase}`,
  ].join(' ');
}

function applyMotion(motion: string) {
  const html = document.documentElement;
  if (motion === 'reduce') html.dataset['reducedMotion'] = 'true';
  else delete html.dataset['reducedMotion'];
}

// Assinatura direta do canal do preview. O manager emite GLOBALS_UPDATED em
// TODA mudança de toolbar — inclusive ao voltar pro Default —, mas o decorator
// não re-roda nesse caso, então o cascade de tema não revertia: a classe
// `tema-*` anterior ficava no <html>. Páginas MDX não-atreladas (ex: "Cores e
// Temas") também não passam pelo decorator. Ouvir o canal resolve os dois.
//
// Ficou invisível enquanto os três temas tinham o MESMO raio: só a cor
// revertia errado, e cor de tema muda pouco entre default e warm. Com o warm
// em 32px de base, voltar ao Default deixando o canto arredondado é evidente.
//
// react, vue e svelte já tinham isto; vanilla e angular nasceram sem.
// Guard `typeof document` evita execução na indexação em Node (sem canal e
// sem DOM).
if (typeof document !== 'undefined') {
  const onGlobals = ({ globals = {} }: { globals?: Record<string, string> }) => {
    applyClasses(
      globals['brand'] || 'default',
      globals['density'] || 'default',
      globals['font'] || 'default',
      globals['typescale'] || 'minor-third',
      globals['typebase'] || 'm',
    );
    applyMotion(globals['motion'] || 'default');
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

const preview: Preview = {
  decorators: [
    // Zoneless: o Radix NG é signals-first e o Angular 21+ não precisa de
    // zone.js. Declarado aqui (e não em cada story) para que todas as stories
    // e o bridge do withAutoDocsTab rodem sob o mesmo modo de detecção.
    applicationConfig({
      providers: [provideZonelessChangeDetection()],
    }),

    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Varre portais órfãos deixados pela story anterior. O Storybook troca o
    // canvas sem destruir o que foi projetado em document.body — mesma
    // necessidade das outras stacks.
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
          '.nds-dropdown-menu-content',
          '.nds-hover-card-content',
          '.nds-popover-content',
          '.nds-tooltip-content',
          '.nds-context-menu-content',
          '[role="menu"]',
          '[role="dialog"]',
          '[role="tooltip"]',
          '[role="listbox"]',
        ];
        document.querySelectorAll(stalePortalSelectors.join(',')).forEach((node) => {
          const root = document.getElementById('storybook-root');
          if (!root || !root.contains(node)) node.remove();
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
      useEffect(() => {
        applyClasses(brand, density, font, typescale, typebase);
        applyMotion(motion);
      }, [brand, density, font, typescale, typebase, motion]);
      return Story();
    },
  ],

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
          // A ordem é a dos RÓTULOS EM pt-BR, não a dos títulos em inglês: a sidebar
          // ordena pelo título e exibe o rótulo traduzido, e as duas ordens
          // deixaram de coincidir quando "Disclosure" virou "Expansão". Sem esta
          // lista, quem lê em português vê "Conversacional, Expansão, Display".
          // O preço é simétrico: em inglês, Disclosure sai uma posição depois de
          // Display. Só existe uma lista, e ela ordena strings que não são as
          // que aparecem na tela.
          // A ordem de dentro de cada categoria se repete por extenso, e não sai
          // de uma constante: o indexador estático da Storybook lê este arquivo
          // sem executá-lo e recusa `storySort` que não seja literal — com
          // identificador ele aborta a inicialização dos projetos do vitest, e
          // a suíte de navegador das cinco stacks para de subir sem que o build
          // ou o lint acusem nada.
          'Primitives', [
            'Conversational', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],   // Conversacional
            'Display', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],          // Display
            'Disclosure', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],       // Expansão
            'Feedback', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],         // Feedback
            'Form', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],             // Formulário
            'Layout', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],           // Layout
            'Navigation', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],       // Navegação
            'Overlay', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],          // Overlay
            'Tables', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],           // Tabelas
            '*', ['*', ['Docs', 'Playground', 'Variants', 'Sizes', 'Compositions', 'States', '*']],                // categoria nova cai aqui, no fim
          ],
          '*',
        ],
      },
    },
    a11y: {
      test: 'error',
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
};

export default preview;
