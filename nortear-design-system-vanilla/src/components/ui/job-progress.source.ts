// Snippet do painel Code do andamento de trabalho longo — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve estado e conta por extenso, e é de
// propósito: lá os controls mudam os três eixos, e um snippet que mostrasse só
// o nome de uma constante mentiria sobre o que a story renderiza. Nas demais o
// que varia é o estado, e ele continua literal porque é o assunto da story.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type JobProgressSnippetOptions = {
  /** Em que pé está o trabalho. */
  status?: string;
  /** Quantas unidades já foram feitas. Vazio quando não há conta nenhuma. */
  done?: number;
  /** De quantas. Vazio quando não se sabe — que é caso real, e não borda. */
  total?: number;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

const JOB_LABEL = 'Indexando o repositório';
const ON_ACTION = '(intent) => aplicar(intent)';

/** `{ done: 1240, total: 5000 }`, ou só o feito quando não se sabe de quantas. */
function countLiteral(opts: JobProgressSnippetOptions): string | undefined {
  if (opts.done === undefined) return undefined;
  return opts.total === undefined
    ? `{ done: ${opts.done} }`
    : `{ done: ${opts.done}, total: ${opts.total} }`;
}

function build(opts: JobProgressSnippetOptions): string {
  const lines = options([
    ['label', text(JOB_LABEL)],
    ['status', text(opts.status ?? 'running')],
    ['count', countLiteral(opts)],
    ['labels', 'rotulos'],
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    ['onAction', opts.action === false ? undefined : ON_ACTION],
  ]);

  return snippet(
    importing('job-progress', 'createJobProgress'),
    `const jobProgress = ${callLine('createJobProgress', lines)};`,
    appendLine('jobProgress'),
  );
}

/** Transform do `meta` — o Playground, que escreve os três eixos por extenso. */
export const jobProgressSource: SourceTransform<{
  status: string;
  done: number;
  total: number;
}> = (_c, ctx) => {
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
  return snippet(
    [
      importing('job-progress', 'createJobProgress'),
      "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
    ].join('\n'),
    [
      'for (const status of RUN_STATUSES) {',
      "  document.querySelector('#app')?.append(",
      '    createJobProgress({',
      `      label: ${text(JOB_LABEL)},`,
      '      status,',
      '      count: { done: 1240, total: 5000 },',
      '      labels: rotulos,',
      '      onAction: aoPedir,',
      '    }),',
      '  );',
      '}',
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
 * Cada peça é AUTÔNOMA, e por isso o snippet monta uma por item em vez de
 * passar uma lista para dentro de um contêiner: quem tem a fila é quem consome,
 * e uma peça que a recebesse decidiria ordenação e agrupamento, que são do
 * produto.
 */
export function jobProgressQueueSource(): string {
  return snippet(
    importing('job-progress', 'createJobProgress'),
    [
      'for (const job of trabalhos) {',
      "  document.querySelector('#app')?.append(",
      '    createJobProgress({',
      '      label: job.label,',
      '      status: job.status,',
      '      count: job.count,',
      '      labels: rotulos,',
      '      onAction: aoPedir,',
      '    }),',
      '  );',
      '}',
    ].join('\n'),
  );
}

/**
 * A peça ao lado da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta que se escreve agora, a outra mede uma tarefa que sobrevive a ela.
 * Por isso o snippet monta as duas em sequência, e não passa uma para dentro da
 * outra.
 */
export function jobProgressBesideRunSource(): string {
  return snippet(
    [
      importing('job-progress', 'createJobProgress'),
      importing('agent-status', 'createAgentStatus'),
    ].join('\n'),
    [
      `const agentStatus = ${callLine('createAgentStatus', options([
        ['status', text('complete')],
        ['elapsed', text('2:11')],
        ['labels', 'rotulosDaExecucao'],
      ]))};`,
      '',
      `const jobProgress = ${callLine('createJobProgress', options([
        ['label', text(JOB_LABEL)],
        ['status', text('running')],
        ['count', '{ done: 1240, total: 5000 }'],
        ['labels', 'rotulos'],
        ['onAction', ON_ACTION],
      ]))};`,
    ].join('\n'),
    "document.querySelector('#app')?.append(agentStatus, jobProgress);",
  );
}
