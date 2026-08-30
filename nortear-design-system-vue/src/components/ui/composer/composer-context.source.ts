/**
 * Transforms do painel Code do contexto.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import { attrsMultilinha, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

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
  /** O snippet declara a lista por extenso, no bloco de script? */
  inline?: boolean;
};

const IMPORT = "import { Composer } from '@/components/ui/composer';";

/** O item por extenso, na ordem em que o tipo o declara. */
function itemLiteral(opts: ContextArgs): string {
  const fields = [
    `label: '${text('relatorio.ts')}'`,
    `kind: '${text(opts.kind, 'selection')}'`,
    opts.detail ? `detail: '${text(opts.detail)}'` : undefined,
    opts.automatic ? 'automatic: true' : undefined,
  ].filter((field): field is string => field !== undefined);
  return `const referencias = [\n  { ${fields.join(', ')} },\n];`;
}

/**
 * O `@remove-context` entra sempre que HÁ o que tirar.
 *
 * Sem ele o snippet ensinaria uma lista de onde não se tira nada — e o
 * componente não tira por conta própria, de propósito: quem monta a pergunta é
 * quem sabe o que sobra sem aquele item. Item automático não oferece botão de
 * remover, então ali o ouvinte não teria como disparar: mostrá-lo ensinaria a
 * ligar um fio solto.
 */
export function contextSnippet(opts: ContextArgs = {}): string {
  const items = opts.items ?? 'referencias';
  const attrs = attrsMultilinha([
    ':labels="rotulos"',
    ':context-labels="rotulosDoContexto"',
    `:context="${items}"`,
    !opts.automatic && '@remove-context="tirar"',
  ]);
  const script = opts.inline ? `${IMPORT}\n\n${itemLiteral(opts)}` : IMPORT;
  return vueSnippet(script, `<Composer${attrs} />`);
}

/** Transform do `meta` — o Playground, que escreve o item por extenso. */
export const composerContextSource: SourceTransform<ContextArgs> = (_gerado, ctx) =>
  contextSnippet({ ...(ctx?.args ?? {}), inline: true });

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
  return vueSnippet(IMPORT, '<Composer :labels="rotulos" />');
}
