import type { Preview } from '@storybook/svelte-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { setMode } from 'mode-watcher';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

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
          { value: 'default',   title: 'Nortear (Padrão)'   },
          { value: 'tema-um',   title: 'Crystal (Indigo)'   },
          { value: 'tema-dois', title: 'Industrial (Amber)' },
        ],
        // @ts-expect-error — showName is valid at runtime but missing in some type definitions
        showName: true,
      },
    },
  },

  decorators: [
    // Decorator 1: manages .dark class via addon-themes
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Decorator 2: manages brand class on <html> + syncs mode-watcher with Storybook theme
    (Story, context) => {
      const brand = context.globals.brand || 'default';
      const html = document.documentElement;
      html.classList.remove('tema-um', 'tema-dois');
      if (brand !== 'default') html.classList.add(brand);
      queueMicrotask(() => {
        setMode(html.classList.contains('dark') ? 'dark' : 'light');
      });
      return Story();
    },
  ],
};

export default preview;
