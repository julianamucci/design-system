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
          // 120s como nas outras stacks: a 45s a página Icons encostava no
          // limite (~47s medidos) e falhava conforme a carga da máquina.
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
