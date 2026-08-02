/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { docsApiPlugin } from '../scripts/vite-plugin-docs-api.ts';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    vue(),
    docsApiPlugin({
      sharedContentPath: path.resolve(dirname, '../docs/shared/content'),
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': path.resolve(dirname, '../docs/shared'),
    }
  },
  test: {
    projects: [{
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
          provider: playwright({ contextOptions: { reducedMotion: 'reduce' } }),
          // reducedMotion: em Chromium headless as animações de opacity e
          // transform NÃO avançam — ficam presas no quadro zero com
          // playState "running". Qualquer elemento que entre animando fica
          // em opacity: 0 para sempre e o teste o considera invisível
          // (medido: alert-dialog e dialog falhavam por isso). Emulando
          // reduced-motion, o bloco @media já existente no CSS desliga as
          // animações e o teste vira determinístico — e de quebra exercita
          // o caminho que usuários com essa preferência realmente veem.
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});