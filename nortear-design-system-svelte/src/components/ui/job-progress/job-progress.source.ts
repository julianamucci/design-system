/**
 * Transforms do painel Code do andamento de trabalho longo.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e conta por extenso, e é de
 * propósito: lá os controls mudam os três eixos, e um snippet que mostrasse só o
 * nome de uma constante mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type JobProgressSnippetOptions = {
  /** Em que pé está o trabalho. */
  status?: string;
  /** Quantas unidades já foram feitas. Vazio quando não há conta nenhuma. */
  done?: number;
  /** De quantas. Vazio quando não se sabe — o que acontece de verdade, e não borda. */
  total?: number;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: JobProgressSnippetOptions };

const IMPORT = "import { JobProgress } from '@/components/ui/job-progress';";
const IMPORT_RUN = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_STATUSES =
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

const JOB_LABEL = 'Indexando o repositório';
const LABELS = 'labels={rotulos}';
const ON_ACTION = 'onAction={(intent) => aplicar(intent)}';

/** `count={{ done: 1240, total: 5000 }}`, ou só o feito quando não se sabe de quantas. */
function countAttribute(opts: JobProgressSnippetOptions): string | false {
  if (opts.done === undefined) return false;
  return opts.total === undefined
    ? `count={{ done: ${opts.done} }}`
    : `count={{ done: ${opts.done}, total: ${opts.total} }}`;
}

/** O uso real: o rótulo, o estado, a conta, os rótulos, e onde o pedido continua. */
function build(opts: JobProgressSnippetOptions): string {
  const attributes = attrsMultilinha([
    `label="${JOB_LABEL}"`,
    `status="${opts.status ?? 'running'}"`,
    countAttribute(opts),
    LABELS,
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    opts.action !== false && ON_ACTION,
  ]);
  return svelteSnippet(IMPORT, `<JobProgress${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve os três eixos por extenso. */
export function jobProgressSource(_generated?: unknown, ctx?: StoryContext): string {
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
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão, que
 * é o mesmo motivo de a constante existir: lista escrita à mão fica para trás no
 * dia em que o tipo cresce, e ninguém repara.
 */
export function jobProgressEveryStatusSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="lg">',
    '  {#each RUN_STATUSES as status (status)}',
    '    <JobProgress',
    `      label="${JOB_LABEL}"`,
    '      {status}',
    '      count={{ done: 1240, total: 5000 }}',
    `      ${LABELS}`,
    `      ${ON_ACTION}`,
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(`${IMPORT}\n${IMPORT_STATUSES}`, markup);
}

/** Correndo, e com de quantas: a barra mostra a fração. */
export function jobProgressRunningSource(): string {
  return build({ status: 'running', done: 1240, total: 5000 });
}

/**
 * Correndo sem saber de quantas — o que a peça existe para não errar.
 *
 * O total sai do snippet, e é o assunto: omiti-lo é o que faz a barra dizer que
 * não há estimativa. Ensinar `total: 0` aqui ensinaria a mandar um denominador
 * que ninguém pode dividir, e a barra desenharia trilha vazia — "acabou de
 * começar" — para algo que já andou muito.
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
 * Cada peça é AUTÔNOMA, e por isso o snippet monta uma por item em vez de passar
 * uma lista para dentro de um contêiner: quem tem a fila é quem consome, e uma
 * peça que a recebesse decidiria ordenação e agrupamento, que são do produto.
 */
export function jobProgressQueueSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="lg">',
    '  {#each trabalhos as trabalho (trabalho.id)}',
    '    <JobProgress',
    '      label={trabalho.label}',
    '      status={trabalho.status}',
    '      count={trabalho.count}',
    `      ${LABELS}`,
    `      ${ON_ACTION}`,
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/**
 * A peça ao lado da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta que se escreve agora, a outra mede uma tarefa que sobrevive a ela.
 * Por isso o snippet empilha as duas em sequência, e não passa uma para dentro
 * da outra.
 */
export function jobProgressBesideRunSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="lg">',
    '  <AgentStatus status="complete" elapsed="2:11" labels={rotulosDaExecucao} />',
    '  <JobProgress',
    `    label="${JOB_LABEL}"`,
    '    status="running"',
    '    count={{ done: 1240, total: 5000 }}',
    `    ${LABELS}`,
    `    ${ON_ACTION}`,
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(`${IMPORT}\n${IMPORT_RUN}`, markup);
}
