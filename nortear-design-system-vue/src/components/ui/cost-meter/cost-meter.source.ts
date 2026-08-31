/**
 * Transforms do painel Code do custo de uma execução.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que o dinheiro chega
 * ESCRITO, e que a fração sai do primitivo compartilhado. As duas juntas são o
 * contrato da peça — quem copiasse só a tag escreveria a moeda dentro do
 * componente na primeira vez que precisasse de outra.
 *
 * Por isso o formatador aparece no snippet, com idioma e moeda explícitos: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 */
import {
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type CostMeterArgs = {
  /** O que a execução custou. */
  spent?: number;
  /** O teto declarado. Zero, ou ausente, significa que não há teto. */
  budget?: number;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { CostMeter } from '@/components/ui/cost-meter';";

/**
 * A conta entra em TODO snippet, inclusive nos que não têm teto: é ela que
 * responde que sem teto não há fração, e um snippet que a escondesse deixaria o
 * leitor achando que a divisão é dele.
 */
const IMPORT_BUDGET = [
  IMPORT,
  "import { spentFraction } from '@shared/primitives/token-budget';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT_BUDGET,
  "import { ContextDisplay } from '@/components/ui/context-display';",
].join('\n');

const IMPORT_AFTER = [
  IMPORT_BUDGET,
  "import { AgentStatus } from '@/components/ui/agent-status';",
].join('\n');

/** O formatador que é de QUEM CONSOME, e nunca do componente. */
function moneyLines(): string {
  return [
    '// O dinheiro chega ESCRITO. Símbolo, posição do símbolo, separador e casas',
    '// decimais são decisão de idioma E de moeda, e quem as conhece é quem mede.',
    "const money = new Intl.NumberFormat('pt-BR', {",
    "  style: 'currency',",
    "  currency: 'USD',",
    '});',
  ].join('\n');
}

/**
 * A tag do custo, só com o que o exemplo precisa dizer.
 *
 * Sem teto o atributo do orçamento não entra: é a AUSÊNCIA dele que produz o
 * caso, e escrever um teto vazio ensinaria a mandar um campo em branco em vez
 * de não mandar campo.
 */
function meterTag(hasBudget: boolean): string {
  const attributes = attrsMultilinha([
    ':amount="amount"',
    hasBudget ? ':budget="budget"' : undefined,
    ':labels="rotulos"',
  ]);
  return `<CostMeter${attributes} />`;
}

function build(opts: CostMeterArgs): string {
  const spent = opts.spent ?? 0;
  const budget = opts.budget ?? 0;
  const hasBudget = budget > 0;

  const script = [
    IMPORT_BUDGET,
    '',
    moneyLines(),
    '',
    hasBudget
      ? [
        `const amount = money.format(${spent});`,
        `const budget = { amount: money.format(${budget}), fraction: spentFraction(${spent}, ${budget}) };`,
      ].join('\n')
      : [
        '// Sem teto declarado não há fração: nem medidor, nem nível, nem por cento.',
        '// A peça fica com a quantia e diz que o teto não foi declarado.',
        `const amount = money.format(${spent});`,
      ].join('\n'),
  ].join('\n');

  return vueSnippet(script, meterTag(hasBudget));
}

/** Transform do `meta` — o Playground, que escreve o gasto e o teto por extenso. */
export const costMeterSource: SourceTransform<CostMeterArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({ spent: args.spent, budget: args.budget });
};

/**
 * Os seis exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA tag atende
 * os seis: o que muda é o gasto, e a peça decide sozinha se há medidor, nível e
 * por cento a desenhar.
 */
export function costMeterEveryCaseSource(): string {
  return vueSnippet(
    [
      IMPORT_BUDGET,
      '',
      moneyLines(),
      '',
      '// Teto zero é ausência de teto, e não teto: a fração sai `null`, e é ela',
      '// que decide se a peça recebe orçamento.',
      'const meters = [',
      '  [0.36, 1],',
      '  [0.75, 1],',
      '  [0.84, 1],',
      '  [0.94, 1],',
      '  [1.24, 1],',
      '  [0.84, 0],',
      '].map(([spent, cap]) => {',
      '  const fraction = spentFraction(spent, cap);',
      '  return {',
      '    amount: money.format(spent),',
      '    budget: fraction === null ? undefined : { amount: money.format(cap), fraction },',
      '  };',
      '});',
    ].join('\n'),
    [
      '<CostMeter',
      '  v-for="(meter, i) in meters"',
      '  :key="i"',
      '  :amount="meter.amount"',
      '  :budget="meter.budget"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/**
 * Os três níveis, do mais folgado ao mais apertado.
 *
 * O snippet mostra a CONTA, e não três quantias escolhidas a dedo: quem lê
 * precisa saber de onde sai o nível, porque é isso que ele não pode reescrever
 * na própria tela.
 */
export function costMeterAllLevelsSource(): string {
  return vueSnippet(
    [
      IMPORT_BUDGET,
      '',
      moneyLines(),
      '',
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      'const meters = [0.36, 0.84, 0.94].map((spent) => ({',
      '  amount: money.format(spent),',
      '  budget: { amount: money.format(1), fraction: spentFraction(spent, 1) },',
      '}));',
    ].join('\n'),
    [
      '<CostMeter',
      '  v-for="(meter, i) in meters"',
      '  :key="i"',
      '  :amount="meter.amount"',
      '  :budget="meter.budget"',
      '  :labels="rotulos"',
      '/>',
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
 * Por isso o snippet monta as duas como IRMÃS, e não passa uma para dentro da
 * outra.
 */
export function costMeterBesideContextSource(): string {
  const body = [
    '<!-- A outra pergunta, sobre a mesma execução: quanto da janela já foi. -->',
    '<ContextDisplay :usage="usage" form="bar" :labels="rotulosDaJanela" />',
    meterTag(true),
  ].join('\n');

  return vueSnippet(
    [
      IMPORT_BESIDE,
      '',
      moneyLines(),
      '',
      'const amount = money.format(0.84);',
      'const budget = { amount: money.format(1), fraction: spentFraction(0.84, 1) };',
      '',
      'const usage = { input: 20000, output: 6880, limit: 32000 };',
    ].join('\n'),
    `<div class="nds-stack nds-max-w-lg" data-spacing="md">\n${indentar(body)}\n</div>`,
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
  const body = [
    '<AgentStatus status="complete" :labels="rotulosDaExecucao" />',
    meterTag(true),
  ].join('\n');

  return vueSnippet(
    [
      IMPORT_AFTER,
      '',
      moneyLines(),
      '',
      'const amount = money.format(0.36);',
      'const budget = { amount: money.format(1), fraction: spentFraction(0.36, 1) };',
    ].join('\n'),
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
