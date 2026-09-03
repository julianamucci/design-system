/**
 * Snippet do painel Code do custo de uma execução — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que o dinheiro chega
 * ESCRITO, e que a fração sai do primitivo compartilhado. As duas juntas são o
 * contrato da peça — quem copiasse só a marcação escreveria a moeda dentro do
 * componente na primeira vez que precisasse de outra.
 *
 * Por isso o formatador aparece no snippet, com idioma e moeda explícitos: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type CostMeterSnippetOptions = {
  /** O que a execução custou. */
  spent?: number;
  /** O teto declarado. Zero, ou ausente, significa que não há teto. */
  budget?: number;
};

/**
 * O bloco de importação, com a peça e a conta compartilhada sempre juntas.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm teto: é ela que
 * responde que sem teto não há fração, e um snippet que a escondesse deixaria o
 * leitor achando que a divisão é dele.
 */
function costImports(...extra: string[]): string {
  return [
    'import { CostMeter } from "@/components/ui/cost-meter";',
    ...extra,
    'import { spentFraction } from "@shared/primitives/token-budget";',
  ].join('\n');
}

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
function moneyLines(): string {
  return [
    '// O dinheiro chega ESCRITO. Símbolo, posição do símbolo, separador e casas',
    '// decimais são decisão de idioma E de moeda, e quem as conhece é quem mede.',
    'const money = new Intl.NumberFormat("pt-BR", {',
    '  style: "currency",',
    '  currency: "USD",',
    '});',
  ].join('\n');
}

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: o `Record` dos níveis é completo por contrato — nível novo
 * no primitivo compartilhado reprova a compilação —, e um objeto pela metade
 * não compila para quem copia. Não há rótulo de unidade: a moeda já está dentro
 * da quantia, e um segundo lugar para escrevê-la seria uma segunda chance de
 * discordar dela.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  title: "Custo desta execução",',
  '  level: { normal: "Com folga", warning: "Perto do teto", critical: "No teto" },',
  '  of: "de",',
  '  unbounded: "Sem teto declarado",',
  '};',
].join('\n');

/** Os rótulos da medição da janela, também por inteiro. */
const WINDOW_LABELS_BLOCK = [
  'const rotulosDaJanela = {',
  '  title: "Uso da janela de contexto",',
  '  level: { normal: "Com folga", warning: "Perto do limite", critical: "No limite" },',
  '  of: "de",',
  '  unit: "tokens",',
  '  unbounded: "Sem teto conhecido",',
  '};',
].join('\n');

/** Os rótulos da linha de estado da execução, também por inteiro. */
const RUN_LABELS_BLOCK = [
  'const rotulosDaExecucao = {',
  '  status: {',
  '    idle: "Em espera",',
  '    running: "Respondendo",',
  '    stopped: "Interrompida",',
  '    complete: "Concluída",',
  '    failed: "Falhou",',
  '  },',
  '  action: { running: "Parar", stopped: "Retomar", failed: "Tentar de novo" },',
  '};',
].join('\n');

/**
 * O que o snippet declara antes da marcação: o formatador e os rótulos.
 *
 * Entra em TODOS os ramos, e é o que os torna copiáveis — a versão anterior
 * passava `labels={rotulos}` sem nunca declarar o nome.
 */
function setupLines(extra: string[] = []): string {
  return [moneyLines(), ...[LABELS_BLOCK, ...extra].flatMap((bloco) => ['', bloco])].join('\n');
}

/** O par do teto, já escrito e com a fração vinda do primitivo. */
function budgetLiteral(spent: number, budget: number): string {
  return `{ amount: money.format(${budget}), fraction: spentFraction(${spent}, ${budget}) }`;
}

function build(opts: CostMeterSnippetOptions): string {
  const spent = opts.spent ?? 0;
  const budget = opts.budget ?? 0;
  const hasBudget = budget > 0;

  const note = hasBudget
    ? []
    : [
      '',
      '// Sem teto declarado não há fração: nem medidor, nem nível, nem por cento.',
      '// A peça fica com a quantia e diz que o teto não foi declarado.',
    ];

  const markup = `<CostMeter${attrsMultilinha([
    `amount={money.format(${spent})}`,
    hasBudget ? `budget={${budgetLiteral(spent, budget)}}` : undefined,
    'labels={rotulos}',
  ])} />`;

  return jsxSnippet(costImports(), [setupLines(), ...note, '', markup].join('\n'));
}

/** Transform do `meta` — o Playground, que escreve o gasto e o teto por extenso. */
export const costMeterSource: SourceTransform<CostMeterSnippetOptions> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({ spent: args.spent, budget: args.budget });
};

/**
 * Os seis exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA marcação
 * atende os seis: o que muda é o gasto, e a peça decide sozinha se há medidor,
 * nível e por cento a desenhar.
 */
export function costMeterEveryCaseSource(): string {
  return jsxSnippet(
    costImports(),
    [
      setupLines(),
      '',
      '// Os seis casos, em pares de gasto e teto. Eles são DECLARADOS aqui: um',
      '// laço sobre um nome que o snippet não declara não compila na mão de quem',
      '// copia.',
      'const gastos = [',
      '  [0.36, 1], // folgado',
      '  [0.75, 1], // o limiar de aviso EM PONTO',
      '  [0.84, 1], // aviso',
      '  [0.94, 1], // crítico',
      '  [1.24, 1], // passou do teto',
      '  [0.84, 0], // teto zero: nenhum teto declarado',
      '];',
      '',
      '// Teto zero é ausência de teto, e não teto: a fração sai `null`, e é ela',
      '// que decide se a peça recebe orçamento.',
      'gastos.map(([spent, budget]) => {',
      '  const fraction = spentFraction(spent, budget);',
      '  // Sem fração, a peça recebe a quantia sozinha: o teto não vira campo em',
      '  // branco, ele simplesmente não é passado.',
      '  if (fraction === null) {',
      '    return <CostMeter key={spent} amount={money.format(spent)} labels={rotulos} />;',
      '  }',
      '  return (',
      '    <CostMeter',
      '      key={spent}',
      '      amount={money.format(spent)}',
      '      budget={{ amount: money.format(budget), fraction }}',
      '      labels={rotulos}',
      '    />',
      '  );',
      '})',
    ].join('\n'),
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function costMeterAllLevelsSource(): string {
  return jsxSnippet(
    costImports(),
    [
      setupLines(),
      '',
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      '[0.36, 0.84, 0.94].map((spent) => (',
      '  <CostMeter',
      '    key={spent}',
      '    amount={money.format(spent)}',
      '    budget={{ amount: money.format(1), fraction: spentFraction(spent, 1) }}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function costMeterAtThresholdSource(): string {
  return build({ spent: 0.75, budget: 1 });
}

/** O gasto passou do teto, e o desenho não tem para onde ir. */
export function costMeterOverBudgetSource(): string {
  return build({ spent: 1.24, budget: 1 });
}

/**
 * Nenhum teto declarado.
 *
 * O que se sabe é quanto custou, e não quanto ainda pode custar — e é isso que
 * a peça diz, em vez de desenhar um trilho vazio que leria como "não gastou
 * nada".
 */
export function costMeterUnboundedSource(): string {
  return build({ spent: 0.84 });
}

/**
 * O custo ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a MESMA execução, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function costMeterBesideContextSource(): string {
  return jsxSnippet(
    costImports('import { ContextDisplay } from "@/components/ui/context-display";'),
    [
      setupLines([WINDOW_LABELS_BLOCK]),
      '',
      '<div className="nds-stack nds-max-w-lg" data-spacing="md">',
      '  {/* A outra pergunta, sobre a mesma execução: quanto da janela já foi. */}',
      '  <ContextDisplay',
      '    usage={{ input: 20000, output: 6880, limit: 32000 }}',
      '    form="bar"',
      '    labels={rotulosDaJanela}',
      '  />',
      '  <CostMeter',
      '    amount={money.format(0.84)}',
      `    budget={${budgetLiteral(0.84, 1)}}`,
      '    labels={rotulos}',
      '  />',
      '</div>',
    ].join('\n'),
  );
}

/**
 * O custo no fim de uma execução.
 *
 * A linha de estado diz que terminou; o custo diz quanto isso saiu. Nenhuma das
 * duas sabe da outra — a peça se encaixa sem virar propriedade de quem a
 * hospeda (§4.2 da guideline 17).
 */
export function costMeterAfterRunSource(): string {
  return jsxSnippet(
    costImports('import { AgentStatus } from "@/components/ui/agent-status";'),
    [
      setupLines([RUN_LABELS_BLOCK]),
      '',
      '<div className="nds-stack nds-max-w-lg" data-spacing="sm">',
      '  <AgentStatus status="complete" labels={rotulosDaExecucao} />',
      '  <CostMeter',
      '    amount={money.format(0.36)}',
      `    budget={${budgetLiteral(0.36, 1)}}`,
      '    labels={rotulos}',
      '  />',
      '</div>',
    ].join('\n'),
  );
}
