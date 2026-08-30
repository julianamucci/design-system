/**
 * Snippet do painel Code do contexto — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
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
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

export type ContextSnippetOptions = {
  /** Espécie do item que o Playground desenha. */
  kind?: string;
  /** Recorte do item do Playground. Vazio quando o item é o todo. */
  detail?: string;
  /** O item do Playground entrou sem ninguém pedir? */
  automatic?: boolean;
};

/** O item por extenso, na ordem em que o tipo o declara. */
function itemLiteral(opts: ContextSnippetOptions): string {
  const detail = text(opts.detail);
  const fields = [
    'label: "relatorio.ts"',
    `kind: "${text(opts.kind) ?? 'selection'}"`,
    detail === undefined ? undefined : `detail: "${detail}"`,
    opts.automatic === true ? 'automatic: true' : undefined,
  ].filter((field): field is string => field !== undefined);
  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

function build(opts: ContextSnippetOptions, items: string): string {
  return jsxSnippet(
    IMPORT,
    `<Composer${attrsMultilinha([
      'labels={labels}',
      'contextLabels={contextLabels}',
      `context={${items}}`,
      // Item automático não oferece botão de remover, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      opts.automatic === true ? undefined : 'onRemoveContext={(item) => tirar(item.id)}',
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve o item por extenso. */
export const composerContextSource: SourceTransform<ContextSnippetOptions> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build(args, itemLiteral(args));
};

/** Uma etiqueta por espécie. */
export function contextEveryKindSource(): string {
  return build({}, 'referencias');
}

/** O trecho, com o recorte que o separa do arquivo inteiro. */
export function contextSelectionSource(): string {
  return build({}, 'trecho');
}

/** Só o repositório — a espécie mais larga. */
export function contextRepositorySource(): string {
  return build({}, 'repositorio');
}

/** O que entrou sozinho, sem botão para tirá-lo. */
export function contextAutomaticSource(): string {
  return build({ automatic: true }, 'automaticos');
}

/** A lista junto do campo. */
export function contextWithFieldSource(): string {
  return build({}, 'referencias');
}

/**
 * O composer SEM contexto.
 *
 * O snippet não passa a lista nem os rótulos dela: sem item a lista não existe,
 * e mostrar as duas props aqui ensinaria a declarar o que não se usa.
 */
export function contextAbsentSource(): string {
  return jsxSnippet(IMPORT, '<Composer labels={labels} />');
}
