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
      description: 'Tema de Marca (Multi-tenancy)',
      defaultValue: 'default',
      toolbar: {
        title: 'Marca',
        icon: 'paintbrush',
        items: [
          { value: 'default',   title: 'Nortear (Padrão)'    },
          { value: 'tema-um',   title: 'Crystal (Indigo)'    },
          { value: 'tema-dois', title: 'Industrial (Amber)'  },
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
      const brand = context.globals.brand || 'default';
      const html = document.documentElement;
      html.classList.remove('tema-um', 'tema-dois');
      if (brand !== 'default') html.classList.add(brand);
      return story();
    },
  ],
};

export default preview;