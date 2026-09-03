import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|ts)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
    '@storybook/addon-designs',
  ],
  framework: '@storybook/html-vite',
  features: {
    componentsManifest: true,
  },

  /**
   * `vitest/browser` é MÓDULO VIRTUAL do plugin do Vitest, e o build de
   * PRODUÇÃO do Storybook não carrega esse plugin.
   *
   * `docs/shared/testing/slider-probe.ts` o importa por `await import()`
   * literal, de propósito: o especificador precisa chegar ao plugin para ser
   * resolvido durante o teste. Fora do modo browser, o import falha e o
   * `catch` do próprio arquivo cai no caminho do DOM — que é o desenho.
   *
   * O que o desenho não previu foi o `storybook build`: sem o plugin, o
   * Rolldown não resolve o especificador e REPROVA a build inteira em vez de
   * deixar o import falhar em runtime. Foi o que derrubou o CI das cinco
   * stacks.
   *
   * Marcado como externo, o especificador sobrevive até o navegador, o
   * `import()` rejeita, o `catch` assume e a sonda usa o DOM. Mesmo caminho
   * que ela já toma no painel Interactions.
   */
  viteFinal: async (viteConfig) => {
    /*
     * O MESMO especificador precisa sair do caminho do DEV, e por outro motivo.
     *
     * Abaixo ele é marcado externo para o `storybook build` não reprovar. Em
     * desenvolvimento o problema é outro e pior: o pré-empacotamento de
     * dependências do Vite tenta resolvê-lo, não consegue e ABORTA a rodada
     * inteira — "The following dependencies are imported but could not be
     * resolved: vitest/browser". Sem pré-empacotamento, cada dependência de
     * `node_modules` passa a ser servida como arquivo solto, e abrir uma página
     * vira centenas de requisições.
     *
     * `exclude` diz ao otimizador para não tentar. O import continua falhando
     * em runtime, que é o desenho: `slider-probe.ts` tem `catch` e cai no
     * caminho do DOM fora do modo browser.
     */
    viteConfig.optimizeDeps = viteConfig.optimizeDeps ?? {};

    /**
     * `core-events` é DECLARADO, e não descoberto no meio da suíte.
     *
     * O `preview.ts` importa `storybook/internal/core-events` — é o ouvinte de
     * canal da barra de temas. Sem o sandbox, esse subcaminho não aparece em
     * mais nenhum grafo que o otimizador varra na partida: ele o descobre com a
     * suíte já rodando, o pré-empacotamento muda, a página RECARREGA, e os
     * arquivos em voo morrem com `Vitest failed to find the current suite` —
     * contados como `(0 test)`, que não é arquivo vazio: é arquivo que não
     * reprova. No Angular isso levou junto as 98 docs pages, e a rodada teria
     * fechado verde sem medir um terço de si mesma; no Svelte foram sete
     * arquivos, entre eles `dialog-variants`.
     *
     * Esta stack não tinha a declaração e passou verde hoje — o que prova a
     * ORDEM daquela rodada, não imunidade.
     */
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      'storybook/internal/core-events',
    ];

    viteConfig.optimizeDeps.exclude = [
      ...(viteConfig.optimizeDeps.exclude ?? []),
      'vitest/browser',
    ];

    viteConfig.build = viteConfig.build ?? {};
    const rollup = (viteConfig.build.rollupOptions = viteConfig.build.rollupOptions ?? {});
    const previous = rollup.external;
    rollup.external = (id, ...remainder) => {
      if (id === 'vitest/browser') return true;
      if (typeof previous === 'function') return previous(id, ...remainder);
      if (Array.isArray(previous)) return previous.includes(id);
      return false;
    };
    return viteConfig;
  },
};

export default config;
