import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/svelte-vite';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/**
 * Todos os subcaminhos `@lucide/svelte/icons/*` que o código importa.
 *
 * Varre `src/` e a pasta compartilhada em vez de manter uma lista à mão: ícone
 * novo entra sozinho. Ver o comentário no `viteFinal` para o defeito que isto
 * evita.
 */
async function coletarIconesLucide(): Promise<string[]> {
  const ESPECIFICADOR = /@lucide\/svelte\/icons\/[a-z0-9-]+/g;
  const encontrados = new Set<string>();

  async function varrer(dir: string): Promise<void> {
    let entradas;
    try {
      entradas = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entrada of entradas) {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
        await varrer(caminho);
      } else if (/\.(ts|svelte)$/.test(entrada.name)) {
        const fonte = await readFile(caminho, 'utf8');
        for (const achado of fonte.matchAll(ESPECIFICADOR)) encontrados.add(achado[0]);
      }
    }
  }

  await varrer(join(RAIZ, 'src'));
  await varrer(join(RAIZ, '..', 'docs', 'shared'));
  return [...encontrados].sort();
}

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
  framework: {
    name: '@storybook/svelte-vite',
    // docgen: false — desliga o storybook:svelte-docgen-plugin (analisava todos
    // os ~447 .svelte a ~620ms cada = ~4,6 min do build). Os controls/API
    // Reference usam argTypes definidos manualmente nas stories, não a extração
    // automática do docgen, então isso não muda o que aparece na doc.
    options: { docgen: false },
  },
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

    /*
     * SUBCAMINHO DESCOBERTO TARDE MATA ARQUIVO EM VOO.
     *
     * O otimizador do Vite pré-empacota o que ele consegue rastrear a partir
     * de um entrypoint. Desde que o sandbox saiu (2026-09-02) não há
     * entrypoint de aplicação: um subcaminho importado no fundo de um
     * componente só é DESCOBERTO quando a story dele abre — no meio da suíte.
     * Aí o pré-empacotamento muda, o Vite RECARREGA a página, e todo arquivo
     * em voo naquele instante morre com "Vitest failed to find the current
     * suite". Ele é contado como `(0 test)`, não como falha: some da contagem
     * e a rodada fecha VERDE medindo menos.
     *
     * Dois causadores medidos, um em cada stack:
     *
     * - `storybook/internal/core-events` — o `preview.ts` importa daqui
     *   (GLOBALS_UPDATED / SET_GLOBALS / UPDATE_GLOBALS, o ouvinte de canal da
     *   barra de temas). No Angular, 2026-09-01: onze arquivos caíram assim, e
     *   um deles era o `docs-smoke.stories.ts` — as docs pages inteiras.
     *
     * - `@lucide/svelte/icons/*` — cada ícone é um subcaminho próprio. Nesta
     *   stack, 2026-09-03: `dependency optimized:
     *   @lucide/svelte/icons/unlink` (importado por `ui/editor/editor.svelte`)
     *   → `optimized dependencies changed. reloading`, e SETE arquivos
     *   morreram, entre eles `dialog-variants` e `context-menu-compositions`.
     *
     * A lista de ícones sai da varredura do próprio código, e não escrita à
     * mão, para que ícone novo não exija editar este arquivo.
     */
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      ...(await coletarIconesLucide()),
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
