// Snippet do painel Code do estado da execução — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve estado e relógio por extenso, e é de
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

export type AgentStatusSnippetOptions = {
  /** Em que pé está a execução. */
  status?: string;
  /** O relógio, já escrito. Vazio quando não há o que contar. */
  elapsed?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

const ON_ACTION = "(intent) => (intent === 'stop' ? parar() : comecar())";

function build(opts: AgentStatusSnippetOptions): string {
  const lines = options([
    ['status', text(opts.status ?? 'running')],
    ['elapsed', opts.elapsed ? text(opts.elapsed) : undefined],
    ['labels', 'rotulos'],
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    ['onAction', opts.action === false ? undefined : ON_ACTION],
  ]);

  return snippet(
    importing('agent-status', 'createAgentStatus'),
    `const agentStatus = ${callLine('createAgentStatus', lines)};`,
    appendLine('agentStatus'),
  );
}

/** Transform do `meta` — o Playground, que escreve estado e relógio por extenso. */
export const agentStatusSource: SourceTransform<AgentStatusSnippetOptions> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    elapsed: args.elapsed,
    action: args.action,
  });
};

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentStatusEveryStateSource(): string {
  return snippet(
    [
      importing('agent-status', 'createAgentStatus'),
      "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
    ].join('\n'),
    [
      'for (const status of RUN_STATUSES) {',
      "  document.querySelector('#app')?.append(",
      '    createAgentStatus({ status, labels: rotulos, onAction: aoPedir }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/** A execução em curso: relógio correndo e a ação que interrompe. */
export function agentStatusRunningSource(): string {
  return build({ status: 'running', elapsed: '1:04' });
}

/** A que a pessoa parou: neutra de propósito, e a ação que retoma. */
export function agentStatusStoppedSource(): string {
  return build({ status: 'stopped', elapsed: '0:42' });
}

/** A que quebrou sozinha: a ação passa a pedir para começar de novo. */
export function agentStatusFailedSource(): string {
  return build({ status: 'failed', elapsed: '0:08' });
}

/** A que chegou ao fim: duração final, e nenhuma ação a oferecer. */
export function agentStatusCompleteSource(): string {
  return build({ status: 'complete', elapsed: '2:11', action: false });
}

/**
 * A linha acima do campo de mensagem.
 *
 * Ela é AUTÔNOMA: fica acima do campo e nenhum arquivo do campo sabe que ela
 * existe. Por isso o snippet monta as duas lado a lado, e não passa uma para
 * dentro da outra.
 */
export function agentStatusAboveFieldSource(): string {
  return snippet(
    [
      importing('agent-status', 'createAgentStatus'),
      importing('composer', 'createComposer'),
    ].join('\n'),
    [
      `const agentStatus = ${callLine('createAgentStatus', options([
        ['status', text('running')],
        ['elapsed', text('1:04')],
        ['labels', 'rotulos'],
        ['onAction', ON_ACTION],
      ]))};`,
      '',
      `const composer = ${callLine('createComposer', options([['labels', 'rotulosDoCampo']]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(agentStatus, composer);",
  );
}
