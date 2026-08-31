// Snippet do painel Code do custo de uma execução — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// Cada snippet daqui ensina DUAS coisas, e não uma: que o dinheiro chega
// ESCRITO, e que a fração sai do primitivo compartilhado. As duas juntas são o
// contrato da peça — quem copiasse só a chamada da fábrica escreveria a moeda
// dentro do componente na primeira vez que precisasse de outra.
//
// Por isso o formatador aparece no snippet, com idioma e moeda explícitos: é
// ele que o leitor precisa reconhecer como SEU, e não do design system.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

export type CostMeterSnippetOptions = {
  /** O que a execução custou. */
  spent?: number;
  /** O teto declarado. Zero, ou ausente, significa que não há teto. */
  budget?: number;
};

/**
 * O bloco de importação, com a fábrica e a conta compartilhada sempre juntas.
 *
 * A conta entra em TODO snippet, inclusive nos que não têm teto: é ela que
 * responde que sem teto não há fração, e um snippet que a escondesse deixaria o
 * leitor achando que a divisão é dele.
 */
function costImports(...extra: string[]): string {
  return [
    importing('cost-meter', 'createCostMeter'),
    ...extra,
    "import { spentFraction } from '@shared/primitives/token-budget';",
  ].join('\n');
}

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

function build(opts: CostMeterSnippetOptions): string {
  const spent = opts.spent ?? 0;
  const budget = opts.budget ?? 0;
  const hasBudget = budget > 0;

  const lines = options([
    ['amount', `money.format(${spent})`],
    [
      'budget',
      hasBudget
        ? `{ amount: money.format(${budget}), fraction: spentFraction(${spent}, ${budget}) }`
        : undefined,
    ],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    costImports(),
    moneyLines(),
    hasBudget
      ? undefined
      : [
        '// Sem teto declarado não há fração: nem medidor, nem nível, nem por cento.',
        '// A peça fica com a quantia e diz que o teto não foi declarado.',
      ].join('\n'),
    `const costMeter = ${callLine('createCostMeter', lines)};`,
    appendLine('costMeter'),
  );
}

/** Transform do `meta` — o Playground, que escreve o gasto e o teto por extenso. */
export const costMeterSource: SourceTransform<CostMeterSnippetOptions> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({ spent: args.spent, budget: args.budget });
};

/**
 * Os seis exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA chamada
 * atende os seis: o que muda é o gasto, e a peça decide sozinha se há medidor,
 * nível e por cento a desenhar.
 */
export function costMeterEveryCaseSource(): string {
  return snippet(
    costImports(),
    moneyLines(),
    [
      '// Teto zero é ausência de teto, e não teto: a fração sai `null`, e é ela',
      '// que decide se a peça recebe orçamento.',
      'for (const [spent, budget] of [',
      '  [0.36, 1],',
      '  [0.75, 1],',
      '  [0.84, 1],',
      '  [0.94, 1],',
      '  [1.24, 1],',
      '  [0.84, 0],',
      ']) {',
      '  const fraction = spentFraction(spent, budget);',
      "  document.querySelector('#app')?.append(",
      '    createCostMeter({',
      '      amount: money.format(spent),',
      '      budget: fraction === null',
      '        ? undefined',
      '        : { amount: money.format(budget), fraction },',
      '      labels: rotulos,',
      '    }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function costMeterSourceAllLevels(): string {
  return snippet(
    costImports(),
    moneyLines(),
    [
      '// A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '// sozinha não descreve estado.',
      'for (const spent of [0.36, 0.84, 0.94]) {',
      "  document.querySelector('#app')?.append(",
      '    createCostMeter({',
      '      amount: money.format(spent),',
      '      budget: { amount: money.format(1), fraction: spentFraction(spent, 1) },',
      '      labels: rotulos,',
      '    }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function costMeterSourceAtThreshold(): string {
  return build({ spent: 0.75, budget: 1 });
}

/** O gasto passou do teto, e o desenho não tem para onde ir. */
export function costMeterSourceOverBudget(): string {
  return build({ spent: 1.24, budget: 1 });
}

/**
 * Nenhum teto declarado.
 *
 * O que se sabe é quanto custou, e não quanto ainda pode custar — e é isso que
 * a peça diz, em vez de desenhar um trilho vazio que leria como "não gastou
 * nada".
 */
export function costMeterSourceUnbounded(): string {
  return build({ spent: 0.84 });
}

/**
 * O custo ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a MESMA execução, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function costMeterSourceBesideContext(): string {
  return snippet(
    costImports(importing('context-display', 'createContextDisplay')),
    moneyLines(),
    [
      `const costMeter = ${callLine('createCostMeter', options([
        ['amount', 'money.format(0.84)'],
        ['budget', '{ amount: money.format(1), fraction: spentFraction(0.84, 1) }'],
        ['labels', 'rotulos'],
      ]))};`,
      '',
      '// A outra pergunta, sobre a mesma execução: quanto da janela já foi.',
      `const contextDisplay = ${callLine('createContextDisplay', options([
        ['usage', '{ input: 18000, output: 7000, limit: 32000 }'],
        ['labels', 'rotulosDaJanela'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(contextDisplay, costMeter);",
  );
}

/**
 * O custo no fim de uma execução.
 *
 * A linha de estado diz que terminou; o custo diz quanto isso saiu. Nenhuma das
 * duas sabe da outra — a peça se encaixa sem virar propriedade de quem a
 * hospeda (§4.2 da guideline 17).
 */
export function costMeterSourceAfterRun(): string {
  return snippet(
    costImports(importing('agent-status', 'createAgentStatus')),
    moneyLines(),
    [
      `const agentStatus = ${callLine('createAgentStatus', options([
        ['status', "'complete'"],
        ['labels', 'rotulosDaExecucao'],
      ]))};`,
      '',
      `const costMeter = ${callLine('createCostMeter', options([
        ['amount', 'money.format(0.84)'],
        ['budget', '{ amount: money.format(1), fraction: spentFraction(0.84, 1) }'],
        ['labels', 'rotulos'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(agentStatus, costMeter);",
  );
}
