/**
 * ─── A receita do bundle do chat, uma só para as cinco stacks ────────────────
 *
 * POR QUE O CHAT É UM BUNDLE À PARTE, E NÃO UM IMPORT DO MANAGER
 *
 * MEDIDO: o `builder-manager` do Storybook empacota `.storybook/manager.ts` com
 * esbuild usando uma configuração FECHADA — monta as opções à mão e força
 * `addon.tsconfig.json`, um template de duas linhas sem `paths`. O único ponto
 * de extensão é o preset `managerEntries`, que acrescenta ENTRADAS e não
 * resolve nada. Não há hook de alias nem de plugin.
 *
 * Tentar importar as peças direto no `manager.ts` deu 18 erros de resolução.
 * Então o chat é empacotado pelo MESMO Vite que empacota o preview, e o manager
 * o carrega como recurso estático: um arquivo autocontido, sem import solto,
 * porque o esbuild do manager não precisa resolver o que não sobrou.
 *
 * POR QUE `@` APONTA PARA O VANILLA, INCLUSIVE QUANDO QUEM CONSTRÓI É O REACT
 *
 * O widget vive no MANAGER, e o manager do Storybook é DOM puro em todas as
 * cinco — não há React, Vue, Svelte nem Angular ali. A implementação em DOM do
 * design system é a stack vanilla, que esta casa já declara a referência
 * cross-stack. Então as cinco montam o mesmo widget a partir das mesmas
 * factories, e `@` significa "a implementação de referência" — NÃO a stack que
 * está construindo. É a única linha deste arquivo que surpreende, e é
 * deliberada.
 *
 * O bundle não entra no grafo de nenhuma stack: não é compilado pelo `tsc`
 * dela, não vira story e não aparece no catálogo. É um asset.
 */

import path from 'node:path';
import { aliasDoChat } from './alias-pacotes.mjs';

/**
 * O tipo de retorno NÃO é anotado como `import('vite').UserConfig` de
 * propósito: a anotação faz o `tsc` resolver `vite` a partir DESTE arquivo, em
 * `docs/shared/bundler/`, que não alcança o `node_modules` de stack nenhuma —
 * e o resultado é um TS7016 nas cinco, dizendo que o módulo é `any` implícito.
 * Quem tipa é o `defineConfig` no config de cada stack, que resolve `vite` de
 * onde ele de fato está.
 *
 * @param {string} dirDaStack diretório raiz da stack (onde vive o package.json)
 */
export function configDoChat(dirDaStack) {
  const raiz = path.resolve(dirDaStack, '..');
  const compartilhado = path.join(raiz, 'docs/shared');

  return {
    resolve: {
      alias: {
        // A implementação de referência em DOM — ver o cabeçalho.
        '@': path.join(raiz, 'nortear-design-system-vanilla/src'),
        '@shared': compartilhado,
        // Sem isto o bundle acha o `node_modules` DO VANILLA, porque resolução
        // parte do arquivo que importa. Passa na máquina de quem desenvolve,
        // onde as cinco pastas estão instaladas lado a lado, e falha no CI, onde
        // cada job instala só a própria stack.
        ...aliasDoChat(dirDaStack),
      },
    },
    build: {
      // A pasta que o `staticDirs` do `main.ts` serve na raiz do Storybook — é
      // de lá que o `manager-head.html` pede o arquivo.
      outDir: path.join(dirDaStack, '.storybook/public'),
      // Não é build da stack: apagar a pasta levaria junto qualquer outro
      // estático que viva ali.
      emptyOutDir: false,
      // O manager já é servido só para quem tem navegador moderno; não vale
      // pagar transpilação a mais aqui.
      target: 'es2022',
      lib: {
        entry: path.join(compartilhado, 'chat-docs/entry.ts'),
        formats: ['es'],
        fileName: () => 'chat-docs.js',
        cssFileName: 'chat-docs',
      },
    },
  };
}
