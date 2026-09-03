/**
 * Snippet do painel Code do andamento de trabalho longo — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
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
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { JobProgress } from "@/components/ui/job-progress";';

const JOB_LABEL = 'Indexando o repositório';
const ON_ACTION = 'onAction={(intent) => aplicar(intent)}';

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: o `Record` dos estados é completo por contrato, e as duas
 * frases da conta existem em par — sem `countWithoutTotal` o caso em que não se
 * sabe de quantas cairia numa frase com um denominador vazio. Só a AÇÃO é
 * parcial, e isso é decisão da peça: em espera e concluído não oferecem nada.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  status: {',
  '    idle: "Em espera",',
  '    running: "Em andamento",',
  '    stopped: "Interrompido",',
  '    complete: "Concluído",',
  '    failed: "Falhou",',
  '  },',
  '  count: "{done} de {total}",',
  '  // A frase de quando não se sabe de quantas — e ela é o par da de cima.',
  '  countWithoutTotal: "{done} até agora",',
  '  action: { running: "Parar", stopped: "Retomar", failed: "Tentar de novo" },',
  '};',
].join('\n');

/** Os rótulos da linha de estado da execução, também por inteiro. */
const RUN_LABELS_BLOCK = [
  'const rotulosDaExecucao = {',
  '  status: {',
  '    idle: "Em espera",',
  '    running: "Respondendo",',
  '    stopped: "Interrompida",',
  '    complete: "Concluída",',
  '    failed: "Falhou",',
  '  },',
  '  action: { running: "Parar", stopped: "Retomar", failed: "Tentar de novo" },',
  '};',
].join('\n');

/**
 * O retorno da ação, declarado com a forma que AQUELE ramo usa.
 *
 * Uma linha, e não uma elisão: parar e retomar de verdade são de quem consome.
 * Na fila ele recebe também o endereço do trabalho, porque ali há mais de um —
 * e é por isso que a declaração acompanha o ramo em vez de ser uma só.
 */
function actionBlock(withId = false): string {
  return withId
    ? 'const aplicar = (id, intent) => { /* … */ };'
    : 'const aplicar = (intent) => { /* … */ };';
}

/**
 * O preâmbulo do snippet: o import, os rótulos e o que a marcação chama.
 *
 * Ele entra em TODOS os ramos, e é o que os torna copiáveis: a versão anterior
 * passava `labels={rotulos}` e chamava `aplicar(intent)` sem declarar nenhum
 * dos dois.
 */
function preamble(imports: string[] = [], blocks: string[] = []): string {
  const partes = [LABELS_BLOCK, ...blocks].flatMap((bloco) => ['', bloco]);
  return [[IMPORT, ...imports].join('\n'), ...partes].join('\n');
}

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

/** Número vindo dos args, e SÓ número — control adulterado não vira atributo. */
function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** `count={{ done: 1240, total: 5000 }}`, ou só o feito quando não se sabe de quantas. */
function countAttr(opts: JobProgressSnippetOptions): string | undefined {
  if (opts.done === undefined) return undefined;
  return opts.total === undefined
    ? `count={{ done: ${opts.done} }}`
    : `count={{ done: ${opts.done}, total: ${opts.total} }}`;
}

function build(opts: JobProgressSnippetOptions): string {
  const hasAction = opts.action !== false;

  return jsxSnippet(
    preamble([], hasAction ? [actionBlock()] : []),
    `<JobProgress${attrsMultilinha([
      `label="${JOB_LABEL}"`,
      `status="${opts.status ?? 'running'}"`,
      countAttr(opts),
      'labels={rotulos}',
      // Estado sem rótulo de ação não desenha botão, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      hasAction ? ON_ACTION : undefined,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve os três eixos por extenso. */
export const jobProgressSource: SourceTransform<{
  status: string;
  done: number;
  total: number;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const status = text(args.status);
  return build({
    status,
    done: number(args.done),
    // ZERO É AUSÊNCIA no controle, e o snippet acompanha: o vocabulário trata
    // total zero como "não se sabe", e ensinar `total: 0` ensinaria a mandar um
    // denominador que ninguém pode dividir.
    total: number(args.total) || undefined,
    action: status !== 'idle' && status !== 'complete',
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
  return jsxSnippet(
    preamble(['import { RUN_STATUSES } from "@shared/primitives/chat-protocol";'], [
      actionBlock(),
    ]),
    [
      'RUN_STATUSES.map((status) => (',
      '  <JobProgress',
      '    key={status}',
      `    label="${JOB_LABEL}"`,
      '    status={status}',
      '    count={{ done: 1240, total: 5000 }}',
      '    labels={rotulos}',
      `    ${ON_ACTION}`,
      '  />',
      '))',
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
  return jsxSnippet(
    preamble([], [actionBlock(true)]),
    [
      '// A fila é de quem consome, e por isso ela é DECLARADA aqui: um laço',
      '// sobre um nome que o snippet não declara não compila na mão de quem',
      '// copia.',
      'const trabalhos = [',
      `  { id: "index", label: "${JOB_LABEL}", status: "running", count: { done: 1240, total: 5000 } },`,
      '  // Sem total não há trilha, e é caso real: a conta continua correndo.',
      '  { id: "embed", label: "Gerando embeddings", status: "running", count: { done: 320 } },',
      '  { id: "warm", label: "Aquecendo o cache", status: "idle" },',
      '];',
      '',
      'trabalhos.map((job) => (',
      '  <JobProgress',
      '    key={job.id}',
      '    label={job.label}',
      '    status={job.status}',
      '    count={job.count}',
      '    labels={rotulos}',
      '    onAction={(intent) => aplicar(job.id, intent)}',
      '  />',
      '))',
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
  return jsxSnippet(
    preamble(['import { AgentStatus } from "@/components/ui/agent-status";'], [
      RUN_LABELS_BLOCK,
      actionBlock(),
    ]),
    [
      '<div className="nds-stack" data-spacing="lg">',
      '  <AgentStatus status="complete" elapsed="2:11" labels={rotulosDaExecucao} />',
      '  <JobProgress',
      `    label="${JOB_LABEL}"`,
      '    status="running"',
      '    count={{ done: 1240, total: 5000 }}',
      '    labels={rotulos}',
      `    ${ON_ACTION}`,
      '  />',
      '</div>',
    ].join('\n'),
  );
}
