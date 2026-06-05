import type { Preview } from '@storybook/html-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect } from 'storybook/preview-api';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

function applyClasses(brand: string, density: string, font: string) {
  const html = document.documentElement;
  const ours = new Set([
    'tema-default', 'tema-warm', 'tema-cold',
    'densidade-default', 'densidade-condensado', 'densidade-confortavel',
    'fonte-default', 'fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai',
  ]);
  const preserved = Array.from(html.classList).filter(c => !ours.has(c));
  html.className = [
    ...preserved,
    `tema-${brand}`,
    `densidade-${density}`,
    `fonte-${font}`,
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
    options: {
      storySort: {
        order: [
          'Foundations',
          'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
          '*',
        ],
      },
    },
    a11y: { test: 'error' },
    docs: {
      codePanel: true,
      canvas: { sourceState: 'shown' },
      source: { type: 'dynamic', excludeDecorators: true },
    },
  },

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

    (Story, context) => {
      const brand = (context.globals['brand'] as string) || 'default';
      const density = (context.globals['density'] as string) || 'default';
      const font = (context.globals['font'] as string) || 'default';
      const motion = (context.globals['motion'] as string) || 'default';
      // useEffect do storybook/preview-api — mesma estratégia do addon-themes.
      // Re-executa em mudança de deps, inclusive em docs autodocs.
      useEffect(() => {
        applyClasses(brand, density, font);
        applyMotion(motion);
      }, [brand, density, font, motion]);
      return Story();
    },
  ],
};

export default preview;
