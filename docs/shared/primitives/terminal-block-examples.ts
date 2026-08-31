/**
 * A saída de demonstração do bloco de terminal, uma só para as cinco.
 *
 * Mesma razão de `chat-examples.ts` e de `tool-group-examples.ts`, e a regra
 * está escrita na §3.3 da guideline 17: se cada stack escreve a própria saída
 * de exemplo, as cinco stories deixam de fotografar a mesma tela e a
 * divergência só aparece no Chromatic, como diferença de altura e de largura
 * que ninguém consegue atribuir a nada. Aqui isso pesa mais que nas irmãs:
 * saída de terminal é texto PRÉ-FORMATADO, e são as próprias linhas que decidem
 * quando a barra de rolagem horizontal aparece.
 *
 * Nada de framework e nada de i18n: comando e saída não são idioma. O que a
 * `translations.json` carrega são os RÓTULOS da interface — a palavra de cada
 * estado e o molde do código de saída —, não o que a máquina escreveu.
 *
 * ONDE ESTE ARQUIVO DEVERIA MORAR, e por que não mora lá ainda: a §3.3 pede um
 * arquivo por FAMÍLIA (`agent-run-examples.ts`), e é para lá que estas
 * constantes vão quando alguém juntar as da família. O nome por slug segue o
 * precedente de `tool-group-examples.ts`, e tem o mesmo motivo mecânico — a
 * família 2 está sendo construída por mais de uma mão ao mesmo tempo, e um
 * arquivo por família é exatamente o arquivo em que duas mãos colidem.
 */

/** O comando das demonstrações. É o mesmo em toda foto. */
export const TERMINAL_COMMAND = 'npm run build --workspace @nortear/ds';

/**
 * A saída de uma execução que ainda corre.
 *
 * Curta de propósito: o assunto desta é o cursor, e uma parede de texto o
 * empurraria para fora da vista.
 */
export const TERMINAL_LINES_RUNNING: readonly string[] = [
  'vite v7.1.0 building for production...',
  'transforming (412) src/components/ui/terminal-block.ts',
];

/**
 * A saída de uma execução que terminou bem.
 *
 * A tabela de arquivos existe para provar a decisão 7 da folha: as três colunas
 * só ficam alinhadas com avanço fixo e com `white-space: pre`. Em fonte
 * proporcional, ou com quebra automática, o alinhamento que carrega a leitura
 * se desmancha — e é isso que a story fotografa.
 */
export const TERMINAL_LINES_COMPLETE: readonly string[] = [
  'vite v7.1.0 building for production...',
  'transforming (1204) src/main.ts',
  '',
  'dist/index.html                    0.71 kB   gzip:   0.40 kB',
  'dist/assets/index-Bq4Xk2wR.css   142.08 kB   gzip:  19.63 kB',
  'dist/assets/index-D8mZp1Lt.js    486.24 kB   gzip: 152.11 kB',
  '',
  'built in 8.42s',
];

/**
 * A saída de uma execução que quebrou.
 *
 * A linha do erro é LONGA de propósito — mais larga que o bloco —, porque é o
 * caso que a decisão 7 existe para não errar: ela rola na horizontal dentro do
 * próprio bloco, e nunca no corpo da página.
 */
export const TERMINAL_LINES_FAILED: readonly string[] = [
  'vite v7.1.0 building for production...',
  'transforming (318) src/components/ui/terminal-block.ts',
  '',
  'src/components/ui/terminal-block.ts:142:18 - error TS2554: Expected 2 arguments, but got 1. The second argument is required because the factory reads the labels from it.',
  '',
  'ERROR: build failed with 1 error',
];

/**
 * A saída de uma execução que alguém interrompeu.
 *
 * Ela para no meio de uma linha, e é o que um Ctrl-C produz: o fim abrupto é a
 * diferença entre `stopped` e `failed` que se vê sem ler a palavra — mas só se
 * vê, e é por isso que a palavra continua sendo o que descreve.
 */
export const TERMINAL_LINES_STOPPED: readonly string[] = [
  'vite v7.1.0 building for production...',
  'transforming (612) src/components/ui/chat-thread.ts',
  '^C',
];
