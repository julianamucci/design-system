/**
 * Transforms do painel Code do estado da execução.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type AgentStatusArgs = {
  /** Em que pé está a execução. */
  status?: string;
  /** O relógio, já escrito. Vazio quando não há o que contar. */
  elapsed?: string;
  /** O estado desenhado oferece ação? Só então o aviso tem para onde ir. */
  action?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { AgentStatus } from '@/components/ui/agent-status';";

const IMPORT_STATUSES = [
  IMPORT,
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_ABOVE = [
  IMPORT,
  "import { Composer } from '@/components/ui/composer';",
].join('\n');

/**
 * A tag da linha, só com o que o exemplo precisa dizer.
 *
 * O aviso sai por EVENTO nesta stack, e por isso ele está aqui como `@action`:
 * quem consome o escuta e decide o que parar e recomeçar significam. Estado sem
 * rótulo de ação não desenha botão, então ali o ouvinte não teria como
 * disparar — mostrá-lo ensinaria a ligar um fio solto.
 */
function statusTag(opts: AgentStatusArgs): string {
  const attributes = attrsMultilinha([
    `status="${text(opts.status, 'running')}"`,
    opts.elapsed ? `elapsed="${text(opts.elapsed)}"` : undefined,
    ':labels="rotulos"',
    opts.action === false ? undefined : '@action="aoPedir"',
  ]);
  return `<AgentStatus${attributes} />`;
}

function build(opts: AgentStatusArgs): string {
  return vueSnippet(IMPORT, statusTag(opts));
}

/** Transform do `meta` — o Playground, que escreve estado e relógio por extenso. */
export const agentStatusSource: SourceTransform<AgentStatusArgs> = (_generated, ctx) => {
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
  return vueSnippet(
    IMPORT_STATUSES,
    [
      '<AgentStatus',
      '  v-for="status in RUN_STATUSES"',
      '  :key="status"',
      '  :status="status"',
      '  :labels="rotulos"',
      '  @action="aoPedir"',
      '/>',
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
 * existe. Por isso o snippet monta as duas lado a lado, como irmãs, e não passa
 * uma para dentro da outra.
 */
export function agentStatusAboveFieldSource(): string {
  const body = [
    '<!-- A linha vem ANTES do campo, e FORA da moldura dele. -->',
    statusTag({ status: 'running', elapsed: '1:04' }),
    '<Composer :labels="rotulosDoCampo" />',
  ].join('\n');

  return vueSnippet(
    IMPORT_ABOVE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
