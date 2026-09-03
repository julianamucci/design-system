/**
 * Transforms do painel Code da repartição do contexto.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a repartição inteira por extenso, e é de
 * propósito: lá os controls mudam quanto cada origem trouxe, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é a repartição, e ela vem dos exemplos compartilhados
 * — que é justamente o que se quer ensinar, porque é de lá que sai a ordem.
 */
import { attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ContextBreakdownArgs = {
  /** Consumido pelas instruções do sistema. */
  system?: number;
  /** Consumido pelo histórico da conversa. */
  history?: number;
  /** Consumido pelos anexos. */
  attachments?: number;
  /** Consumido pelos resultados de ferramenta. */
  tools?: number;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ContextBreakdown } from '@/components/ui/context-breakdown';";

const IMPORT_EVERY_CASE = [
  IMPORT,
  'import {',
  '  CONTEXT_PARTS_TYPICAL,',
  '  CONTEXT_PARTS_SLIVER,',
  '  CONTEXT_PARTS_SINGLE,',
  '  CONTEXT_PARTS_EMPTY,',
  "} from '@shared/primitives/context-breakdown-examples';",
].join('\n');

const IMPORT_TYPICAL = [
  IMPORT,
  "import { CONTEXT_PARTS_TYPICAL } from '@shared/primitives/context-breakdown-examples';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT_TYPICAL,
  "import { ContextDisplay } from '@/components/ui/context-display';",
].join('\n');

/**
 * Os rótulos da MEDIÇÃO DA JANELA, que entra ao lado da repartição.
 *
 * A peça vizinha é autônoma e tem o vocabulário dela: o exemplo ligava
 * `:labels="rotulosDaJanela"` sem declarar em lugar nenhum, e quem copiasse
 * recebia a irmã sem uma palavra para dizer.
 */
const SETUP_BESIDE = [
  IMPORT_BESIDE,
  '',
  'const rotulosDaJanela = {',
  "  title: 'Uso da janela de contexto',",
  "  level: { normal: 'Com folga', warning: 'Perto do limite', critical: 'No limite' },",
  "  of: 'de',",
  "  unit: 'tokens',",
  "  unbounded: 'Sem teto conhecido',",
  '};',
].join('\n');

const IMPORT_DISCLOSURE = [
  IMPORT_TYPICAL,
  'import {',
  '  Collapsible,',
  '  CollapsibleContent,',
  '  CollapsibleTrigger,',
  "} from '@/components/ui/collapsible';",
].join('\n');

/**
 * A lista de parcelas por extenso, uma por linha.
 *
 * Uma linha por parcela, e não um objeto compacto: a ORDEM é o que a peça
 * preserva, e uma lista em coluna é a forma em que reordenar chama atenção.
 */
function partsLiteral(opts: ContextBreakdownArgs): string {
  const rows: Array<[string, number]> = [
    ['system', opts.system ?? 0],
    ['history', opts.history ?? 0],
    ['attachments', opts.attachments ?? 0],
    ['tools', opts.tools ?? 0],
  ];
  return [
    'const parcelas = [',
    ...rows.map(([id, tokens]) => `  { id: '${id}', tokens: ${tokens} },`),
    '];',
  ].join('\n');
}

/** A tag da repartição, com a lista que o exemplo tiver montado. */
function breakdownTag(parts: string): string {
  return `<ContextBreakdown${attrsMultilinha([`:parts="${parts}"`, ':labels="rotulos"'])} />`;
}

function build(opts: ContextBreakdownArgs): string {
  return vueSnippet(
    [
      IMPORT,
      '',
      '// A ordem é a de quem mediu, e a peça não a reordena.',
      partsLiteral(opts),
    ].join('\n'),
    breakdownTag('parcelas'),
  );
}

/** Transform do `meta` — o Playground, que escreve a repartição por extenso. */
export const contextBreakdownSource: SourceTransform<ContextBreakdownArgs> = (
  _generated,
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
 * As quatro repartições, percorrendo os exemplos compartilhados.
 *
 * O snippet ensina a IMPORTAR a repartição de exemplo em vez de escrevê-la à
 * mão, que é o mesmo motivo de o módulo compartilhado existir: a ordem das
 * parcelas decide a cor de cada fatia, e cinco listas escritas à mão divergiriam
 * na ordem antes de divergirem no número.
 */
export function contextBreakdownEveryCaseSource(): string {
  return vueSnippet(
    [
      IMPORT_EVERY_CASE,
      '',
      '// A ordem é a de quem mediu, e a peça não a reordena: parcela que sobe de',
      '// lugar entre um turno e o seguinte faz comparar duas fotos diferentes.',
      'const reparticoes = [',
      '  CONTEXT_PARTS_TYPICAL,',
      '  CONTEXT_PARTS_SLIVER,',
      '  CONTEXT_PARTS_SINGLE,',
      '  CONTEXT_PARTS_EMPTY,',
      '];',
    ].join('\n'),
    [
      '<ContextBreakdown',
      '  v-for="(parcelas, i) in reparticoes"',
      '  :key="i"',
      '  :parts="parcelas"',
      '  :labels="rotulos"',
      '/>',
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
 * O snippet se produz TIRANDO um rótulo, e nunca inventando uma parcela: o que
 * falta é o que se sabe dizer sobre a repartição, e não a repartição.
 */
export function contextBreakdownUnlabeledOriginSource(): string {
  return vueSnippet(
    [
      IMPORT_TYPICAL,
      '',
      '// Sem palavra para a origem, a linha mostra o ENDEREÇO dela. Uma linha em',
      '// branco deixaria a cor sozinha dizendo de qual parcela se trata.',
      'const rotulos = {',
      "  title: 'De onde veio o contexto',",
      "  unit: 'tokens',",
      "  parts: { system: 'Instruções do sistema', history: 'Histórico da conversa' },",
      '};',
    ].join('\n'),
    breakdownTag('CONTEXT_PARTS_TYPICAL'),
  );
}

/**
 * A repartição ao lado da medição da janela.
 *
 * As duas são AUTÔNOMAS e respondem perguntas diferentes: uma diz de onde veio
 * o que já foi gasto, a outra diz quanto ainda cabe. Por isso o snippet monta as
 * duas como irmãs, e não passa uma para dentro da outra — e só a segunda recebe
 * teto.
 */
export function contextBreakdownBesideBudgetSource(): string {
  const body = [
    '<!-- "De onde veio" se responde sem saber quanto cabe: o teto é da outra. -->',
    '<ContextDisplay',
    '  :usage="{ input: 18000, output: 7000, limit: 32000 }"',
    '  :labels="rotulosDaJanela"',
    '/>',
    breakdownTag('CONTEXT_PARTS_TYPICAL'),
  ].join('\n');

  return vueSnippet(
    SETUP_BESIDE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="md">\n${indentar(body)}\n</div>`,
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
  const body = [
    '<!-- O controle mora no hospedeiro, e é botão de verdade: recolher a legenda',
    '     esconde o texto que dispensa a cor, então quem o faz assume a decisão. -->',
    '<CollapsibleTrigger class="nds-button nds-button-outline nds-button-sm">',
    '  {{ rotulos.title }}',
    '</CollapsibleTrigger>',
    '<CollapsibleContent>',
    indentar(breakdownTag('CONTEXT_PARTS_TYPICAL')),
    '</CollapsibleContent>',
  ].join('\n');

  return vueSnippet(
    IMPORT_DISCLOSURE,
    `<Collapsible class="nds-max-w-lg" :default-open="true">\n${indentar(body)}\n</Collapsible>`,
  );
}
