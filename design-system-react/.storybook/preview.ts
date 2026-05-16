import type { Preview } from '@storybook/react-vite'
import { useEffect } from 'react';
import { withThemeByClassName } from '@storybook/addon-themes';
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

    // 2. Gerencia o tema de cor (Default / Warm / Cold) via classe no <html>
    (Story, context) => {
      const brand = context.globals.brand || 'default';

      useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('tema-warm', 'tema-cold');
        if (brand !== 'default') {
          html.classList.add(`tema-${brand}`);
        }
      }, [brand]);

      return Story();
    },

    // 3. Gerencia a densidade (condensado / default / confortável) via classe
    (Story, context) => {
      const density = context.globals.density || 'default';

      useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('densidade-condensado', 'densidade-confortavel');
        if (density !== 'default') {
          html.classList.add(`densidade-${density}`);
        }
      }, [density]);

      return Story();
    },

    // 4. Gerencia a fonte (Inter padrão / Lexend / PT Serif / LXGW WenKai) via classe
    (Story, context) => {
      const font = context.globals.font || 'default';

      useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai');
        if (font !== 'default') {
          html.classList.add(`fonte-${font}`);
        }
      }, [font]);

      return Story();
    },
  ],
};

export default preview;