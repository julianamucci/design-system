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
      reporter: ['text', 'html', 'json'],
      include: ['src/components/ui/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**/*.stories.{ts,tsx}',
        'src/components/ui/**/index.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
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
        // Docs pages inteiras passam por axe após a play (suíte de fumaça);
        // páginas pesadas (Icons, Input) estouravam os 15s default sob carga.
        testTimeout: 60000,
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