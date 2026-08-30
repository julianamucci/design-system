import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
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
      include: ['src/components/ui/**/*.ts'],
      exclude: [
        'src/components/ui/**/*.stories.{ts,tsx}',
        'src/components/ui/**/index.ts',
        // Snippet do painel Code e o teste dele: infra de documentação, não
        // produto. Quem os guarda é o projeto `unit` abaixo, não o threshold
        // de cobertura do primitivo.
        'src/components/ui/**/*.source.ts',
        'src/components/ui/**/*.test.ts',
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
        // Testes unitários de função pura, em node. Existe por causa das
        // transforms do painel Code (`<slug>.source.ts`): a saída do painel não
        // aparece no DOM durante a `play`, então nenhuma suíte de browser a
        // alcança. Entra `ctx.args`, sai a string — e isso se testa aqui.
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
            // Sem emulação de prefers-reduced-motion: as animações rodam de
            // verdade, como para a maioria dos usuários. Asserção de abertura
            // de portal usa waitForPortal() (src/lib/wait-for-portal.ts).
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
