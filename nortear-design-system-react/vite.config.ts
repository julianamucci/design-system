/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { aliasDoCompartilhado } from '../docs/shared/bundler/alias-pacotes.mjs';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      "@shared": path.resolve(dirname, "../docs/shared"),
      // Os pacotes npm que o CONTEÚDO COMPARTILHADO importa. Precisam de alias
      // porque a resolução parte do arquivo em `docs/shared` e SOBE — ela nunca
      // entra no `node_modules` desta stack. Ver o porquê medido em
      // `docs/shared/bundler/alias-pacotes.mjs`.
      ...aliasDoCompartilhado(dirname),
    }
  },
  /*
   * Pré-empacotar as entradas do base-ui que a suíte usa.
   *
   * Sem isto, o optimizer descobre um subcaminho novo NO MEIO da rodada,
   * reotimiza e recarrega — e o Vite invalida as URLs dos módulos já
   * importados. Medido em cache frio no combobox: as doze stories falharam
   * juntas com `Failed to fetch dynamically imported module`, e passaram na
   * segunda rodada só porque o cache já estava quente. Num CI com
   * `node_modules/.cache` limpo, isso é a suíte inteira reprovando por infra —
   * e a leitura fácil seria culpar o componente novo.
   */
  optimizeDeps: {
    // `echarts-for-react/esm/core` entra pelo mesmo motivo: é subcaminho de
    // pacote, e o Chart passou a importá-lo em vez do `echarts-for-react` raiz
    // (ver o comentário do import em `ui/chart.tsx`). Medido: na primeira
    // rodada depois da troca o otimizador o descobriu no meio da suíte, avisou
    // `optimized dependencies changed. reloading` e a story do radar reprovou
    // com `Failed to fetch dynamically imported module` — o mesmo defeito de
    // infra do combobox, num pacote novo.
    include: ["@base-ui/react/combobox", "echarts-for-react/esm/core"],
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
        //
        // 120s, e não 60s, porque a página que o comentário acima nomeia passou
        // a estourar: `Icons` roda axe sobre o catálogo inteiro e, sob a carga
        // da suíte cheia, cruza o minuto — isolada, fecha em folga. As outras
        // quatro stacks já orçavam 120s para esta mesma classe de teste; o
        // React era o destoante, com um valor que ninguém tinha medido.
        testTimeout: 120_000,
        browser: {
          enabled: true,
          headless: true,
          // A política de autoplay do navegador recusa `play()` na suíte, e
          // MEDIDO: recusa mesmo com a mídia silenciada e mesmo com `play()`
          // chamado de dentro do manipulador de um clique real do driver —
          // `NotAllowedError` nos três casos, porque o clique sintético não
          // concede ativação do usuário (`navigator.userActivation
          // .hasBeenActive` é false). Sem esta bandeira, componente de mídia é
          // intestável: nenhuma asserção alcança reprodução.
          //
          // Ela afrouxa a política SÓ no navegador de teste. A política de
          // verdade continua valendo para quem usa, e é por isso que o player
          // não presume que `play()` funciona: ele trata a recusa.
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