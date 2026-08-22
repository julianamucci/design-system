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
function indentar(texto: string): string {
  return texto
    .split('\n')
    .map((linha) => (linha.trim() ? `  ${linha}` : linha))
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
  const corpo = script.trim();
  const marcacao = markup.trim();
  if (!corpo) return marcacao;
  return `<script lang="ts">\n${indentar(corpo)}\n${END_SCRIPT}\n\n${marcacao}`;
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
  const lista = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  return lista.length ? ` ${lista.join(' ')}` : '';
}

/**
 * Mesma junção de `attrs`, mas quebrando uma linha por atributo quando a
 * lista passa de `limite` caracteres — atributo em fila única longa demais
 * some na barra de rolagem do painel.
 */
export function attrsMultilinha(
  partes: Array<string | false | null | undefined>,
  indentacao = '  ',
  limite = 60,
): string {
  const lista = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  if (!lista.length) return '';
  const inLine = lista.join(' ');
  if (inLine.length <= limite) return ` ${inLine}`;
  return `\n${lista.map((parte) => `${indentacao}${parte}`).join('\n')}\n`;
}
