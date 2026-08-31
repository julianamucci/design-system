/**
 * Transforms do painel Code do custo de uma execução.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos,
 * escreve o dinheiro e passa o teto.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que o dinheiro chega
 * ESCRITO, e que a fração sai do primitivo compartilhado. As duas juntas são o
 * contrato da peça — quem copiasse só o elemento escreveria a moeda dentro do
 * componente na primeira vez que precisasse de outra.
 *
 * Por isso o formatador aparece no snippet, com idioma e moeda explícitos: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsCostMeter } from '@/components/ui/cost-meter';";

const CONTEXT_IMPORT = "import { NdsContextDisplay } from '@/components/ui/context-display';";

const RUN_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const BUDGET_IMPORT = "import { spentFraction } from '@shared/primitives/token-budget';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type CostMeterSnippetOptions = {
  /** O que a execução custou. */
  spent?: number;
  /** O teto declarado. Zero, ou ausente, significa que não há teto. */
  budget?: number;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type CostMeterSourceTransform = (
  code: string,
  ctx?: { args?: CostMeterSnippetOptions },
) => string;

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], used: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    `  imports: [${used.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/**
 * O formatador que é de QUEM CONSOME, e nunca do componente.
 *
 * Ele entra em todo snippet, inclusive nos que não têm teto: é a linha que
 * responde de onde vem o símbolo, a posição dele e as casas decimais.
 */
function moneyLines(): string[] {
  return [
    '  // O dinheiro chega ESCRITO. Símbolo, posição do símbolo, separador e casas',
    '  // decimais são decisão de idioma E de moeda, e quem as conhece é quem mede.',
    "  readonly money = new Intl.NumberFormat('pt-BR', {",
    "    style: 'currency',",
    "    currency: 'USD',",
    '  });',
  ];
}

/** A peça sozinha, com o gasto e o teto que a story desenha. */
function single(opts: CostMeterSnippetOptions): string {
  const spent = opts.spent ?? 0;
  const budget = opts.budget ?? 0;
  const hasBudget = budget > 0;

  return build(
    hasBudget ? [IMPORT, BUDGET_IMPORT] : [IMPORT],
    ['NdsCostMeter'],
    [
      '    <p',
      '      ndsCostMeter',
      '      [amount]="amount"',
      ...(hasBudget ? ['      [budget]="budget"'] : []),
      '      [labels]="labels"',
      '    ></p>',
    ],
    [
      ...moneyLines(),
      '',
      `  readonly amount = this.money.format(${spent});`,
      ...(hasBudget
        ? [
          '',
          '  // O teto anda em PAR: a quantia escrita e a fração já calculada. A',
          '  // fração é número puro, e é por isso que é ela que atravessa a conta.',
          '  readonly budget = {',
          `    amount: this.money.format(${budget}),`,
          `    fraction: spentFraction(${spent}, ${budget}),`,
          '  };',
        ]
        : [
          '',
          '  // Sem teto declarado não há fração: nem medidor, nem nível, nem por',
          '  // cento. A peça fica com a quantia e diz que o teto não foi declarado.',
        ]),
      '',
      '  readonly labels = costMeterLabels();',
    ],
  );
}

/** Transform do `meta` — o Playground, que escreve o gasto e o teto por extenso. */
export const costMeterSource: CostMeterSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({
    spent: args.spent,
    // ZERO É AUSÊNCIA no controle, e o snippet acompanha: o primitivo trata teto
    // zero como "não há teto", e ensinar um denominador de zero ensinaria a
    // mandar um número que ninguém pode dividir.
    budget: args.budget ? args.budget : undefined,
  });
};

/**
 * Os seis exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que o MESMO elemento
 * atende os seis: o que muda é o gasto, e a peça decide sozinha se há medidor,
 * nível e por cento a desenhar.
 *
 * E é aqui que a resposta `null` da conta aparece por inteiro — é ela que
 * decide se a peça recebe orçamento, sem nenhum sinalizador à parte.
 */
export function costMeterEveryCaseSource(): string {
  return build(
    [IMPORT, BUDGET_IMPORT],
    ['NdsCostMeter'],
    [
      '    @for (spend of spends; track spend.spent) {',
      '      <p',
      '        ndsCostMeter',
      '        [amount]="money.format(spend.spent)"',
      '        [budget]="budgetOf(spend)"',
      '        [labels]="labels"',
      '      ></p>',
      '    }',
    ],
    [
      ...moneyLines(),
      '',
      '  // Teto zero é ausência de teto, e não teto: a fração sai `null`, e é ela',
      '  // que decide se a peça recebe orçamento.',
      '  readonly spends = [',
      '    { spent: 0.36, budget: 1 },',
      '    { spent: 0.75, budget: 1 },',
      '    { spent: 0.84, budget: 1 },',
      '    { spent: 0.94, budget: 1 },',
      '    { spent: 1.24, budget: 1 },',
      '    { spent: 0.84, budget: 0 },',
      '  ];',
      '',
      '  readonly labels = costMeterLabels();',
      '',
      '  budgetOf(spend: { spent: number; budget: number }) {',
      '    const fraction = spentFraction(spend.spent, spend.budget);',
      '    if (fraction === null) return undefined;',
      '    return { amount: this.money.format(spend.budget), fraction };',
      '  }',
    ],
  );
}

/**
 * Os três níveis, do mais folgado ao mais apertado.
 *
 * A palavra do nível é o que descreve, e a cor apenas acompanha: cor sozinha
 * não descreve estado.
 */
export function costMeterAllLevelsSource(): string {
  return build(
    [IMPORT, BUDGET_IMPORT],
    ['NdsCostMeter'],
    [
      '    @for (spent of spends; track spent) {',
      '      <p',
      '        ndsCostMeter',
      '        [amount]="money.format(spent)"',
      '        [budget]="budgetOf(spent)"',
      '        [labels]="labels"',
      '      ></p>',
      '    }',
    ],
    [
      ...moneyLines(),
      '',
      '  readonly spends = [0.36, 0.84, 0.94];',
      '',
      '  readonly labels = costMeterLabels();',
      '',
      '  budgetOf(spent: number) {',
      '    return {',
      '      amount: this.money.format(1),',
      '      fraction: spentFraction(spent, 1),',
      '    };',
      '  }',
    ],
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function costMeterAtThresholdSource(): string {
  return single({ spent: 0.75, budget: 1 });
}

/** O gasto passou do teto, e o desenho não tem para onde ir. */
export function costMeterOverBudgetSource(): string {
  return single({ spent: 1.24, budget: 1 });
}

/**
 * Nenhum teto declarado.
 *
 * O que se sabe é quanto custou, e não quanto ainda pode custar — e é isso que
 * a peça diz, em vez de desenhar um trilho vazio que leria como "não gastou
 * nada".
 */
export function costMeterUnboundedSource(): string {
  return single({ spent: 0.84 });
}

/**
 * O custo ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a MESMA execução, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function costMeterBesideContextSource(): string {
  return build(
    [IMPORT, CONTEXT_IMPORT, BUDGET_IMPORT],
    ['NdsCostMeter', 'NdsContextDisplay'],
    [
      '    <!-- A outra pergunta, sobre a mesma execução: quanto da janela já foi. -->',
      '    <p',
      '      ndsContextDisplay',
      '      [usage]="usage"',
      '      form="bar"',
      '      [labels]="windowLabels"',
      '    ></p>',
      '',
      '    <p',
      '      ndsCostMeter',
      '      [amount]="amount"',
      '      [budget]="budget"',
      '      [labels]="labels"',
      '    ></p>',
    ],
    [
      ...moneyLines(),
      '',
      '  readonly usage = { input: 20000, output: 6880, limit: 32000 };',
      '',
      '  readonly amount = this.money.format(0.84);',
      '',
      '  readonly budget = {',
      '    amount: this.money.format(1),',
      '    fraction: spentFraction(0.84, 1),',
      '  };',
      '',
      '  readonly labels = costMeterLabels();',
      '  readonly windowLabels = contextDisplayLabels();',
    ],
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
  return build(
    [IMPORT, RUN_IMPORT, BUDGET_IMPORT],
    ['NdsCostMeter', 'NdsAgentStatus'],
    [
      '    <!-- As duas são AUTÔNOMAS: nenhuma sabe que a outra existe. -->',
      '    <p',
      '      ndsAgentStatus',
      '      status="complete"',
      '      elapsed="2:11"',
      '      [labels]="runLabels"',
      '    ></p>',
      '',
      '    <p',
      '      ndsCostMeter',
      '      [amount]="amount"',
      '      [budget]="budget"',
      '      [labels]="labels"',
      '    ></p>',
    ],
    [
      ...moneyLines(),
      '',
      '  readonly amount = this.money.format(0.36);',
      '',
      '  readonly budget = {',
      '    amount: this.money.format(1),',
      '    fraction: spentFraction(0.36, 1),',
      '  };',
      '',
      '  readonly labels = costMeterLabels();',
      '  readonly runLabels = agentStatusLabels();',
    ],
  );
}
