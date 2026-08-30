/**
 * Transforms do painel Code do contexto.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve o ITEM por extenso, e é de propósito: lá
 * os controls mudam espécie, recorte e a marca de automático, e um snippet que
 * só mostrasse o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o item é dado de andaime — cinco referências com espécie e
 * recorte —, e despejá-lo faria o painel ensinar o andaime em vez da peça.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ContextArgs = {
  /** Nome da constante da lista que o snippet declara. */
  items?: string;
  /** Espécie do item que o Playground desenha. */
  kind?: string;
  /** Recorte do item do Playground. Vazio quando o item é o todo. */
  detail?: string;
  /** O item do Playground entrou sem ninguém pedir? */
  automatic?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: ContextArgs };

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/** Texto em aspas simples, com a aspa do próprio texto escapada. */
function quoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** O item por extenso, na ordem em que o tipo o declara. */
function itemLiteral(opts: ContextArgs): string {
  const fields = [
    `label: ${quoted('relatorio.ts')}`,
    `kind: ${quoted(opts.kind ?? 'selection')}`,
    opts.detail ? `detail: ${quoted(opts.detail)}` : undefined,
    opts.automatic ? 'automatic: true' : undefined,
  ].filter((field): field is string => field !== undefined);
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

/** O uso real: a lista, os rótulos dela, e onde o pedido de remoção continua. */
export function contextSnippet(opts: ContextArgs = {}): string {
  const attrs = attrsMultilinha([
    '{labels}',
    '{contextLabels}',
    `context={${opts.items ?? itemLiteral(opts)}}`,
    // Item automático não oferece botão de remover, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    !opts.automatic && 'onRemoveContext={(item) => tirar(item.id)}',
  ]);
  return svelteSnippet(IMPORT, `<Composer${attrs} />`);
}

/** Transform do `meta` — o Playground, que escreve o item por extenso. */
export function composerContextSource(_gerado?: unknown, ctx?: StoryContext): string {
  return contextSnippet(ctx?.args ?? {});
}

/** Uma etiqueta por espécie. */
export function contextEveryKindSource(): string {
  return contextSnippet({ items: 'referencias' });
}

/** O trecho, com o recorte que o separa do arquivo inteiro. */
export function contextSelectionSource(): string {
  return contextSnippet({ items: 'trecho' });
}

/** Só o repositório — a espécie mais larga. */
export function contextRepositorySource(): string {
  return contextSnippet({ items: 'repositorio' });
}

/** O que entrou sozinho, sem botão para tirá-lo. */
export function contextAutomaticSource(): string {
  return contextSnippet({ items: 'automaticos', automatic: true });
}

/** A lista junto do campo. */
export function contextWithFieldSource(): string {
  return contextSnippet({ items: 'referencias' });
}

/**
 * O composer SEM contexto.
 *
 * O snippet não passa a lista nem os rótulos dela: sem item a lista não existe,
 * e mostrar as duas props aqui ensinaria a declarar o que não se usa.
 */
export function contextAbsentSource(): string {
  return svelteSnippet(IMPORT, '<Composer {labels} />');
}
