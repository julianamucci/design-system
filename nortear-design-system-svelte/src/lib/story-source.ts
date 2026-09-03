/**
 * Ferramentas das transforms do painel Code (`*.source.ts` de cada componente).
 *
 * O painel monta o snippet pelo `sourceDecorator` do `@storybook/svelte`, que
 * lê o nome do componente em `component.__docgen.name` e, com o docgen
 * desligado, cai em `component.name` — o nome interno da função compilada. Daí
 * saía `<wrapper orientation="horizontal"/>`, que não é um componente que
 * alguém possa importar. Cada componente devolve o uso real por
 * `parameters.docs.source.transform`.
 *
 * Nada aqui aparece no snippet: são só as costuras de montagem da string.
 */

/**
 * A tag de fechamento vai concatenada. Escapar a barra (`<\/script>`) é hábito
 * de string dentro de HTML; aqui o arquivo é um módulo TS e o escape vira
 * `no-useless-escape` no lint.
 */
export const END_SCRIPT = '</' + 'script>';

/** Indenta cada linha não vazia com dois espaços (corpo do bloco `<script>`). */
function indentar(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n');
}

/**
 * Monta o snippet Svelte completo: bloco `<script lang="ts">` com os imports
 * (e o estado, quando houver) seguido da marcação.
 *
 * Um `script` vazio devolve só a marcação — há componentes cujo exemplo é puro
 * HTML com classes `.nds-*` e não importa nada.
 */
export function svelteSnippet(script: string, markup: string): string {
  const body = script.trim();
  const marcacao = markup.trim();
  if (!body) return marcacao;
  return `<script lang="ts">\n${indentar(body)}\n${END_SCRIPT}\n\n${marcacao}`;
}

/**
 * A RAIZ da expressão que uma ligação recebe, ou nada quando ela não nomeia
 * constante nenhuma.
 *
 * Serve às transforms que aceitam a expressão dos dados por opção: `trechos`
 * pede declaração, `trechos.slice(0, 3)` pede a declaração de `trechos`, e `[]`
 * não pede nenhuma. Procurar a palavra com fronteira, em vez da raiz, foi o
 * defeito que a stack irmã pagou — `trechosLargos` e `trechosLongos` saíam do
 * snippet sem declaração, e os três exemplos ligavam nome inexistente.
 */
export function raizDaExpressao(expressao: string): string | null {
  return /^([A-Za-z_$][\w$]*)/.exec(expressao.trim())?.[1] ?? null;
}

/**
 * Junta atributos descartando os vazios, e devolve já com o espaço da frente —
 * assim `<Componente${attrs(...)} />` não deixa espaço sobrando quando nenhum
 * atributo difere do padrão.
 *
 * Só o que difere do padrão entra no snippet: repetir valor padrão ensina
 * ruído a quem copia.
 */
export function attrs(...partes: Array<string | false | null | undefined>): string {
  const list = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  return list.length ? ` ${list.join(' ')}` : '';
}

/**
 * Mesma junção de `attrs`, mas quebrando uma linha por atributo quando a
 * lista passa de `limit` caracteres — atributo em fila única longa demais
 * some na barra de rolagem do painel.
 */
export function attrsMultilinha(
  partes: Array<string | false | null | undefined>,
  indentacao = '  ',
  limit = 60,
): string {
  const list = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  if (!list.length) return '';
  const inLine = list.join(' ');
  if (inLine.length <= limit) return ` ${inLine}`;
  return `\n${list.map((parte) => `${indentacao}${parte}`).join('\n')}\n`;
}
