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

/**
 * Pacotes que o BUNDLE DO CHAT alcança além dos de cima.
 *
 * O chat do manager é montado a partir das factories do vanilla — é a
 * implementação em DOM do design system, e o manager do Storybook é DOM em
 * todas as stacks. Só que resolução de módulo parte do ARQUIVO que importa: os
 * arquivos são de `nortear-design-system-vanilla/src`, então sem alias eles
 * acham o `node_modules` DO VANILLA e não o da stack que está construindo.
 *
 * Na máquina de quem desenvolve isso passa: as cinco pastas estão instaladas
 * lado a lado, e o build do react fecha verde puxando dependência do vanilla.
 * No CI cada job instala só a própria stack — medido em 2026-09-09, é
 * exatamente o mesmo mecanismo que este arquivo já documenta para o markdown.
 *
 * `lucide` é o motivo de react e vue passarem a declará-lo: as duas usavam só
 * `lucide-react` e `lucide-vue-next`, que são outros pacotes.
 */
export const PACOTES_DO_CHAT = ['clsx', 'dompurify', 'lucide'];

/**
 * Entradas de `resolve.alias` para o bundle do chat de uma stack.
 *
 * @param {string} dirDaStack diretório raiz da stack (onde vive o package.json)
 */
export function aliasDoChat(dirDaStack) {
  const requireDaStack = createRequire(path.join(dirDaStack, 'package.json'));
  return {
    ...aliasDoCompartilhado(dirDaStack),
    ...Object.fromEntries(
      PACOTES_DO_CHAT.map((nome) => [nome, requireDaStack.resolve(nome)]),
    ),
  };
}
