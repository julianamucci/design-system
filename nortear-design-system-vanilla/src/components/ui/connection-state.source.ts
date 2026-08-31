// Snippet do painel Code do estado da ligação — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve estado e contagem por extenso, e é de
// propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
// de uma constante mentiria sobre o que a story renderiza. Nas demais o que
// varia é o estado, e ele continua literal porque é o assunto da story.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ConnectionStateSnippetOptions = {
  /** Em que pé está a ligação. */
  state?: string;
  /** A contagem, já escrita. Vazia quando nenhuma tentativa está marcada. */
  countdown?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

const ON_RETRY = '() => religar()';

function build(opts: ConnectionStateSnippetOptions): string {
  const lines = options([
    ['state', text(opts.state ?? 'reconnecting')],
    ['countdown', opts.countdown ? text(opts.countdown) : undefined],
    ['labels', 'rotulos'],
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    ['onRetry', opts.action === false ? undefined : ON_RETRY],
  ]);

  return snippet(
    importing('connection-state', 'createConnectionState'),
    `const connectionState = ${callLine('createConnectionState', lines)};`,
    appendLine('connectionState'),
  );
}

/** Transform do `meta` — o Playground, que escreve estado e contagem por extenso. */
export const connectionStateSource: SourceTransform<ConnectionStateSnippetOptions> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    state: args.state,
    countdown: args.countdown,
    action: args.action,
  });
};

/**
 * Os três estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `CONNECTION_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function connectionStateEveryStateSource(): string {
  return snippet(
    [
      importing('connection-state', 'createConnectionState'),
      "import { CONNECTION_STATES } from '@shared/primitives/chat-protocol';",
    ].join('\n'),
    [
      'for (const state of CONNECTION_STATES) {',
      "  document.querySelector('#app')?.append(",
      '    createConnectionState({ state, labels: rotulos, onRetry: aoPedir }),',
      '  );',
      '}',
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
  return snippet(
    [
      importing('connection-state', 'createConnectionState'),
      importing('agent-status', 'createAgentStatus'),
    ].join('\n'),
    [
      `const connectionState = ${callLine('createConnectionState', options([
        ['state', text('reconnecting')],
        ['countdown', text('em 5 s')],
        ['labels', 'rotulos'],
        ['onRetry', ON_RETRY],
      ]))};`,
      '',
      `const agentStatus = ${callLine('createAgentStatus', options([
        ['status', text('stopped')],
        ['labels', 'rotulosDaExecucao'],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(connectionState, agentStatus);",
  );
}
