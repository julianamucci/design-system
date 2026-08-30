/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte(),
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
        'src/components/ui/**/*.test.ts',
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
        // Os `*.source.ts` são as transforms do painel Code: entra `ctx.args`,
        // sai a string do snippet. A saída do painel NÃO chega ao DOM durante a
        // `play`, então nenhuma suíte de browser a alcança — este projeto de
        // node é a única guarda que elas têm. Os módulos são TS puro, sem
        // import de `.svelte`, justamente para rodar aqui.
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
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
            // A política de autoplay do navegador recusa `play()` na suíte, e
            // MEDIDO: recusa mesmo com a mídia silenciada e mesmo com `play()`
            // chamado de dentro do manipulador de um clique real do driver —
            // `NotAllowedError` nos três casos. Sem esta bandeira, componente de
            // mídia é intestável: nenhuma asserção alcança reprodução.
            //
            // Ela afrouxa a política SÓ no navegador de teste. A política de
            // verdade continua valendo para quem usa, e é por isso que o player
            // não presume que `play()` funciona: ele trata a recusa.
            provider: playwright({
              launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
