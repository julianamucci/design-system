import type { Preview } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

setup((app) => {
  app.use(createPinia());
});

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
      description: 'Style do shadcn (cada tema aplica radius, dimensões e shadows distintos)',
      defaultValue: 'nova',
      toolbar: {
        title: 'Style',
        icon: 'paintbrush',
        items: [
          { value: 'nova', title: 'Nova (padrão)' },
          { value: 'vega', title: 'Vega (clássico)' },
          { value: 'maia', title: 'Maia (friendly)' },
          { value: 'lyra', title: 'Lyra (brutalista)' },
          { value: 'mira', title: 'Mira (minimalista)' },
          { value: 'luma', title: 'Luma (elegante)' },
          { value: 'sera', title: 'Sera (orgânico)' },
        ],
        showName: true,
      },
    },
  },

  decorators: [
    // Decorator 1: manages .dark class
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Decorator 2: manages brand class on <html>
    (story, context) => {
      const brand = context.globals.brand || 'nova';
      const html = document.documentElement;
      html.classList.remove('tema-vega', 'tema-maia', 'tema-lyra', 'tema-mira', 'tema-luma', 'tema-sera');
      if (brand !== 'nova') html.classList.add(`tema-${brand}`);
      return story();
    },
  ],
};

export default preview;