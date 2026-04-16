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
      description: 'Tema de Marca (Multi-tenancy)',
      defaultValue: 'default',
      toolbar: {
        title: 'Marca',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Nortear (Padrão)' },
          { value: 'tema-um', title: 'Crystal (Indigo)' },
          { value: 'tema-dois', title: 'Industrial (Amber)' },
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

    // 2. Gerencia a Marca (Brand Theme) via classe manual na tag html
    (Story, context) => {
      const brand = context.globals.brand || 'default';
      
      useEffect(() => {
        const brands = ['tema-um', 'tema-dois'];
        const html = document.documentElement;
        
        // Remove classes de outras marcas
        html.classList.remove(...brands);
        
        // Adiciona a classe da marca selecionada (se não for default)
        if (brand !== 'default') {
          html.classList.add(brand);
        }
      }, [brand]);

      return Story();
    },
  ],
};

export default preview;