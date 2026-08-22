/**
 * Ferramentas das transforms do painel Code (`*.source.ts` de cada componente).
 *
 * O painel monta o snippet a partir do componente declarado no `meta`, e o que
 * sai é a tag sozinha — `<Carousel orientation="horizontal" />`. A composição
 * que a story renderiza, que é o assunto de quase toda story, não aparece.
 * Cada componente devolve o uso real por `parameters.docs.source.transform`
 * declarado no `meta`, que cascateia para todas as stories do arquivo; uma
 * story cuja composição é estruturalmente diferente declara a sua própria, que
 * vence a do `meta`.
 *
 * Nada daqui aparece no snippet: são só as costuras de montagem da string.
 */

/**
 * A tag de fechamento vai concatenada. Escrever `</script>` inteiro num literal
 * é hábito de string dentro de HTML; aqui o arquivo é um módulo TS, mas o
 * bundler ainda pode servir este código dentro de uma página, e a tag fechando
 * cedo é um erro caro de achar.
 */
export const END_SCRIPT = '</' + 'script>';

/** Indenta cada linha não vazia com `n` espaços. */
export function indentar(texto: string, n = 2): string {
  const espacos = ' '.repeat(n);
  return texto
    .split('\n')
    .map((linha) => (linha.trim() ? `${espacos}${linha}` : linha))
    .join('\n');
}

/**
 * Monta o SFC completo: bloco `<script setup lang="ts">` com os imports (e o
 * estado, quando houver) seguido do `<template>`.
 *
 * O corpo do `script setup` fica na coluna zero, como o prettier do projeto
 * formata um SFC de verdade; o `template` entra indentado em dois espaços.
 *
 * Um `script` vazio devolve só o `<template>` — há componentes cujo exemplo é
 * marcação com classes `.nds-*` e não importa nada.
 */
export function vueSnippet(script: string, template: string): string {
  const corpo = script.trim();
  const marcacao = indentar(template.trim());
  const bloco = `<template>\n${marcacao}\n</template>`;
  if (!corpo) return bloco;
  return `<script setup lang="ts">\n${corpo}\n${END_SCRIPT}\n\n${bloco}`;
}

/**
 * Junta atributos descartando os vazios e devolve já com o espaço da frente —
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
 * Mesma junção de `attrs`, mas quebrando uma linha por atributo quando a fila
 * passa de `limit` caracteres — atributo em linha longa demais some na barra
 * de rolagem do painel.
 */
export function attrsMultilinha(
  partes: Array<string | false | null | undefined>,
  indentacao = '  ',
  limit = 60,
): string {
  const lista = partes.filter((parte): parte is string => Boolean(parte) && parte !== '');
  if (!lista.length) return '';
  const inLine = lista.join(' ');
  if (inLine.length <= limit) return ` ${inLine}`;
  return `\n${lista.map((parte) => `${indentacao}${parte}`).join('\n')}\n`;
}

/**
 * O valor de um control só vira código quando é string.
 *
 * O Storybook troca todo arg de ação por um ESPIÃO — `args.onClick` chega à
 * transform como função, não como o texto que a story escreveu. Interpolado
 * direto, o corpo do mock (`function (){ … }`) aparece no painel como se fosse
 * o exemplo. Da mesma forma, um control de objeto chega como objeto e vira
 * `[object Object]`.
 *
 * Toda leitura de `ctx.args` que possa cair num handler passa por aqui.
 */
export function asCode(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : undefined;
}

/**
 * Texto de atributo, já entre aspas duplas, com padrão para quando o control
 * não trouxer string. Fecha a mesma porta que `asCode`, do lado do texto
 * que o leitor vê renderizado.
 */
export function texto(valor: unknown, padrao = ''): string {
  const bruto = typeof valor === 'string' ? valor : padrao;
  return bruto.replace(/"/g, '&quot;');
}

/**
 * Atributo `nome="valor"` — omitido quando o valor não é string útil ou é
 * igual ao padrão do componente.
 */
export function attr(nome: string, valor: unknown, padrao?: string): string {
  const bruto = asCode(valor);
  if (bruto === undefined) return '';
  if (padrao !== undefined && bruto === padrao) return '';
  return `${nome}="${texto(bruto)}"`;
}

/**
 * Atributo booleano de Vue: `:nome="false"` quando o control desliga algo que
 * nasce ligado, e `nome` puro quando liga algo que nasce desligado.
 */
export function attrBool(nome: string, valor: unknown, padrao: boolean): string {
  if (typeof valor !== 'boolean' || valor === padrao) return '';
  return valor ? nome : `:${nome}="false"`;
}

/**
 * Atributo numérico: `:nome="8"`, omitido quando bate com o padrão do
 * componente ou quando o control não trouxe número.
 */
export function attrNum(nome: string, valor: unknown, padrao?: number): string {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '';
  if (padrao !== undefined && valor === padrao) return '';
  return `:${nome}="${valor}"`;
}

/** Assinatura das transforms: entra o gerado pelo Storybook, sai o snippet. */
export type SourceTransform<A = Record<string, unknown>> = (
  gerado?: string,
  ctx?: { args?: Partial<A> },
) => string;
