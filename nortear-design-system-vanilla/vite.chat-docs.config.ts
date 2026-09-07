/**
 * ─── O bundle do chat de documentação, para o MANAGER ────────────────────────
 *
 * **Por que existe um config separado, e por que ele não é gosto.** MEDIDO:
 * o `builder-manager` do Storybook empacota `.storybook/manager.ts` com esbuild
 * usando uma configuração FECHADA — `getConfig` em
 * `storybook/dist/_node-chunks/builder-manager-*.js` monta as opções à mão e
 * força `tsconfig: addon.tsconfig.json`, um template de duas linhas que não tem
 * `paths`. O único ponto de extensão que ele consulta é o preset
 * `managerEntries`, que acrescenta ENTRADAS e não resolve nada. Não há hook de
 * alias, nem de plugin.
 *
 * A consequência, medida ao tentar importar as peças direto no `manager.ts`:
 * 18 erros de resolução. `@/lib/utils` e `@shared/primitives/*` não existem
 * para aquele esbuild — e mesmo declarando um mapa `browser` no
 * `package.json`, que resolve os 12 primeiros, sobram três: os pacotes npm que
 * `docs/shared/primitives/markdown-ast.ts` importa. A resolução parte DAQUELE
 * arquivo e sobe (`docs/shared` → `docs` → raiz), e nunca entra no
 * `node_modules` de stack nenhuma. É exatamente o problema que
 * `docs/shared/bundler/alias-pacotes.mjs` documenta e resolve para o Vite — e
 * que o esbuild do manager não tem como consultar.
 *
 * Então o chat é empacotado pelo MESMO Vite que empacota o preview, com os
 * mesmos aliases, e o manager o carrega como recurso estático. Um arquivo
 * autocontido, sem import solto: o esbuild do manager não precisa resolver
 * nada, porque não sobra nada para resolver.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { aliasDoCompartilhado } from '../docs/shared/bundler/alias-pacotes.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@shared': path.resolve(dirname, '../docs/shared'),
      ...aliasDoCompartilhado(dirname),
    },
  },
  build: {
    // A pasta que o `staticDirs` do `main.ts` serve na raiz do Storybook — é de
    // lá que o `manager-head.html` pede o arquivo.
    outDir: path.resolve(dirname, '.storybook/public'),
    // Não é build da stack: apagar a pasta levaria junto qualquer outro estático.
    emptyOutDir: false,
    // O manager já é servido só para quem tem navegador moderno; não vale
    // pagar transpilação a mais aqui.
    target: 'es2022',
    lib: {
      entry: path.resolve(dirname, '.storybook/chat-docs/entry.ts'),
      formats: ['es'],
      fileName: () => 'chat-docs.js',
      cssFileName: 'chat-docs',
    },
  },
});
