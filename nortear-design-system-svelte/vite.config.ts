/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { docsApiPlugin } from '../scripts/vite-plugin-docs-api.ts';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte(),
    docsApiPlugin({
      sharedContentPath: path.resolve(dirname, '../docs/shared/content'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@shared': path.resolve(dirname, '../docs/shared'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          // Docs pages inteiras sob axe (suíte QA/Docs Smoke) estouram os
          // 15s default do vitest.
          testTimeout: 120_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ contextOptions: { reducedMotion: 'reduce' } }),
            // reducedMotion: em Chromium headless as animações de opacity e
            // transform NÃO avançam — ficam presas no quadro zero com
            // playState "running". Qualquer elemento que entre animando fica
            // em opacity: 0 para sempre e o teste o considera invisível
            // (medido: alert-dialog e dialog falhavam por isso). Emulando
            // reduced-motion, o bloco @media já existente no CSS desliga as
            // animações e o teste vira determinístico — e de quebra exercita
            // o caminho que usuários com essa preferência realmente veem.
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
