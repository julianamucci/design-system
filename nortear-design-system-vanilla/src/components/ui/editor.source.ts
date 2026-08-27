// Snippet do painel Code do Editor — ver `@/lib/story-source`.

import {
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * A chamada da fábrica, em uma linha enquanto couber.
 *
 * Mesmo desenho do auxiliar do `story-source`, escrito aqui porque os dois nomes
 * de lá (`chamada`, `montar`) são a dívida de idioma que a catraca
 * `identificador_pt_novo` cobra de todo arquivo NOVO que os importa. A correção
 * é no módulo, e o módulo é consumido por 50 arquivos em quatro stacks — troca
 * de contrato, não trabalho de um componente. Enquanto ela não vem, este
 * arquivo não soma dívida.
 */
function factoryCall(factory: string, lines: string[]): string {
  // Sem guarda de lista vazia: `labels` é obrigatório na fábrica e entra em
  // toda chamada. Guarda inalcançável é linha que nenhum teste cobre e que
  // ninguém sabe se ainda vale.
  const oneLine = `${factory}({ ${lines.map((l) => l.replace(/,$/, '')).join(', ')} })`;
  // O limite é de leitura, não de lint: o painel Code é estreito e a quebra
  // acontece de qualquer jeito — melhor onde a gente escolhe.
  if (oneLine.length <= 72) return oneLine;
  return `${factory}({\n${lines.map((l) => `  ${l}`).join('\n')}\n})`;
}

/** Linha final canônica: o elemento devolvido pela fábrica entra na página. */
function appendToPage(variable: string): string {
  return `document.querySelector('#app')?.append(${variable});`;
}

/**
 * O objeto de rótulos, resumido.
 *
 * `labels` é obrigatório e tem 38 nomes de ação: imprimi-los todos afogaria a
 * chamada que o snippet existe para ensinar. O que o leitor precisa levar daqui
 * é a FORMA — quatro grupos de chaves — e a razão de eles serem obrigatórios.
 */
const LABELS_BLOCK = [
  '// Todo botão da barra é só de ícone: o rótulo É o nome acessível que o',
  '// leitor de tela anuncia. Prefira o verbo da ação ao nome da marcação.',
  'const labels = {',
  "  toolbar: 'Formatação',",
  "  editorField: 'Corpo do texto',",
  "  groups: { marks: 'Marcas de texto', headings: 'Títulos', /* … */ },",
  "  actions: { bold: 'Negrito', link: 'Inserir link', table: 'Inserir tabela', /* … */ },",
  "  fields: { link: 'Endereço do link', linkConfirm: 'Aplicar', /* … */ },",
  '};',
].join('\n');

/** O que as stories usam da `EditorOptions` e que o snippet precisa mostrar. */
export type EditorSnippetOptions = {
  /** Conteúdo inicial em HTML. */
  content?: string;
  /** Quando falso, o conteúdo vira leitura. */
  editable?: boolean;
  preset?: 'basic' | 'advanced';
  /** Corpo do resolvedor de armazenamento, quando a story o exercita. */
  resolveImage?: string;
  /** Corpo do serviço de descrição, quando a story o exercita. */
  describeImage?: string;
  /** Corpo do callback de mudança, quando a story o exercita. */
  onChange?: string;
  class?: string;
};

/**
 * Corpo de callback só entra quando é TEXTO.
 *
 * Nos args da story esses campos chegam como função — imprimi-los devolveria
 * `() => {}`, ou pior, `[object Function]`, no painel Code.
 */
function callbackBody(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * As opções da chamada, sem o que a fábrica já assume por padrão.
 *
 * `editable` nasce verdadeiro e `preset` nasce `advanced`: documentação não
 * ensina a repetir o padrão, só o que difere dele.
 */
function commonOptions(o: EditorSnippetOptions): string[] {
  return options([
    ['content', o.content ? text(o.content) : undefined],
    ['editable', o.editable === false ? 'false' : undefined],
    ['preset', o.preset === 'basic' ? text('basic') : undefined],
    ['labels', 'labels'],
    ['onChange', callbackBody(o.onChange)],
    ['resolveImage', callbackBody(o.resolveImage)],
    ['describeImage', callbackBody(o.describeImage)],
    ['class', o.class ? text(o.class) : undefined],
  ]);
}

/** A chamada real de `createEditor`, com os rótulos que ela exige. */
export function editorSnippet(o: EditorSnippetOptions = {}): string {
  return snippet(
    importing('editor', 'createEditor'),
    LABELS_BLOCK,
    `const editor = ${factoryCall('createEditor', commonOptions(o))};`,
    appendToPage('editor'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica.
 */
export const editorSource: SourceTransform<EditorSnippetOptions> = (_gerado, ctx) =>
  editorSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function editorSourceWith(
  fixed: EditorSnippetOptions,
): SourceTransform<EditorSnippetOptions> {
  return (_gerado, ctx) => editorSnippet({ ...ctx.args, ...fixed });
}
