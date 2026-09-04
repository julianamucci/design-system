import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Pacotes npm importados pelo CONTEÚDO COMPARTILHADO, e o alias que os torna
 * alcançáveis a partir de cada stack.
 *
 * O problema que isto resolve, medido no CI em 2026-09-04: resolução de módulo
 * parte do ARQUIVO que importa e SOBE o sistema de arquivos. Para
 * `docs/shared/primitives/markdown-ast.ts` o caminho é `docs/shared` → `docs` →
 * raiz do monorepo — e nunca entra no `node_modules` de stack nenhuma.
 * Declarar a dependência nas cinco stacks, que é onde ela deve estar, NÃO a
 * torna alcançável dali.
 *
 * Na máquina de quem desenvolve isso passava despercebido porque havia um
 * `node_modules` na raiz. No runner não há — e não deve haver: quem instala é
 * cada stack. As cinco reprovavam o `build-storybook` com "Rolldown failed to
 * resolve import", e nenhum outro portão via, porque `tsc` resolve TIPO e não
 * resolve empacotamento.
 *
 * O alias aponta para o ARQUIVO de entrada, não para a pasta do pacote: os três
 * são ESM puro, sem `main`, e só declaram `exports`. Pasta sem `main` não
 * resolve.
 *
 * A lista mora aqui, e não copiada em cinco configs, porque a próxima adição ao
 * compartilhado tem de chegar às cinco de uma vez — cinco cópias divergem, e a
 * divergência só aparece no CI de uma stack.
 */
export const PACOTES_DO_COMPARTILHADO = [
  'mdast-util-from-markdown',
  'mdast-util-gfm',
  'micromark-extension-gfm',
];

/**
 * Entradas de `resolve.alias` para uma stack.
 *
 * @param {string} dirDaStack diretório raiz da stack (onde vive o package.json)
 */
export function aliasDoCompartilhado(dirDaStack) {
  const requireDaStack = createRequire(path.join(dirDaStack, 'package.json'));
  return Object.fromEntries(
    PACOTES_DO_COMPARTILHADO.map((nome) => [nome, requireDaStack.resolve(nome)]),
  );
}
