/**
 * Snippet do painel Code do estado da execução — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e relógio por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de uma constante mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { AgentStatus } from "@/components/ui/agent-status";';

const ON_ACTION = 'onAction={(intent) => (intent === "stop" ? parar() : comecar())}';

export type AgentStatusSnippetOptions = {
  /** Em que pé está a execução. */
  status?: string;
  /** O relógio, já escrito. Vazio quando não há o que contar. */
  elapsed?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

function build(opts: AgentStatusSnippetOptions): string {
  const elapsed = text(opts.elapsed);

  return jsxSnippet(
    IMPORT,
    `<AgentStatus${attrsMultilinha([
      `status="${text(opts.status) ?? 'running'}"`,
      elapsed === undefined ? undefined : `elapsed="${elapsed}"`,
      'labels={rotulos}',
      // Estado sem rótulo de ação não desenha botão, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      opts.action === false ? undefined : ON_ACTION,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve estado e relógio por extenso. */
export const agentStatusSource: SourceTransform<AgentStatusSnippetOptions> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({ status: args.status, elapsed: args.elapsed, action: args.action });
};

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentStatusEveryStateSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { RUN_STATUSES } from "@shared/primitives/chat-protocol";'].join('\n'),
    [
      'RUN_STATUSES.map((status) => (',
      '  <AgentStatus',
      '    key={status}',
      '    status={status}',
      '    labels={rotulos}',
      `    ${ON_ACTION}`,
      '  />',
      '))',
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
  return jsxSnippet(
    [IMPORT, 'import { Composer } from "@/components/ui/composer";'].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <AgentStatus',
      '    status="running"',
      '    elapsed="1:04"',
      '    labels={rotulos}',
      `    ${ON_ACTION}`,
      '  />',
      '  <Composer labels={rotulosDoCampo} />',
      '</div>',
    ].join('\n'),
  );
}
