import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { aliasDoCompartilhado } from '../docs/shared/bundler/alias-pacotes.mjs';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Sem plugin Angular aqui: o @storybook/angular-vite injeta o
  // @analogjs/vite-plugin-angular na config final (dev, build e storybookTest).
  // Declará-lo também neste arquivo aplicaria a transformação duas vezes.
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@shared': path.resolve(dirname, '../docs/shared'),
      // Os pacotes npm que o CONTEÚDO COMPARTILHADO importa. Precisam de alias
      // porque a resolução parte do arquivo em `docs/shared` e SOBE — ela nunca
      // entra no `node_modules` desta stack. Ver o porquê medido em
      // `docs/shared/bundler/alias-pacotes.mjs`.
      ...aliasDoCompartilhado(dirname),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/components/ui/**/*.ts'],
      exclude: [
        'src/components/ui/**/*.stories.ts',
        'src/components/ui/**/index.ts',
        // Snippet do painel Code e o teste dele: infra de documentação, não
        // produto. Quem os guarda é o projeto `unit` abaixo, não o threshold de
        // cobertura do primitivo.
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
        // Testes unitários de função pura, em node. Existe pelo mesmo motivo do
        // projeto homônimo do Vanilla: as transforms do painel Code
        // (`<slug>.source.ts`) e o protocolo dos provedores de mídia
        // (`media-embed.ts`) são função pura, e a saída delas não aparece no DOM
        // durante a `play` — nenhuma suíte de navegador as alcança. Entra o
        // argumento, sai o valor, e isso se testa aqui, sem compilador de
        // template no caminho.
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          // Mesmo teto das outras stacks — ver comentário em vanilla/vite.config.ts.
          testTimeout: 120_000,
          browser: {
            enabled: true,
            headless: true,
            // A política de autoplay do navegador recusa `play()` na suíte, e
            // MEDIDO: recusa mesmo com a mídia silenciada e mesmo com `play()`
            // chamado de dentro do manipulador de um clique real do driver —
            // `NotAllowedError` nos três casos, porque o clique sintético não
            // concede ativação do usuário. Sem esta bandeira, componente de
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
