import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { Config } from '@sveltejs/vite-plugin-svelte';

const config: Config = {
  preprocess: vitePreprocess(),
};

export default config;
