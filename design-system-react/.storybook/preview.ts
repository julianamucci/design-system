import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect } from 'react';
import '../src/styles/globals.css'
import '../src/styles/storybook-docs.css'

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
    // 1. Gerencia Light/Dark Mode (via addon-themes)
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // 2. Gerencia o Style (tema) via classe manual na tag html
    (Story, context) => {
      const brand = context.globals.brand || 'nova';

      useEffect(() => {
        const themeClasses = ['tema-vega', 'tema-maia', 'tema-lyra', 'tema-mira', 'tema-luma', 'tema-sera'];
        const html = document.documentElement;

        // Remove classes de outros temas
        html.classList.remove(...themeClasses);

        // Nova é o default (sem classe); outros aplicam via .tema-<id>
        if (brand !== 'nova') {
          html.classList.add(`tema-${brand}`);
        }
      }, [brand]);

      return Story();
    },
  ],
};

export default preview;