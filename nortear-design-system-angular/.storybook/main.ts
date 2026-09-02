import type { StorybookConfig } from '@storybook/angular-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-designs',
  ],
  framework: {
    // angular-vite (não @storybook/angular): builder Vite, alinhado com as
    // outras quatro stacks e pré-requisito do addon-vitest em browser mode.
    // O caminho webpack do @storybook/angular exige @angular-devkit/build-angular
    // e não roda o storybookTest.
    name: '@storybook/angular-vite',
    options: {
      // compodoc: false — o preset roda `compodoc -p tsconfig.json -e json -d .`
      // e o compodoc atual não aceita mais `-e`, então a etapa falha em todo
      // run (inclusive dentro do vitest). Os controls e a aba API Reference
      // saem de `argTypes` escritos à mão nas stories, não da extração
      // automática — mesma decisão do `docgen: false` no Svelte.
      compodoc: false,
      // Caminho ABSOLUTO: o @analogjs/vite-plugin-angular resolve valor
      // relativo com `resolve(viteRoot, tsconfig)`, e o root do Vite muda entre
      // `storybook dev`, `storybook build` e o storybookTest do vitest.
      //
      // O tsconfig apontado aqui NÃO pode ter `noEmit: true` (ver
      // ../tsconfig.json): o plugin compila cada arquivo pelo emissor do
      // @angular/compiler-cli, e sob `noEmit` o emissor devolve vazio. O plugin
      // então trata o arquivo como fora do programa e o Angular cai no fallback
      // JIT — que compila o decorator (host bindings funcionam) mas não enxerga
      // inputs declarados com `input()`. O sintoma é NG0303 no console com o
      // componente ainda renderizando nos valores default, ou seja: uma story
      // que só exercita o default passa e esconde o defeito.
      tsconfig: path.resolve(dirname, 'tsconfig.json'),
    },
  },
  features: {
    componentsManifest: true,
  },
  viteFinal: async (viteConfig) => {
    // Pré-empacota TODOS os subcaminhos do @radix-ng/primitives de uma vez.
    //
    // Sem isto, o Vite descobre cada subcaminho no momento em que a primeira
    // story o importa e refaz o optimize em rodadas separadas. Um subcaminho
    // que entra tarde traz junto uma SEGUNDA cópia do @angular/core, e as duas
    // não compartilham o estado interno do compilador. O erro que aparece é
    // `Cannot read properties of null (reading 'firstCreatePass')` ou `NG0203`
    // em toda story do componente — parece defeito do componente e não é.
    //
    // Custou tempo em switch, toggle e slider antes de virar esta regra. A
    // lista sai do próprio `exports` do pacote, então componente novo não
    // exige editar este arquivo.
    const { createRequire } = await import('node:module');
    const exigir = createRequire(import.meta.url);
    const exports = exigir('@radix-ng/primitives/package.json').exports as Record<string, unknown>;
    const subcaminhos = Object.keys(exports)
      .filter((k) => k !== './package.json')
      .map((k) => k.replace(/^\.$/, '@radix-ng/primitives').replace(/^\.\//, '@radix-ng/primitives/'));

    viteConfig.optimizeDeps = viteConfig.optimizeDeps ?? {};
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      ...subcaminhos,
      // O `preview.ts` importa daqui (GLOBALS_UPDATED / SET_GLOBALS, o ouvinte
      // de canal da barra de temas), e o otimizador só DESCOBRIA este
      // subcaminho depois que a suíte já tinha começado. O pré-empacotamento
      // mudava no meio da rodada e o Vite RECARREGAVA a página: os arquivos em
      // voo naquele instante morriam com "Vitest failed to find the current
      // suite" e eram contados como `(0 test)`.
      //
      // Medido em 2026-09-01: onze arquivos caíram assim, e um deles era o
      // `docs-smoke.stories.ts` — as 98 docs pages inteiras. A suíte fechou
      // vermelha por outro motivo e ninguém teria reparado que a fumaça não
      // rodou; se os outros vinte testes estivessem verdes, a rodada teria
      // fechado VERDE sem medir a fumaça.
      'storybook/internal/core-events',
    ];

    // `vitest/browser` é módulo virtual do plugin do Vitest, e o otimizador
    // aborta a rodada inteira ao tentar resolvê-lo. As outras quatro stacks já
    // excluíam; esta era a única sem — ver o bloco `rollup.external` abaixo,
    // que cobre o outro lado do mesmo problema.
    viteConfig.optimizeDeps.exclude = [
      ...(viteConfig.optimizeDeps.exclude ?? []),
      'vitest/browser',
    ];

    // O alias precisa ser reaplicado aqui: o framework Angular monta a própria
    // config e não herda o resolve.alias do vite.config.ts raiz.
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string>),
      '@': path.resolve(dirname, '../src'),
      '@shared': path.resolve(dirname, '../../docs/shared'),
    };
    // `vitest/browser` é MÓDULO VIRTUAL do plugin do Vitest, e o build de
    // PRODUÇÃO do Storybook não carrega esse plugin. O
    // `docs/shared/testing/slider-probe.ts` o importa por `await import()`
    // literal de propósito — o especificador precisa chegar ao plugin durante o
    // teste — e conta com o `catch` para cair no DOM fora do modo browser.
    //
    // Sem o plugin, o Rolldown REPROVA a build em vez de deixar o import falhar
    // em runtime. Foi o que derrubou o CI das cinco stacks. Externo, o
    // especificador sobrevive até o navegador, o `import()` rejeita, e o
    // `catch` assume.
    viteConfig.build = viteConfig.build ?? {};
    const rollup = (viteConfig.build.rollupOptions = viteConfig.build.rollupOptions ?? {});
    const externoAnterior = rollup.external;
    rollup.external = (id, ...remainder) => {
      if (id === 'vitest/browser') return true;
      if (typeof externoAnterior === 'function') return externoAnterior(id, ...remainder);
      if (Array.isArray(externoAnterior)) return externoAnterior.includes(id);
      return false;
    };

    return viteConfig;
  },
};

export default config;
