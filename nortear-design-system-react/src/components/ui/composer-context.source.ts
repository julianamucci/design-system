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
 * Nas demais a lista chega RESUMIDA, com o comentário dizendo que é resumo.
 *
 * RESUMIDA, E NUNCA ELIDIDA: a versão anterior citava `labels` sem nunca
 * declará-lo, e quem copiava recebia um símbolo indefinido na primeira
 * renderização. Os dois objetos de rótulo entram inteiros — o campo exige os
 * seis, e a lista exige a palavra de todas as espécies, porque o tipo é
 * `Record` completo justamente para que espécie sem palavra reprove a
 * compilação em vez de desenhar uma etiqueta vazia.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { Composer } from "@/components/ui/composer";';

/** Os rótulos do campo, por inteiro. `{key}` e `{max}` são moldes. */
const LABELS_BLOCK = [
  'const labels = {',
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  '};',
].join('\n');

/** Os rótulos da lista, por inteiro. `{label}` vira o nome do item. */
const CONTEXT_LABELS_BLOCK = [
  'const contextLabels = {',
  '  list: "Contexto",',
  '  remove: "Remover {label}",',
  '  kind: {',
  '    selection: "Trecho",',
  '    file: "Arquivo",',
  '    directory: "Pasta",',
  '    page: "Página",',
  '    repository: "Repositório",',
  '  },',
  '  automatic: "Automático",',
  '};',
].join('\n');

/** A lista de cada ramo, pelo nome com que o ramo a cita. */
const CONTEXT_LISTS: Record<string, string[]> = {
  referencias: [
    '// A lista do exemplo tem uma etiqueta por espécie — aqui, as três',
    '// primeiras, da mais estreita para a mais larga.',
    'const referencias = [',
    '  { id: "c1", label: "relatorio.ts", kind: "selection", detail: "linhas 12–48" },',
    '  { id: "c2", label: "medidas.csv", kind: "file" },',
    '  { id: "c3", label: "src/fachada", kind: "directory" },',
    '];',
  ],
  trecho: [
    'const trecho = [',
    '  { id: "c1", label: "relatorio.ts", kind: "selection", detail: "linhas 12–48" },',
    '];',
  ],
  repositorio: [
    'const repositorio = [',
    '  { id: "c5", label: "nortear/obra", kind: "repository" },',
    '];',
  ],
  automaticos: [
    'const automaticos = [',
    '  { id: "c2", label: "Painel de medidas", kind: "page", automatic: true },',
    '];',
  ],
};

/**
 * O que se faz com o pedido de remoção.
 *
 * Uma linha, e o corpo é de quem consome: a peça relata o pedido e não tira
 * nada da lista sozinha.
 */
const REMOVE_BLOCK = 'const tirar = (id) => { /* … */ };';

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

/** O import, a lista do ramo, os dois objetos de rótulo e o manipulador. */
function preamble(items: string, withRemove: boolean): string {
  const parts = [IMPORT, ''];
  const list = CONTEXT_LISTS[items];
  if (list !== undefined) parts.push(list.join('\n'), '');
  parts.push(LABELS_BLOCK, '', CONTEXT_LABELS_BLOCK);
  if (withRemove) parts.push('', REMOVE_BLOCK);
  return parts.join('\n');
}

function build(opts: ContextSnippetOptions, items: string): string {
  const withRemove = opts.automatic !== true;
  return jsxSnippet(
    preamble(items, withRemove),
    `<Composer${attrsMultilinha([
      'labels={labels}',
      'contextLabels={contextLabels}',
      `context={${items}}`,
      // Item automático não oferece botão de remover, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      withRemove ? 'onRemoveContext={(item) => tirar(item.id)}' : undefined,
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
  return jsxSnippet([IMPORT, '', LABELS_BLOCK].join('\n'), '<Composer labels={labels} />');
}
