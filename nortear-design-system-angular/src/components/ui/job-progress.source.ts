/**
 * Transforms do painel Code do andamento de trabalho longo.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e faz
 * alguma coisa com o pedido da ação.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve estado e conta por extenso, e é de
 * propósito: lá os controls mudam os três eixos, e um snippet que mostrasse só
 * o nome de um sinal mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsJobProgress } from '@/components/ui/job-progress';";

const RUN_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const PROTOCOL_IMPORT = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

const JOB_LABEL = 'Indexando o repositório';

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type JobProgressSnippetOptions = {
  /** Em que pé está o trabalho. */
  status?: string;
  /** Quantas unidades já foram feitas. Vazio quando não há conta nenhuma. */
  done?: number;
  /** De quantas. Vazio quando não se sabe — que é situação real, e não borda. */
  total?: number;
  /** O estado desenhado oferece ação? Só então a saída tem para onde ir. */
  action?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type JobProgressSourceTransform = (
  code: string,
  ctx?: { args?: JobProgressSnippetOptions },
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
 * Parar, retomar e repetir de verdade são de quem consome: a peça só avisa que
 * alguém pediu, e a intenção diz qual das duas coisas.
 */
const REQUEST = [
  '',
  '  // Parar de verdade é de quem consome: a peça só avisa que alguém pediu,',
  '  // e quem devolve o estado novo é o produto.',
  "  apply(intent: 'stop' | 'start'): void {",
  '    this.updateJob(intent);',
  '  }',
];

/** `{ done: 1240, total: 5000 }`, ou só o feito quando não se sabe de quantas. */
function countLiteral(opts: JobProgressSnippetOptions): string | undefined {
  if (opts.done === undefined) return undefined;
  return opts.total === undefined
    ? `{ done: ${opts.done} }`
    : `{ done: ${opts.done}, total: ${opts.total} }`;
}

/** A peça sozinha, no estado que a story desenha. */
function single(opts: JobProgressSnippetOptions): string {
  const status = opts.status ?? 'running';
  const count = countLiteral(opts);
  // Estado sem rótulo de ação não desenha botão, então a saída não teria como
  // disparar: mostrá-la ali ensinaria a ligar um fio solto.
  const wired = opts.action !== false;

  return build(
    [IMPORT],
    ['NdsJobProgress'],
    [
      '    <div',
      '      ndsJobProgress',
      `      label="${JOB_LABEL}"`,
      `      status="${status}"`,
      ...(count ? [`      [count]="${count}"`] : []),
      '      [labels]="labels"',
      ...(wired ? ['      (action)="apply($event)"'] : []),
      '    ></div>',
    ],
    ['  readonly labels = jobProgressLabels();', ...(wired ? REQUEST : [])],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve os três eixos por extenso.
 *
 * Os args vêm dos controls: o estado, o feito e o total.
 */
export const jobProgressSource: JobProgressSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({
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
  return build(
    [IMPORT, PROTOCOL_IMPORT],
    ['NdsJobProgress'],
    [
      '    @for (status of statuses; track status) {',
      '      <div',
      '        ndsJobProgress',
      `        label="${JOB_LABEL}"`,
      '        [status]="status"',
      '        [count]="count"',
      '        [labels]="labels"',
      '        (action)="apply($event)"',
      '      ></div>',
      '    }',
    ],
    [
      '  readonly statuses = RUN_STATUSES;',
      // A mesma conta vai para os cinco: quem decide o que a barra mostra em
      // cada estado é o vocabulário compartilhado, e não quem a passa.
      '  readonly count = { done: 1240, total: 5000 };',
      '  readonly labels = jobProgressLabels();',
      ...REQUEST,
    ],
  );
}

/** Correndo, e com de quantas: a barra mostra a fração. */
export function jobProgressRunningSource(): string {
  return single({ status: 'running', done: 1240, total: 5000 });
}

/**
 * Correndo sem saber de quantas — o que a peça existe para não errar.
 *
 * O total sai do snippet, e é o assunto: omiti-lo é o que faz a barra dizer
 * que não há estimativa. Ensinar `total: 0` aqui ensinaria a mandar um
 * denominador que ninguém pode dividir, e a barra desenharia trilha vazia —
 * "acabou de começar" — para algo que já andou muito.
 */
export function jobProgressUnknownTotalSource(): string {
  return single({ status: 'running', done: 1240 });
}

/** Interrompido: a barra congela onde chegou, e a ação oferece retomar. */
export function jobProgressStoppedSource(): string {
  return single({ status: 'stopped', done: 1240, total: 5000 });
}

/**
 * Concluído: a barra fica cheia, e a conta parcial continua no snippet.
 *
 * Ela fica de propósito — é o que mostra que quem decide a barra cheia é o
 * estado, e não a conta.
 */
export function jobProgressCompleteSource(): string {
  return single({ status: 'complete', done: 1240, total: 5000, action: false });
}

/** Falhou: a barra congela na cor de erro, e a ação oferece tentar de novo. */
export function jobProgressFailedSource(): string {
  return single({ status: 'failed', done: 1240, total: 5000 });
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
  return build(
    [IMPORT],
    ['NdsJobProgress'],
    [
      '    @for (job of jobs; track job.id) {',
      '      <div',
      '        ndsJobProgress',
      '        [label]="job.label"',
      '        [status]="job.status"',
      '        [count]="job.count"',
      '        [labels]="labels"',
      '        (action)="apply($event)"',
      '      ></div>',
      '    }',
    ],
    ['  readonly jobs = queuedJobs();', '  readonly labels = jobProgressLabels();', ...REQUEST],
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
  return build(
    [IMPORT, RUN_IMPORT],
    ['NdsJobProgress', 'NdsAgentStatus'],
    [
      '    <!-- As duas são AUTÔNOMAS: nenhuma sabe que a outra existe. A',
      '         resposta já terminou, e o trabalho longo continua correndo. -->',
      '    <p',
      '      ndsAgentStatus',
      '      status="complete"',
      '      elapsed="2:11"',
      '      [labels]="runLabels"',
      '    ></p>',
      '',
      '    <div',
      '      ndsJobProgress',
      `      label="${JOB_LABEL}"`,
      '      status="running"',
      '      [count]="count"',
      '      [labels]="labels"',
      '      (action)="apply($event)"',
      '    ></div>',
    ],
    [
      '  readonly count = { done: 1240, total: 5000 };',
      '  readonly labels = jobProgressLabels();',
      '  readonly runLabels = agentStatusLabels();',
      ...REQUEST,
    ],
  );
}
