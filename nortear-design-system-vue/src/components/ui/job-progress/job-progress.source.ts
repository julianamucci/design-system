/**
 * Transforms do painel Code do andamento de trabalho longo.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e conta por extenso, e é de
 * propósito: lá os controls mudam os três eixos, e um snippet que mostrasse só
 * o nome de uma constante mentiria sobre o que a story renderiza. Nas demais o
 * que varia é o estado, e ele continua literal porque é o assunto da story.
 */
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type JobProgressArgs = {
  /** Em que pé está o trabalho. */
  status?: string;
  /** Quantas unidades já foram feitas. Vazio quando não há conta nenhuma. */
  done?: number;
  /** De quantas. Vazio quando não se sabe — que é caso real, e não borda. */
  total?: number;
  /** O estado desenhado oferece ação? Só então o aviso tem para onde ir. */
  action?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { JobProgress } from '@/components/ui/job-progress';";

const IMPORT_STATUSES = [
  IMPORT,
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT,
  "import { AgentStatus } from '@/components/ui/agent-status';",
].join('\n');

const JOB_LABEL = 'Indexando o repositório';

/** `:count="{ done: 1240, total: 5000 }"`, ou só o feito quando não se sabe. */
function countAttr(opts: JobProgressArgs): string | undefined {
  if (opts.done === undefined) return undefined;
  const literal =
    opts.total === undefined
      ? `{ done: ${opts.done} }`
      : `{ done: ${opts.done}, total: ${opts.total} }`;
  return `:count="${literal}"`;
}

/**
 * A tag da peça, só com o que o exemplo precisa dizer.
 *
 * O aviso sai por EVENTO nesta stack, e por isso ele está aqui como `@action`:
 * quem consome o escuta e decide o que parar, retomar e repetir significam.
 * Estado sem rótulo de ação não desenha botão, então ali o ouvinte não teria
 * como disparar — mostrá-lo ensinaria a ligar um fio solto.
 */
function jobTag(opts: JobProgressArgs): string {
  const attributes = attrsMultilinha([
    `label="${text(JOB_LABEL)}"`,
    `status="${text(opts.status, 'running')}"`,
    countAttr(opts),
    ':labels="rotulos"',
    opts.action === false ? undefined : '@action="aplicar"',
  ]);
  return `<JobProgress${attributes} />`;
}

function build(opts: JobProgressArgs): string {
  return vueSnippet(IMPORT, jobTag(opts));
}

/** Transform do `meta` — o Playground, que escreve os três eixos por extenso. */
export const jobProgressSource: SourceTransform<JobProgressArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    done: args.done,
    // ZERO É AUSÊNCIA no controle, e o snippet acompanha: o vocabulário trata
    // total zero como "não se sabe", e ensinar `total: 0` ensinaria a mandar um
    // denominador que ninguém pode dividir.
    total: args.total ? args.total : undefined,
    action: args.status !== 'idle' && args.status !== 'complete',
  });
};

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function jobProgressEveryStatusSource(): string {
  return vueSnippet(
    IMPORT_STATUSES,
    [
      '<JobProgress',
      '  v-for="status in RUN_STATUSES"',
      '  :key="status"',
      `  label="${text(JOB_LABEL)}"`,
      '  :status="status"',
      '  :count="{ done: 1240, total: 5000 }"',
      '  :labels="rotulos"',
      '  @action="aplicar"',
      '/>',
    ].join('\n'),
  );
}

/** Correndo, e com de quantas: a barra mostra a fração. */
export function jobProgressRunningSource(): string {
  return build({ status: 'running', done: 1240, total: 5000 });
}

/**
 * Correndo sem saber de quantas — o caso que a peça existe para não errar.
 *
 * O total sai do snippet, e é o assunto: omiti-lo é o que faz a barra dizer
 * que não há estimativa. Ensinar `total: 0` aqui ensinaria a mandar um
 * denominador que ninguém pode dividir, e a barra desenharia trilha vazia —
 * "acabou de começar" — para algo que já andou muito.
 */
export function jobProgressUnknownTotalSource(): string {
  return build({ status: 'running', done: 1240 });
}

/** Interrompido: a barra congela onde chegou, e a ação oferece retomar. */
export function jobProgressStoppedSource(): string {
  return build({ status: 'stopped', done: 1240, total: 5000 });
}

/**
 * Concluído: a barra fica cheia, e a conta parcial continua no snippet.
 *
 * Ela fica de propósito — é o que mostra que quem decide a barra cheia é o
 * estado, e não a conta.
 */
export function jobProgressCompleteSource(): string {
  return build({ status: 'complete', done: 1240, total: 5000, action: false });
}

/** Falhou: a barra congela na cor de erro, e a ação oferece tentar de novo. */
export function jobProgressFailedSource(): string {
  return build({ status: 'failed', done: 1240, total: 5000 });
}

/**
 * A fila de trabalhos.
 *
 * Cada peça é AUTÔNOMA, e por isso o snippet repete a tag por item em vez de
 * passar uma lista para dentro de um contêiner: quem tem a fila é quem consome,
 * e uma peça que a recebesse decidiria ordenação e agrupamento, que são do
 * produto.
 */
export function jobProgressQueueSource(): string {
  return vueSnippet(
    IMPORT,
    [
      '<JobProgress',
      '  v-for="trabalho in trabalhos"',
      '  :key="trabalho.id"',
      '  :label="trabalho.label"',
      '  :status="trabalho.status"',
      '  :count="trabalho.count"',
      '  :labels="rotulos"',
      '  @action="aplicar"',
      '/>',
    ].join('\n'),
  );
}

/**
 * A peça ao lado da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta que se escreve agora, a outra mede uma tarefa que sobrevive a ela.
 * Por isso o snippet monta as duas como irmãs, e não passa uma para dentro da
 * outra.
 */
export function jobProgressBesideRunSource(): string {
  const body = [
    '<AgentStatus status="complete" elapsed="2:11" :labels="rotulosDaExecucao" />',
    jobTag({ status: 'running', done: 1240, total: 5000 }),
  ].join('\n');

  return vueSnippet(
    IMPORT_BESIDE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="lg">\n${indentar(body)}\n</div>`,
  );
}
