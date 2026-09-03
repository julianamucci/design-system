/**
 * Snippet do painel Code da repartição do contexto — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a repartição inteira por extenso, e é de
 * propósito: lá os controls mudam quanto cada origem trouxe, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é o caso, e as parcelas vêm dos exemplos
 * compartilhados — que é justamente o que se quer ensinar, porque é de lá que
 * sai a ordem.
 */
import { jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ContextBreakdown } from "@/components/ui/context-breakdown";';

const IMPORT_EXAMPLES =
  "import { CONTEXT_PARTS_TYPICAL } from '@shared/primitives/context-breakdown-examples';";

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: `parts` é `Record` aberto, e a origem que ficasse de fora
 * mostraria o próprio endereço na tela — o defeito que o exemplo justamente não
 * quer ensinar. O caso da origem sem palavra é produzido TIRANDO uma entrada, e
 * tem um snippet só para ele.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  "  title: 'De onde veio o contexto',",
  "  unit: 'tokens',",
  '  parts: {',
  "    system: 'Instruções do sistema',",
  "    history: 'Histórico da conversa',",
  "    attachments: 'Anexos',",
  "    tools: 'Resultados de ferramenta',",
  '  },',
  '};',
].join('\n');

/** Os rótulos da medição da janela, também por inteiro. */
const BUDGET_LABELS_BLOCK = [
  'const rotulosDaJanela = {',
  "  title: 'Uso da janela de contexto',",
  "  level: { normal: 'Com folga', warning: 'Perto do limite', critical: 'No limite' },",
  "  of: 'de',",
  "  unit: 'tokens',",
  "  unbounded: 'Sem teto conhecido',",
  '};',
].join('\n');

/**
 * O preâmbulo do snippet: os imports e os rótulos que a marcação chama.
 *
 * Ele entra em TODOS os ramos, e é o que os torna copiáveis: a versão anterior
 * passava `labels={rotulos}` sem nunca declarar o nome.
 */
function preamble(imports: string[] = [], blocks: string[] = [LABELS_BLOCK]): string {
  const partes = blocks.flatMap((bloco) => ['', bloco]);
  return [[IMPORT, ...imports].join('\n'), ...partes].join('\n');
}

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
  return jsxSnippet(
    preamble(),
    [
      '<ContextBreakdown',
      `  parts={${partsLiteral(opts)}}`,
      '  labels={rotulos}',
      '/>',
    ].join('\n'),
  );
}

/** Transform do `meta` — o Playground, que escreve a repartição por extenso. */
export const contextBreakdownSource: SourceTransform<ContextBreakdownSnippetOptions> = (
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
 * Os casos, percorrendo os exemplos compartilhados.
 *
 * O snippet ensina a IMPORTAR a repartição de exemplo em vez de escrevê-la à
 * mão, que é o mesmo motivo de o módulo compartilhado existir: a ordem das
 * parcelas decide a cor de cada fatia, e cinco listas escritas à mão divergiriam
 * na ordem antes de divergirem no número.
 */
export function contextBreakdownEveryCaseSource(): string {
  return jsxSnippet(
    preamble([
      "import {\n  CONTEXT_PARTS_TYPICAL,\n  CONTEXT_PARTS_SLIVER,\n  CONTEXT_PARTS_SINGLE,\n  CONTEXT_PARTS_EMPTY,\n} from '@shared/primitives/context-breakdown-examples';",
    ]),
    [
      '// A ordem é a de quem mediu, e a peça não a reordena: parcela que sobe de',
      '// lugar entre um turno e o seguinte faz comparar duas fotos diferentes.',
      '[',
      '  CONTEXT_PARTS_TYPICAL,',
      '  CONTEXT_PARTS_SLIVER,',
      '  CONTEXT_PARTS_SINGLE,',
      '  CONTEXT_PARTS_EMPTY,',
      '].map((parts, i) => (',
      '  <ContextBreakdown key={i} parts={parts} labels={rotulos} />',
      '))',
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
  return jsxSnippet(
    [IMPORT, IMPORT_EXAMPLES].join('\n'),
    [
      '// Sem palavra para a origem, a linha mostra o ENDEREÇO dela. Uma linha em',
      '// branco deixaria a cor sozinha dizendo de qual parcela se trata.',
      'const rotulos = {',
      "  title: 'De onde veio o contexto',",
      "  unit: 'tokens',",
      "  parts: { system: 'Instruções do sistema', history: 'Histórico da conversa' },",
      '};',
      '',
      '<ContextBreakdown parts={CONTEXT_PARTS_TYPICAL} labels={rotulos} />',
    ].join('\n'),
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
  return jsxSnippet(
    preamble(
      ['import { ContextDisplay } from "@/components/ui/context-display";', IMPORT_EXAMPLES],
      [LABELS_BLOCK, BUDGET_LABELS_BLOCK],
    ),
    [
      '<div className="nds-stack nds-max-w-lg" data-spacing="md">',
      '  {/* "De onde veio" se responde sem saber quanto cabe: o teto é da outra. */}',
      '  <ContextDisplay',
      '    usage={{ input: 18000, output: 7000, limit: 32000 }}',
      '    labels={rotulosDaJanela}',
      '  />',
      '  <ContextBreakdown parts={CONTEXT_PARTS_TYPICAL} labels={rotulos} />',
      '</div>',
    ].join('\n'),
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
  return jsxSnippet(
    preamble([
      'import {\n  Collapsible,\n  CollapsibleTrigger,\n  CollapsibleContent,\n} from "@/components/ui/collapsible";',
      'import { buttonVariants } from "@/components/ui/button";',
      'import { cn } from "@/lib/utils";',
      IMPORT_EXAMPLES,
    ]),
    [
      '<Collapsible defaultOpen>',
      '  {/* O controle mora no hospedeiro, e é botão de verdade: recolher a',
      '      legenda esconde o texto que dispensa a cor, então quem o faz assume',
      '      a decisão. O gatilho JÁ é o botão — as classes moram nele, e não num',
      '      filho, para que aria-expanded fique no elemento que se aperta. */}',
      '  <CollapsibleTrigger',
      '    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}',
      '  >',
      '    {rotulos.title}',
      '  </CollapsibleTrigger>',
      '  <CollapsibleContent>',
      '    <ContextBreakdown parts={CONTEXT_PARTS_TYPICAL} labels={rotulos} />',
      '  </CollapsibleContent>',
      '</Collapsible>',
    ].join('\n'),
  );
}
