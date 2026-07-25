import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|ts)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/svelte-vite',
    // docgen: false — desliga o storybook:svelte-docgen-plugin (analisava todos
    // os ~447 .svelte a ~620ms cada = ~4,6 min do build). Os controls/API
    // Reference usam argTypes definidos manualmente nas stories, não a extração
    // automática do docgen, então isso não muda o que aparece na doc.
    options: { docgen: false },
  },
  features: {
    componentsManifest: true,
  },
};

export default config;
