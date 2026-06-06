import type { Preview } from '@storybook/react-vite'
import { useEffect, addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { withThemeByClassName } from '@storybook/addon-themes';

function applyClasses(brand: string, density: string, font: string) {
  const html = document.documentElement;
  const ours = new Set([
    'tema-default', 'tema-warm', 'tema-cold',
    'densidade-default', 'densidade-condensado', 'densidade-confortavel',
    'fonte-default', 'fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai',
  ]);
  const preserved = Array.from(html.classList).filter((c) => !ours.has(c));
  html.className = [...preserved, `tema-${brand}`, `densidade-${density}`, `fonte-${font}`].join(' ');
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
    applyClasses(globals.brand || 'default', globals.density || 'default', globals.font || 'default');
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

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Foundations', ['Sobre', 'Comece por Aqui', 'Cores e Temas', 'Tipografia', 'Espaçamento', 'Elevação, Bordas e Sombras', 'Icons', 'Motion', 'Densidades', 'Acessibilidade', 'Tom de Voz', 'Sistema de Temas', 'Internacionalização', 'Analytics', 'SEO e GEO', 'Divergências Cross-Stack'],
          'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
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
    a11y: { test: 'error' },
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
      defaultValue: 'default',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'warm', title: 'Warm' },
          { value: 'cold', title: 'Cold' },
        ],
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
        showName: true,
      },
    },
  },

  decorators: [
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
      const motion = (context.globals.motion as string) || 'default';
      // Aplica no mount inicial das stories (canvas). A reversão pro Default e
      // as páginas MDX são cobertas pela assinatura de canal no topo do módulo.
      useEffect(() => {
        applyClasses(brand, density, font);
        applyMotion(motion);
      }, [brand, density, font, motion]);
      return Story();
    },
  ],
};

export default preview;