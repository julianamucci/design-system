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
  },

  decorators: [
    // Decorator 1: manages .dark class via addon-themes
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Decorator 2: manages brand class on <html> + syncs mode-watcher
    (Story, context) => {
      const brand = context.globals.brand || 'default';
      const html = document.documentElement;
      html.classList.remove('tema-warm', 'tema-cold');
      if (brand !== 'default') html.classList.add(`tema-${brand}`);
      queueMicrotask(() => {
        setMode(html.classList.contains('dark') ? 'dark' : 'light');
      });
      return Story();
    },

    // Decorator 3: manages density class on <html>
    (Story, context) => {
      const density = context.globals.density || 'default';
      const html = document.documentElement;
      html.classList.remove('densidade-condensado', 'densidade-confortavel');
      if (density !== 'default') html.classList.add(`densidade-${density}`);
      return Story();
    },

    // Decorator 4: manages font class on <html>
    (Story, context) => {
      const font = context.globals.font || 'default';
      const html = document.documentElement;
      html.classList.remove('fonte-lexend', 'fonte-pt-serif', 'fonte-lxgw-wenkai');
      if (font !== 'default') html.classList.add(`fonte-${font}`);
      return Story();
    },
  ],
};

export default preview;
