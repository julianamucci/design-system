import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/vite-plugin-svelte').Config} */
const config = {
  preprocess: vitePreprocess(),
};

export default config;
