/**
 * Transforms do painel Code do custo de uma execução.
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
 * Cada snippet daqui ensina DUAS coisas, e não uma: que o dinheiro chega
 * ESCRITO, e que a fração sai do primitivo compartilhado. As duas juntas são o
 * contrato da peça — quem copiasse só a marcação escreveria a moeda dentro do
 * componente na primeira vez que precisasse de outra.
 *
 * Por isso o formatador aparece no snippet, com idioma e moeda explícitos: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type CostMeterSnippetOptions = {
  /** O que a execução custou. */
  spent?: number;
  /** O teto declarado. Zero, ou ausente, significa que não há teto. */
  budget?: number;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: CostMeterSnippetOptions };

const IMPORT = "import { CostMeter } from '@/components/ui/cost-meter';";
const IMPORT_BUDGET = "import { spentFraction } from '@shared/primitives/token-budget';";
const IMPORT_CONTEXT = "import { ContextDisplay } from '@/components/ui/context-display';";
const IMPORT_RUN = "import { AgentStatus } from '@/components/ui/agent-status';";

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
const MONEY = [
  '// O dinheiro chega ESCRITO. Símbolo, posição do símbolo, separador e casas',
  '// decimais são decisão de idioma E de moeda, e quem as conhece é quem mede.',
  "const money = new Intl.NumberFormat('pt-BR', {",
  "  style: 'currency',",
  "  currency: 'USD',",
  '});',
].join('\n');

/**
 * O bloco de `<script>`, com a fábrica da conta sempre junto da peça.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm teto: é ela que
 * responde que sem teto não há fração, e um snippet que a escondesse deixaria o
 * leitor achando que a divisão é dele.
 */
function script(opts: { imports?: string[]; after?: string[] } = {}): string {
  return [
    IMPORT,
    IMPORT_BUDGET,
    ...(opts.imports ?? []),
    '',
    MONEY,
    ...(opts.after ?? []),
  ].join('\n');
}

/** O teto em par: a quantia escrita e a fração já calculada. */
function budgetAttribute(spent: number, budget: number): string {
  return `budget={{ amount: money.format(${budget}), fraction: spentFraction(${spent}, ${budget}) }}`;
}

function build(opts: CostMeterSnippetOptions): string {
  const spent = opts.spent ?? 0;
  const budget = opts.budget ?? 0;
  const hasBudget = budget > 0;

  const attributes = attrsMultilinha([
    `amount={money.format(${spent})}`,
    // Sem teto o atributo sai INTEIRO, e não vazio: ausência é a resposta, e
    // um atributo sem valor ensinaria a mandar um campo em branco.
    hasBudget && budgetAttribute(spent, budget),
    '{labels}',
  ]);

  const note = hasBudget
    ? []
    : [
      '',
      '// Sem teto declarado não há fração: nem medidor, nem nível, nem por cento.',
      '// A peça fica com a quantia e diz que o teto não foi declarado.',
    ];

  return svelteSnippet(script({ after: note }), `<CostMeter${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve o gasto e o teto por extenso. */
export function costMeterSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({ spent: args.spent, budget: args.budget });
}

/**
 * Os seis exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA marcação
 * atende os seis: o que muda é o gasto, e a peça decide sozinha se há medidor,
 * nível e por cento a desenhar.
 *
 * Teto zero é ausência de teto, e não teto: a fração sai `null`, e é ela que
 * decide se a peça recebe orçamento.
 */
export function costMeterEveryCaseSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  {#each spending as [spent, cap] (spent)}',
    '    {@const fraction = spentFraction(spent, cap)}',
    '    {#if fraction === null}',
    '      <CostMeter amount={money.format(spent)} {labels} />',
    '    {:else}',
    '      <CostMeter',
    '        amount={money.format(spent)}',
    '        budget={{ amount: money.format(cap), fraction }}',
    '        {labels}',
    '      />',
    '    {/if}',
    '  {/each}',
    '</div>',
  ].join('\n');

  const state = [
    '',
    '// O último par não tem teto: a fração sai nula e a peça perde o medidor.',
    'const spending = [[0.36, 1], [0.75, 1], [0.84, 1], [0.94, 1], [1.24, 1], [0.84, 0]];',
  ].join('\n');

  return svelteSnippet(script({ after: [state] }), markup);
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function costMeterAllLevelsSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  {#each [0.36, 0.84, 0.94] as spent (spent)}',
    '    <CostMeter',
    '      amount={money.format(spent)}',
    '      budget={{ amount: money.format(1), fraction: spentFraction(spent, 1) }}',
    '      {labels}',
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  const note = [
    '',
    '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
    '// sozinha não descreve estado.',
  ].join('\n');

  return svelteSnippet(script({ after: [note] }), markup);
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
 * O que se sabe é quanto custou, e não quanto ainda pode custar — e é isso que a
 * peça diz, em vez de desenhar um trilho vazio que leria como "não gastou nada".
 */
export function costMeterUnboundedSource(): string {
  return build({ spent: 0.84 });
}

/**
 * O custo ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a MESMA execução, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 * Por isso o snippet empilha as duas em sequência, e não passa uma para dentro
 * da outra.
 */
export function costMeterBesideContextSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="md">',
    '  <ContextDisplay',
    '    usage={{ input: 20000, output: 6880, limit: 32000 }}',
    '    form="bar"',
    '    labels={windowLabels}',
    '  />',
    '  <CostMeter',
    '    amount={money.format(0.84)}',
    '    budget={{ amount: money.format(1), fraction: spentFraction(0.84, 1) }}',
    '    labels={costLabels}',
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(script({ imports: [IMPORT_CONTEXT] }), markup);
}

/**
 * O custo no fim de uma execução.
 *
 * A linha de estado diz que terminou; o custo diz quanto isso saiu. Nenhuma das
 * duas sabe da outra — a peça se encaixa sem virar propriedade de quem a
 * hospeda (§4.2 da guideline 17).
 */
export function costMeterAfterRunSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="sm">',
    '  <AgentStatus status="complete" labels={runLabels} />',
    '  <CostMeter',
    '    amount={money.format(0.36)}',
    '    budget={{ amount: money.format(1), fraction: spentFraction(0.36, 1) }}',
    '    labels={costLabels}',
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(script({ imports: [IMPORT_RUN] }), markup);
}
