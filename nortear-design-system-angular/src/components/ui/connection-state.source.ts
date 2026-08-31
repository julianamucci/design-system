/**
 * Transforms do painel Code do estado da ligação.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e faz
 * alguma coisa com o pedido de nova tentativa.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e contagem por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de um sinal mentiria sobre o que a story renderiza. Nas demais o que varia é o
 * estado, e ele continua literal porque é o assunto da story.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsConnectionState } from '@/components/ui/connection-state';";

const RUN_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const PROTOCOL_IMPORT = "import { CONNECTION_STATES } from '@shared/primitives/chat-protocol';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ConnectionStateSnippetOptions = {
  /** Em que pé está a ligação. */
  state?: string;
  /** A contagem, já escrita. Vazia quando nenhuma tentativa está marcada. */
  countdown?: string;
  /** O estado desenhado oferece ação? Só então a saída tem para onde ir. */
  action?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ConnectionStateSourceTransform = (
  code: string,
  ctx?: { args?: ConnectionStateSnippetOptions },
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
 * O que fazer com o pedido, escrito uma vez.
 *
 * Abrir a ligação é de quem consome: a linha só avisa que alguém pediu para
 * tentar de novo, e não reagenda nem religa nada por conta.
 */
const REQUEST = [
  '',
  '  // Religar de verdade é de quem consome: a linha só avisa que alguém',
  '  // pediu, e quem devolve o estado novo é o produto.',
  '  reconnect(): void {',
  '    this.openConnection();',
  '  }',
];

/** A linha sozinha, no estado que a story desenha. */
function single(opts: ConnectionStateSnippetOptions): string {
  const state = opts.state ?? 'reconnecting';
  // Estado sem rótulo de ação não desenha botão, então a saída não teria como
  // disparar: mostrá-la ali ensinaria a ligar um fio solto.
  const wired = opts.action !== false;

  return build(
    [IMPORT],
    ['NdsConnectionState'],
    [
      '    <p',
      '      ndsConnectionState',
      `      state="${state}"`,
      ...(opts.countdown ? [`      countdown="${opts.countdown}"`] : []),
      '      [labels]="labels"',
      ...(wired ? ['      (retry)="reconnect()"'] : []),
      '    ></p>',
    ],
    ['  readonly labels = connectionStateLabels();', ...(wired ? REQUEST : [])],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve estado e contagem por extenso.
 *
 * Os args vêm dos controls: o estado e a contagem.
 */
export const connectionStateSource: ConnectionStateSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({ state: args.state, countdown: args.countdown, action: args.action });
};

/**
 * Os três estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `CONNECTION_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function connectionStateEveryStateSource(): string {
  return build(
    [IMPORT, PROTOCOL_IMPORT],
    ['NdsConnectionState'],
    [
      '    @for (state of states; track state) {',
      '      <p',
      '        ndsConnectionState',
      '        [state]="state"',
      '        [countdown]="countdown"',
      '        [labels]="labels"',
      '        (retry)="reconnect()"',
      '      ></p>',
      '    }',
    ],
    [
      '  readonly states = CONNECTION_STATES;',
      // A mesma contagem vai para os três: quem a recusa onde nenhuma tentativa
      // está marcada é a peça, e não quem a passa.
      "  readonly countdown = 'em 5 s';",
      '  readonly labels = connectionStateLabels();',
      ...REQUEST,
    ],
  );
}

/** A ligação de pé: nada a contar, e nada a oferecer. */
export function connectionStateConnectedSource(): string {
  return single({ state: 'connected', action: false });
}

/**
 * A que caiu com algo já tentando: a contagem aparece e a ação apressa.
 *
 * A contagem entra no snippet porque este é o único estado em que ela tem o que
 * contar — o vocabulário responde por isso, e não a tela.
 */
export function connectionStateReconnectingSource(): string {
  return single({ state: 'reconnecting', countdown: 'em 5 s' });
}

/**
 * A que caiu sem ninguém tentando.
 *
 * Sem contagem no snippet, e é o assunto: nenhuma tentativa está marcada, então
 * não há tempo a mostrar. Ensinar a passá-la aqui ensinaria a desenhar um
 * relógio que não corre.
 */
export function connectionStateDisconnectedSource(): string {
  return single({ state: 'disconnected' });
}

/**
 * As duas linhas lado a lado.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz se ainda há
 * por onde pedir, a outra diz o que o agente está fazendo com o que se pediu.
 * Por isso o snippet monta as duas em sequência, e não passa uma para dentro da
 * outra.
 */
export function connectionStateBesideRunSource(): string {
  return build(
    [IMPORT, RUN_IMPORT],
    ['NdsConnectionState', 'NdsAgentStatus'],
    [
      '    <!-- As duas são AUTÔNOMAS: nenhuma sabe que a outra existe, e a',
      '         ligação vem antes porque sem ela não há execução que valha. -->',
      '    <p',
      '      ndsConnectionState',
      '      state="reconnecting"',
      '      countdown="em 5 s"',
      '      [labels]="labels"',
      '      (retry)="reconnect()"',
      '    ></p>',
      '',
      '    <p',
      '      ndsAgentStatus',
      '      status="stopped"',
      '      [labels]="runLabels"',
      '    ></p>',
    ],
    [
      '  readonly labels = connectionStateLabels();',
      '  readonly runLabels = agentStatusLabels();',
      ...REQUEST,
    ],
  );
}
