/**
 * Snippet do painel Code do estado da ligação — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e contagem por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de uma constante mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ConnectionState } from "@/components/ui/connection-state";';

const ON_RETRY = 'onRetry={() => religar()}';

export type ConnectionStateSnippetOptions = {
  /** Em que pé está a ligação. */
  state?: string;
  /** A contagem, já escrita. Vazia quando nenhuma tentativa está marcada. */
  countdown?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

function build(opts: ConnectionStateSnippetOptions): string {
  const countdown = text(opts.countdown);

  return jsxSnippet(
    IMPORT,
    `<ConnectionState${attrsMultilinha([
      `state="${text(opts.state) ?? 'reconnecting'}"`,
      countdown === undefined ? undefined : `countdown="${countdown}"`,
      'labels={rotulos}',
      // Estado sem rótulo de ação não desenha botão, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      opts.action === false ? undefined : ON_RETRY,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve estado e contagem por extenso. */
export const connectionStateSource: SourceTransform<ConnectionStateSnippetOptions> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({ state: args.state, countdown: args.countdown, action: args.action });
};

/**
 * Os três estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `CONNECTION_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function connectionStateEveryStateSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { CONNECTION_STATES } from "@shared/primitives/chat-protocol";'].join('\n'),
    [
      'CONNECTION_STATES.map((state) => (',
      '  <ConnectionState',
      '    key={state}',
      '    state={state}',
      '    labels={rotulos}',
      `    ${ON_RETRY}`,
      '  />',
      '))',
    ].join('\n'),
  );
}

/** A ligação de pé: nada a contar, e nada a oferecer. */
export function connectionStateConnectedSource(): string {
  return build({ state: 'connected', action: false });
}

/**
 * A que caiu com algo já tentando: a contagem aparece e a ação apressa.
 *
 * A contagem entra no snippet porque este é o único estado em que ela tem o que
 * contar — o vocabulário responde por isso, e não a tela.
 */
export function connectionStateReconnectingSource(): string {
  return build({ state: 'reconnecting', countdown: 'em 5 s' });
}

/**
 * A que caiu sem ninguém tentando.
 *
 * Sem contagem no snippet, e é o assunto: nenhuma tentativa está marcada, então
 * não há tempo a mostrar. Ensinar a passá-la aqui ensinaria a desenhar um
 * relógio que não corre.
 */
export function connectionStateDisconnectedSource(): string {
  return build({ state: 'disconnected' });
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
  return jsxSnippet(
    [IMPORT, 'import { AgentStatus } from "@/components/ui/agent-status";'].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <ConnectionState',
      '    state="reconnecting"',
      '    countdown="em 5 s"',
      '    labels={rotulos}',
      `    ${ON_RETRY}`,
      '  />',
      '  <AgentStatus status="stopped" labels={rotulosDaExecucao} />',
      '</div>',
    ].join('\n'),
  );
}
