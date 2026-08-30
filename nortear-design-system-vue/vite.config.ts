/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': path.resolve(dirname, '../docs/shared'),
    }
  },
  test: {
    // Mesma configuração de cobertura do React — os thresholds valem para o
    // design system inteiro, não por stack.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/components/ui/**/*.{ts,vue}'],
      exclude: [
        'src/components/ui/**/*.stories.{ts,tsx}',
        'src/components/ui/**/*.test.ts',
        'src/components/ui/**/index.ts',
        // Fixtures que só existem para as stories montarem: são andaime de
        // teste, não superfície do design system.
        'src/components/ui/**/*.fixtures.ts',
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
      // `.vue`, justamente para rodar aqui.
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
        // 120s: a fumaça das docs pages (QA/Docs Smoke) monta páginas inteiras
        // e o axe varre tudo — IconsDocs (grid completo do lucide) leva ~75s.
        testTimeout: 120000,
        hookTimeout: 30000,
        browser: {
          enabled: true,
          headless: true,
          // MEDIDO: sem a bandeira, `play()` é recusado com `NotAllowedError`
          // — mesmo com a mídia silenciada e mesmo chamado de dentro do
          // manipulador de um clique real do driver, porque o clique sintético
          // não concede ativação do usuário
          // (`navigator.userActivation.hasBeenActive` é `false` na suíte). Sem
          // ela, componente de mídia é intestável.
          provider: playwright({
            launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
          }),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});