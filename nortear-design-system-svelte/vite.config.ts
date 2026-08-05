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
    // Mesma configuração de cobertura do React — os thresholds valem para o
    // design system inteiro, não por stack.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/components/ui/**/*.{ts,svelte}'],
      exclude: [
        'src/components/ui/**/*.stories.{ts,tsx}',
        'src/components/ui/**/index.ts',
        // Wrappers que só existem para as stories montarem o componente
        // (84 arquivos): são fixture de teste, não superfície do design system.
        'src/components/ui/**/*Story.svelte',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
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
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
