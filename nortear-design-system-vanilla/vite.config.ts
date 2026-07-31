import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { docsApiPlugin } from '../scripts/vite-plugin-docs-api.ts';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
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
          // A fumaça das docs pages (docs-smoke) inclui a página Icons, que
          // rende o catálogo lucide inteiro (~2000 ícones) — o scan do axe
          // leva ~20s e estoura o default de 15s. addon-vitest não expõe
          // timeout por story.
          testTimeout: 45_000,
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
