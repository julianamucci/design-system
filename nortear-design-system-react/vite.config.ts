/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { docsApiPlugin } from '../scripts/vite-plugin-docs-api.ts';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    docsApiPlugin({
      sharedContentPath: path.resolve(dirname, '../docs/shared/content'),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      "@shared": path.resolve(dirname, "../docs/shared"),
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      // json-summary: totais por arquivo num JSON pequeno, para comparar a
      // cobertura de um componente com o que o /quality apurou nele.
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/components/ui/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**/*.stories.{ts,tsx}',
        'src/components/ui/**/*.test.{ts,tsx}',
        'src/components/ui/**/index.ts',
        // Andaime que só existe para as stories montarem o componente: é
        // fixture de teste, não superfície do design system.
        'src/components/ui/**/*.fixtures.{ts,tsx}',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
    projects: [{
      // Os `*.source.ts` são as transforms do painel Code: entra `ctx.args`,
      // sai a string do snippet. A saída do painel NÃO chega ao DOM durante a
      // `play`, então nenhuma suíte de browser a alcança — este projeto de node
      // é a única guarda que elas têm. Os módulos são TS puro, sem import de
      // `.tsx` em valor (só `import type`), justamente para rodar aqui.
      extends: true,
      test: {
        name: 'unit',
        environment: 'node',
        include: ['src/**/*.test.ts'],
      },
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        // Docs pages inteiras passam por axe após a play (suíte de fumaça);
        // páginas pesadas (Icons, Input) estouravam os 15s default sob carga.
        testTimeout: 60000,
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});