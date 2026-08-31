/**
 * Transforms do painel Code do estado da execução.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e faz
 * alguma coisa com o pedido de ação.
 *
 * O Playground é o único que escreve estado e relógio por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de um sinal mentiria sobre o que a story renderiza. Nas demais o que varia é o
 * estado, e ele continua literal porque é o assunto delas.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const COMPOSER_IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

const PROTOCOL_IMPORT = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type AgentStatusSnippetOptions = {
  /** Em que pé está a execução. */
  status?: string;
  /** O relógio, já escrito. Vazio quando não há o que contar. */
  elapsed?: string;
  /** O estado desenhado oferece ação? Só então a saída tem para onde ir. */
  action?: boolean;
  /** O snippet percorre o vocabulário compartilhado em vez de um estado só? */
  every?: boolean;
  /** A linha aparece acima do campo de mensagem? */
  withField?: boolean;
};

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
 * O que fazer com o pedido, escrito uma vez.
 *
 * A intenção chega junto, e é ela que separa interromper de começar de novo —
 * quem decide qual dos dois é o vocabulário compartilhado, dentro da peça.
 */
const REQUEST = [
  '',
  '  // Parar e começar de verdade são de quem consome: a linha só avisa que',
  '  // alguém pediu, e a intenção vem junto.',
  '  request(intent: AgentStatusIntent): void {',
  "    if (intent === 'stop') this.stopRun();",
  '    else this.startRun();',
  '  }',
];

function agentStatusBuild(opts: AgentStatusSnippetOptions = {}): string {
  const status = opts.status ?? 'running';
  // Estado sem rótulo de ação não desenha botão, então a saída não teria como
  // disparar: mostrá-la ali ensinaria a ligar um fio solto.
  const wired = opts.action !== false;
  const listens = wired ? ['      (action)="request($event)"'] : [];

  if (opts.every) {
    return build(
      [IMPORT, PROTOCOL_IMPORT],
      ['NdsAgentStatus'],
      [
        // A lista sai do vocabulário compartilhado, e não de cinco linhas
        // escritas à mão: estado novo entra sozinho, e nada fica para trás.
        '    @for (state of statuses; track state) {',
        '      <p',
        '        ndsAgentStatus',
        '        [status]="state"',
        '        [labels]="labels"',
        '        (action)="request($event)"',
        '      ></p>',
        '    }',
      ],
      [
        '  readonly statuses = RUN_STATUSES;',
        '  readonly labels = agentStatusLabels();',
        ...REQUEST,
      ],
    );
  }

  if (opts.withField) {
    return build(
      [IMPORT, COMPOSER_IMPORT],
      ['NdsAgentStatus', 'NdsComposer'],
      [
        '    <!-- A linha é AUTÔNOMA: ela fica acima do campo, e nenhum arquivo',
        '         do campo sabe que ela existe. -->',
        '    <p',
        '      ndsAgentStatus',
        `      status="${status}"`,
        ...(opts.elapsed ? [`      elapsed="${opts.elapsed}"`] : []),
        '      [labels]="labels"',
        ...listens,
        '    ></p>',
        '',
        '    <nds-composer [labels]="fieldLabels" />',
      ],
      [
        '  readonly labels = agentStatusLabels();',
        '  readonly fieldLabels = composerLabels();',
        ...(wired ? REQUEST : []),
      ],
    );
  }

  return build(
    [IMPORT],
    ['NdsAgentStatus'],
    [
      '    <p',
      '      ndsAgentStatus',
      `      status="${status}"`,
      ...(opts.elapsed ? [`      elapsed="${opts.elapsed}"`] : []),
      '      [labels]="labels"',
      ...listens,
      '    ></p>',
    ],
    ['  readonly labels = agentStatusLabels();', ...(wired ? REQUEST : [])],
  );
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type AgentStatusSourceTransform = (
  code: string,
  ctx?: { args?: AgentStatusSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve estado e relógio por extenso.
 *
 * Os args vêm dos controls: o estado e o relógio.
 */
export const agentStatusSource: AgentStatusSourceTransform = (_code, ctx) =>
  agentStatusBuild({ ...(ctx?.args ?? {}) });

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: AgentStatusSnippetOptions): AgentStatusSourceTransform {
  return (_code, ctx) => agentStatusBuild({ ...(ctx?.args ?? {}), ...fixed });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export const agentStatusEveryStateSource = withFixed({ every: true });

/** A execução em curso: relógio correndo e a ação que interrompe. */
export const agentStatusRunningSource = withFixed({ status: 'running', elapsed: '1:04' });

/** A que a pessoa parou: neutra de propósito, e a ação que retoma. */
export const agentStatusStoppedSource = withFixed({ status: 'stopped', elapsed: '0:42' });

/** A que quebrou sozinha: a ação passa a pedir para começar de novo. */
export const agentStatusFailedSource = withFixed({ status: 'failed', elapsed: '0:08' });

/** A que chegou ao fim: duração final, e nenhuma ação a oferecer. */
export const agentStatusCompleteSource = withFixed({
  status: 'complete',
  elapsed: '2:11',
  action: false,
});

/**
 * A linha acima do campo de mensagem.
 *
 * Ela é AUTÔNOMA: fica acima do campo e nenhum arquivo do campo sabe que ela
 * existe. Por isso o snippet monta as duas lado a lado, e não passa uma para
 * dentro da outra.
 */
export const agentStatusAboveFieldSource = withFixed({
  status: 'running',
  elapsed: '1:04',
  withField: true,
});
