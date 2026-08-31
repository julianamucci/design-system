/**
 * Transforms do painel Code da faixa de cota.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos,
 * escreve o horizonte e passa a cota.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a peça recebe o USO e o
 * TETO e tira o resto sozinha da conta compartilhada, e que o horizonte chega
 * ESCRITO. As duas juntas são o contrato — quem copiasse só o elemento
 * escreveria a subtração à mão na primeira vez que precisasse dela, e um dia
 * mostraria "-14 mensagens restantes".
 *
 * Por isso o formatador de duração aparece no snippet, com idioma explícito: é
 * ele que o leitor precisa reconhecer como SEU, e não do design system. E por
 * isso a conta compartilhada aparece em COMENTÁRIO, e não em chamada: aqui quem
 * chama `remainingUnits` é a própria peça, e um import que o leitor nunca usa
 * ensinaria que a subtração ainda é dele.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsQuotaBanner } from '@/components/ui/quota-banner';";

const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

const CONTEXT_IMPORT = "import { NdsContextDisplay } from '@/components/ui/context-display';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type QuotaBannerSnippetOptions = {
  /** Quanto da cota já foi usado. */
  used?: number;
  /** O teto da cota. */
  limit?: number;
  /** A cota renova? Quando não renova, o horizonte não é passado. */
  renews?: boolean;
  /** A faixa recebe um controle pronto? */
  action?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type QuotaBannerSourceTransform = (
  code: string,
  ctx?: { args?: QuotaBannerSnippetOptions },
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
 * Ele entra em todo snippet que passa horizonte: é a linha que responde de onde
 * vêm a abreviatura da hora, a do minuto e o separador entre as duas.
 */
function horizonLines(): string[] {
  return [
    '  // O HORIZONTE CHEGA ESCRITO. Abreviatura de hora e de minuto, separador e',
    '  // número de cifras são decisão de idioma E de lugar, e quem as conhece é',
    '  // quem mede.',
    "  readonly unit = (value: number, name: 'hour' | 'minute') =>",
    "    new Intl.NumberFormat('pt-BR', {",
    "      style: 'unit',",
    '      unit: name,',
    "      unitDisplay: 'short',",
    '    }).format(value);',
    '',
    "  readonly horizon = `${this.unit(3, 'hour')} ${this.unit(12, 'minute')}`;",
  ];
}

/**
 * A explicação de onde sai o resto, sem import que o leitor não usaria.
 *
 * A peça já chama `remainingUnits`, `spentFraction`, `fractionLevel` e
 * `fractionPercent` por dentro. O que o snippet precisa dizer é que a conta não
 * é de quem consome — e dizer isso com uma chamada que ninguém escreve ensinaria
 * o contrário.
 */
function mathLines(used: number, limit: number): string[] {
  return [
    `  // O RESTO SAI DA CONTA COMPARTILHADA: ${used} de ${limit} deixa`,
    `  // ${Math.max(limit - used, 0)}, e nunca um número negativo. A peça lê`,
    '  // `remainingUnits` e `fractionLevel` de @shared/primitives/token-budget,',
    '  // que é a mesma conta das outras medições — a subtração não é sua.',
  ];
}

/** Os controles, num template só. */
const ACTION_TEMPLATE = [
  '    <ng-template #actionControls>',
  '      <button',
  '        ndsButton',
  '        type="button"',
  '        variant="outline"',
  '        size="sm"',
  '      >{{ actionLabel }}</button>',
  '    </ng-template>',
  '',
];

/** A faixa sozinha, com o uso e o teto que a story desenha. */
function single(opts: QuotaBannerSnippetOptions): string {
  const used = opts.used ?? 0;
  const limit = opts.limit ?? 0;
  const renews = opts.renews ?? true;
  const action = opts.action ?? false;

  return build(
    action ? [IMPORT, BUTTON_IMPORT] : [IMPORT],
    action ? ['NdsQuotaBanner', 'NdsButton'] : ['NdsQuotaBanner'],
    [
      ...(action ? ACTION_TEMPLATE : []),
      '    <div',
      '      ndsQuotaBanner',
      '      [quota]="quota"',
      ...(renews ? ['      [renewsIn]="horizon"'] : []),
      ...(action ? ['      [actions]="[actionControls]"'] : []),
      '      [labels]="labels"',
      '    ></div>',
    ],
    [
      ...(renews
        ? horizonLines()
        : [
          '  // Cota que não renova: o horizonte não é passado, e a linha some em',
          '  // vez de dizer "renova em nunca". O resto da faixa não muda.',
        ]),
      '',
      ...mathLines(used, limit),
      `  readonly quota = { used: ${used}, limit: ${limit} };`,
      '',
      '  readonly labels = quotaBannerLabels();',
      ...(action
        ? [
          '',
          '  // O CONTROLE É DE QUEM CONSOME. A faixa desenha o lugar de quem',
          '  // responde; o que o botão faz não passa por ela.',
          "  readonly actionLabel = 'Mudar de plano';",
        ]
        : []),
    ],
  );
}

/** Transform do `meta` — o Playground, que escreve o uso e o teto por extenso. */
export const quotaBannerSource: QuotaBannerSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({ used: args.used, limit: args.limit, renews: args.renews });
};

/** A faixa daquela lista de usos, com a mesma chamada para todos. */
function loop(uses: number[], note: string[]): string {
  return build(
    [IMPORT],
    ['NdsQuotaBanner'],
    [
      '    @for (quota of quotas; track quota.used) {',
      '      <div',
      '        ndsQuotaBanner',
      '        [quota]="quota"',
      '        [renewsIn]="horizon"',
      '        [labels]="labels"',
      '      ></div>',
      '    }',
    ],
    [
      ...horizonLines(),
      '',
      ...note,
      '  readonly quotas = [',
      ...uses.map((used) => `    { used: ${used}, limit: 200 },`),
      '  ];',
      '',
      '  readonly labels = quotaBannerLabels();',
    ],
  );
}

/**
 * Os cinco exemplos, percorridos de uma vez.
 *
 * O snippet ensina o laço porque o que se quer mostrar é que a MESMA chamada
 * atende os cinco: o que muda é o uso, e a peça decide sozinha se a manchete
 * conta ou anuncia o fim.
 */
export function quotaBannerEveryCaseSource(): string {
  return loop(
    [72, 150, 168, 188, 214],
    [
      '  // Passar do teto não deixa resto negativo, e a razão para em uma volta:',
      '  // as duas travas moram na conta compartilhada, e não aqui.',
    ],
  );
}

/** Os três níveis, do mais folgado ao mais apertado. */
export function quotaBannerAllLevelsSource(): string {
  return loop(
    [72, 168, 188],
    [
      '  // A palavra do nível é o que descreve, e a cor apenas acompanha: cor',
      '  // sozinha não descreve estado.',
    ],
  );
}

/** Três quartos do teto EM PONTO — a borda do limiar de aviso. */
export function quotaBannerAtThresholdSource(): string {
  return single({ used: 150, limit: 200 });
}

/**
 * O uso passou do teto, e não sobra nada.
 *
 * A manchete troca o número pela palavra que diz que acabou: zero contado lê
 * como medição, e não como fim.
 */
export function quotaBannerExhaustedSource(): string {
  return single({ used: 214, limit: 200 });
}

/**
 * Nenhum horizonte de renovação.
 *
 * O que se sabe é quanto sobra, e não até quando — e é isso que a peça mostra,
 * em vez de inventar uma renovação que ninguém prometeu.
 */
export function quotaBannerNoRenewalSource(): string {
  return single({ used: 168, limit: 200, renews: false });
}

/**
 * A faixa com um controle.
 *
 * O controle chega pronto, e a peça não sabe o que ele faz — §7 da guideline
 * 17. Nesta stack ele chega como `TemplateRef`, e a faixa o instancia: é o
 * mesmo contrato das ações da mensagem e do cartão de autorização, pelo caminho
 * que esta stack usa para projetar conteúdo declarado de fora.
 */
export function quotaBannerWithActionSource(): string {
  return single({ used: 168, limit: 200, action: true });
}

/**
 * A cota ao lado da medição da janela.
 *
 * As duas respondem perguntas diferentes sobre a mesma conversa, e a palavra do
 * nível quer dizer a mesma coisa nas duas porque o limiar vem do mesmo lugar.
 */
export function quotaBannerBesideContextSource(): string {
  return build(
    [IMPORT, CONTEXT_IMPORT],
    ['NdsQuotaBanner', 'NdsContextDisplay'],
    [
      '    <!-- A outra pergunta, sobre a mesma conversa: quanto da janela já foi. -->',
      '    <p',
      '      ndsContextDisplay',
      '      [usage]="usage"',
      '      form="bar"',
      '      [labels]="windowLabels"',
      '    ></p>',
      '',
      '    <div',
      '      ndsQuotaBanner',
      '      [quota]="quota"',
      '      [renewsIn]="horizon"',
      '      [labels]="labels"',
      '    ></div>',
    ],
    [
      ...horizonLines(),
      '',
      '  readonly usage = { input: 20000, output: 6880, limit: 32000 };',
      '',
      ...mathLines(168, 200),
      '  readonly quota = { used: 168, limit: 200 };',
      '',
      '  readonly labels = quotaBannerLabels();',
      '  readonly windowLabels = contextDisplayLabels();',
    ],
  );
}
