// Snippet do painel Code da repartição do contexto — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve a repartição inteira por extenso, e é de
// propósito: lá os controls mudam quanto cada origem trouxe, e um snippet que
// mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
// Nas demais o que varia é o caso, e as parcelas vêm dos exemplos
// compartilhados — que é justamente o que se quer ensinar, porque é de lá que
// sai a ordem.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

export type ContextBreakdownSnippetOptions = {
  /** Consumido pelas instruções do sistema. */
  system?: number;
  /** Consumido pelo histórico da conversa. */
  history?: number;
  /** Consumido pelos anexos. */
  attachments?: number;
  /** Consumido pelos resultados de ferramenta. */
  tools?: number;
};

/**
 * A linha de import da repartição de exemplo.
 *
 * Ela acompanha TODO ramo que escreve `CONTEXT_PARTS_TYPICAL` no corpo. Dois
 * ramos a esqueciam — o da origem sem rótulo e o de dentro do bloco que expande
 * —, e o snippet ensinava a usar uma constante que ninguém trazia: quem
 * copiasse recebia um `ReferenceError` na primeira linha que executa.
 */
const IMPORT_DOS_EXEMPLOS =
  "import { CONTEXT_PARTS_TYPICAL } from '@shared/primitives/context-breakdown-examples';";

/**
 * A lista de parcelas por extenso, uma por linha.
 *
 * Uma linha por parcela, e não um objeto compacto: a ORDEM é o que a peça
 * preserva, e uma lista em coluna é a forma em que reordenar chama atenção.
 */
function partsLiteral(opts: ContextBreakdownSnippetOptions): string {
  const rows: Array<[string, number]> = [
    ['system', opts.system ?? 0],
    ['history', opts.history ?? 0],
    ['attachments', opts.attachments ?? 0],
    ['tools', opts.tools ?? 0],
  ];
  return [
    '[',
    ...rows.map(([id, tokens]) => `    { id: '${id}', tokens: ${tokens} },`),
    '  ]',
  ].join('\n');
}

function build(opts: ContextBreakdownSnippetOptions): string {
  const lines = options([
    ['parts', partsLiteral(opts)],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('context-breakdown', 'createContextBreakdown'),
    `const contextBreakdown = ${callLine('createContextBreakdown', lines)};`,
    appendLine('contextBreakdown'),
  );
}

/** Transform do `meta` — o Playground, que escreve a repartição por extenso. */
export const contextBreakdownSource: SourceTransform<ContextBreakdownSnippetOptions> = (
  _c,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({
    system: args.system,
    history: args.history,
    attachments: args.attachments,
    tools: args.tools,
  });
};

/**
 * Os casos, percorrendo os exemplos compartilhados.
 *
 * O snippet ensina a IMPORTAR a repartição de exemplo em vez de escrevê-la à
 * mão, que é o mesmo motivo de o módulo compartilhado existir: a ordem das
 * parcelas decide a cor de cada fatia, e cinco listas escritas à mão divergiriam
 * na ordem antes de divergirem no número.
 */
export function contextBreakdownEveryCaseSource(): string {
  return snippet(
    [
      importing('context-breakdown', 'createContextBreakdown'),
      "import {\n  CONTEXT_PARTS_TYPICAL,\n  CONTEXT_PARTS_SLIVER,\n  CONTEXT_PARTS_SINGLE,\n  CONTEXT_PARTS_EMPTY,\n} from '@shared/primitives/context-breakdown-examples';",
    ].join('\n'),
    [
      '// A ordem é a de quem mediu, e a peça não a reordena: parcela que sobe de',
      '// lugar entre um turno e o seguinte faz comparar duas fotos diferentes.',
      'for (const parts of [',
      '  CONTEXT_PARTS_TYPICAL,',
      '  CONTEXT_PARTS_SLIVER,',
      '  CONTEXT_PARTS_SINGLE,',
      '  CONTEXT_PARTS_EMPTY,',
      ']) {',
      "  document.querySelector('#app')?.append(",
      '    createContextBreakdown({ parts, labels: rotulos }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** Uma parcela que vale quase nada — e continua com nome e número. */
export function contextBreakdownSliverSource(): string {
  return build({ system: 1_200, history: 18_400, attachments: 5_300, tools: 100 });
}

/** Uma origem levou tudo, e as outras três continuam na lista, em zero. */
export function contextBreakdownSingleOriginSource(): string {
  return build({ system: 0, history: 25_000, attachments: 0, tools: 0 });
}

/**
 * Nada repartido ainda.
 *
 * As parcelas continuam na lista valendo zero: o vazio aqui é VERDADE, e não a
 * ausência de uma medição — esta peça não precisa de teto para existir.
 */
export function contextBreakdownEmptySource(): string {
  return build({ system: 0, history: 0, attachments: 0, tools: 0 });
}

/**
 * Uma origem sem palavra.
 *
 * O caso se produz TIRANDO um rótulo, e nunca inventando uma parcela: o que
 * falta é o que se sabe dizer sobre a repartição, e não a repartição.
 */
export function contextBreakdownUnlabeledOriginSource(): string {
  return snippet(
    [importing('context-breakdown', 'createContextBreakdown'), IMPORT_DOS_EXEMPLOS].join('\n'),
    [
      '// Sem palavra para a origem, a linha mostra o ENDEREÇO dela. Uma linha em',
      '// branco deixaria a cor sozinha dizendo de qual parcela se trata.',
      'const rotulos = {',
      "  title: 'De onde veio o contexto',",
      "  unit: 'tokens',",
      "  parts: { system: 'Instruções do sistema', history: 'Histórico da conversa' },",
      '};',
    ].join('\n'),
    `const contextBreakdown = ${callLine('createContextBreakdown', options([
      ['parts', 'CONTEXT_PARTS_TYPICAL'],
      ['labels', 'rotulos'],
    ]))};`,
    appendLine('contextBreakdown'),
  );
}

/**
 * A repartição ao lado da medição da janela.
 *
 * As duas são AUTÔNOMAS e respondem perguntas diferentes: uma diz de onde veio
 * o que já foi gasto, a outra diz quanto ainda cabe. Por isso o snippet monta as
 * duas lado a lado, e não passa uma para dentro da outra — e só a segunda
 * recebe teto.
 */
export function contextBreakdownBesideBudgetSource(): string {
  return snippet(
    [
      importing('context-breakdown', 'createContextBreakdown'),
      importing('context-display', 'createContextDisplay'),
      IMPORT_DOS_EXEMPLOS,
    ].join('\n'),
    [
      `const contextBreakdown = ${callLine('createContextBreakdown', options([
        ['parts', 'CONTEXT_PARTS_TYPICAL'],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      '// "De onde veio" se responde sem saber quanto cabe: o teto é da outra.',
      `const contextDisplay = ${callLine('createContextDisplay', options([
        ['usage', '{ input: 18000, output: 7000, limit: 32000 }'],
        ['labels', 'rotulosDaJanela'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(contextDisplay, contextBreakdown);",
  );
}

/**
 * A repartição dentro de um bloco que expande.
 *
 * Recolher é COMPOSIÇÃO, e não recurso da peça: esconder a legenda esconderia
 * justamente o texto que dispensa a cor. Quem precisa dela recolhida põe o
 * controle por fora, onde o teclado já sabe encontrá-lo.
 */
export function contextBreakdownInsideDisclosureSource(): string {
  return snippet(
    [
      importing('context-breakdown', 'createContextBreakdown'),
      importing('collapsible', 'createCollapsible'),
      importing('button', 'createButton'),
      IMPORT_DOS_EXEMPLOS,
    ].join('\n'),
    [
      `const contextBreakdown = ${callLine('createContextBreakdown', options([
        ['parts', 'CONTEXT_PARTS_TYPICAL'],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      '// O controle mora no hospedeiro, e é botão de verdade: recolher a legenda',
      '// esconde o texto que dispensa a cor, então quem o faz assume a decisão.',
      `const bloco = ${callLine('createCollapsible', options([
        ['trigger', "createButton({ variant: 'outline', size: 'sm', label: rotulos.title })"],
        ['content', 'contextBreakdown'],
        ['defaultOpen', 'true'],
      ]))};`,
    ].join('\n'),
    appendLine('bloco'),
  );
}
