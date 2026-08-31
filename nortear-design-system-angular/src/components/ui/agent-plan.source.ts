/**
 * Transforms do painel Code do plano.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os passos e os
 * rótulos, e que traz a guarda da lista vazia junto.
 *
 * A GUARDA APARECE EM TODO SNIPPET, e é de propósito: aqui a raiz é a própria
 * lista, então a peça não tem como se apagar sozinha quando não há passo nenhum.
 * Quem copia precisa disso na primeira linha que cola — uma lista com zero itens
 * seria anunciada como "lista, zero itens", que promete algo que não há.
 *
 * O Playground é o único que escreve o passo por extenso, e é de propósito: lá
 * os controls mudam o estado, o rótulo e o detalhe, e um snippet que mostrasse
 * só o nome de uma constante mentiria sobre o que a story renderiza. Nas demais
 * a lista é andaime — cinco passos de exemplo —, e despejá-la faria o painel
 * ensinar o andaime em vez da peça.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsAgentPlan } from '@/components/ui/agent-plan';";

const STATUS_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const STEP_IMPORT = "import type { PlanStep } from '@shared/primitives/chat-protocol';";

const PROTOCOL_IMPORT =
  "import { PLAN_STEP_STATES, type PlanStep } from '@shared/primitives/chat-protocol';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type AgentPlanSnippetOptions = {
  /** Em que pé está o passo que o Playground desenha. */
  state?: string;
  /** O que se faz naquele passo. */
  label?: string;
  /** O motivo, o resultado ou a falha. Vazio quando não há o que explicar. */
  detail?: string;
  /** O nome da lista pronta que o exemplo desenha, quando há uma. */
  stepsRef?: string;
  /** O snippet percorre o vocabulário compartilhado em vez de um passo só? */
  every?: boolean;
  /** O assunto do exemplo é a lista SEM passo nenhum? */
  empty?: boolean;
  /** A linha de estado que acompanha a lista, e em que pé ela está. */
  withStatus?: string;
  /** O relógio da linha de estado, já escrito. */
  elapsed?: string;
};

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
 * A lista, sempre atrás da guarda.
 *
 * A raiz é o próprio `<ol>`, então quem decide se ela existe é quem consome — e
 * é essa linha que separa "lista vazia" de "lista nenhuma".
 */
function planLines(pad: string): string[] {
  return [
    `${pad}@if (steps.length) {`,
    `${pad}  <ol ndsAgentPlan [steps]="steps" [labels]="labels"></ol>`,
    `${pad}}`,
  ];
}

/** O passo por extenso, na ordem em que o tipo declara os campos. */
function stepLiteral(opts: AgentPlanSnippetOptions): string[] {
  const fields = [
    "id: 's1'",
    `label: '${opts.label ?? 'Comparar com o trimestre anterior'}'`,
    `state: '${opts.state ?? 'running'}'`,
    opts.detail ? `detail: '${opts.detail}'` : undefined,
  ].filter((field): field is string => field !== undefined);

  return [
    '  readonly steps: PlanStep[] = [',
    `    { ${fields.join(', ')} },`,
    '  ];',
  ];
}

function agentPlanBuild(opts: AgentPlanSnippetOptions = {}): string {
  const header = [IMPORT];
  const used = ['NdsAgentPlan'];
  const body: string[] = [];

  if (opts.every) {
    header.push(PROTOCOL_IMPORT);
    body.push(
      '  // A lista sai do vocabulário compartilhado, e não de cinco linhas',
      '  // escritas à mão: estado novo entra sozinho, e nada fica para trás.',
      '  readonly steps: PlanStep[] = PLAN_STEP_STATES.map((state, index) => ({',
      '    label: titles[index]!,',
      '    state,',
      '  }));',
    );
  } else if (opts.empty) {
    header.push(STEP_IMPORT);
    body.push(
      '  // Sem passo nenhum, nada chega à tela: a guarda do template é o assunto',
      '  // deste exemplo, e é ela que impede a lista de prometer zero itens.',
      '  readonly steps: PlanStep[] = [];',
    );
  } else if (opts.stepsRef) {
    body.push(`  readonly steps = ${opts.stepsRef};`);
  } else {
    header.push(STEP_IMPORT);
    body.push(...stepLiteral(opts));
  }

  body.push('  readonly labels = agentPlanLabels();');

  if (opts.withStatus) {
    header.splice(1, 0, STATUS_IMPORT);
    used.push('NdsAgentStatus');
    body.push('  readonly statusLabels = agentStatusLabels();');

    return build(
      header,
      used,
      [
        '    <!-- As duas peças são IRMÃS: nenhuma é entrada da outra, e nenhum',
        '         arquivo de uma sabe que a outra existe. A linha diz em que pé',
        '         está a resposta, e o plano detalha os passos dentro dela. -->',
        '    <div class="nds-stack nds-max-w-lg" data-spacing="sm">',
        '      <p',
        '        ndsAgentStatus',
        `        status="${opts.withStatus}"`,
        ...(opts.elapsed ? [`        elapsed="${opts.elapsed}"`] : []),
        '        [labels]="statusLabels"',
        '      ></p>',
        ...planLines('      '),
        '    </div>',
      ],
      body,
    );
  }

  return build(
    header,
    used,
    [
      '    <!-- A raiz É a lista, então a guarda fica com quem consome: a peça',
      '         não tem como se apagar sozinha, e uma lista com zero itens',
      '         prometeria passos que não existem. -->',
      ...planLines('    '),
    ],
    body,
  );
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type AgentPlanSourceTransform = (
  code: string,
  ctx?: { args?: AgentPlanSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve o passo por extenso.
 *
 * Os args vêm dos controls: o estado, o rótulo e o detalhe.
 */
export const agentPlanSource: AgentPlanSourceTransform = (_code, ctx) =>
  agentPlanBuild({ ...(ctx?.args ?? {}) });

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: AgentPlanSnippetOptions): AgentPlanSourceTransform {
  return (_code, ctx) => agentPlanBuild({ ...(ctx?.args ?? {}), ...fixed });
}

/**
 * Um passo por estado, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `PLAN_STEP_STATES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export const agentPlanEveryStateSource = withFixed({ every: true });

/** O plano proposto, antes de agir: nada começou, e o primeiro é o atual. */
export const agentPlanProposedSource = withFixed({ stepsRef: 'proposedSteps' });

/** A lista mantida durante o trabalho: dois fechados, um em curso. */
export const agentPlanInProgressSource = withFixed({ stepsRef: 'runningSteps' });

/** O plano encerrado: o pulado e o que falhou, lado a lado. */
export const agentPlanFinishedSource = withFixed({ stepsRef: 'finishedSteps' });

/** O rótulo longo, que quebra em linhas em vez de receber reticências. */
export const agentPlanLongLabelSource = withFixed({ stepsRef: 'longSteps' });

/**
 * A lista SEM passo nenhum.
 *
 * É o único snippet cujo assunto é a guarda: sem ela, uma lista de zero itens
 * chegaria à tela prometendo passos que não existem.
 */
export const agentPlanEmptySource = withFixed({ empty: true });

/**
 * O plano PROPOSTO, ao lado da linha de estado.
 *
 * As duas peças são IRMÃS: a linha diz em que pé está a resposta, e o plano
 * detalha os passos dentro dela. Nenhuma das duas é entrada da outra, e o
 * snippet mostra isso montando-as lado a lado.
 */
export const agentPlanProposedWithStatusSource = withFixed({
  stepsRef: 'proposedSteps',
  withStatus: 'idle',
});

/**
 * A LISTA DE TAREFAS mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesmo binding: o que muda é a lista que chega e o
 * estado da linha acima. É o que a decisão de não criar um segundo componente
 * afirma, escrito em código.
 */
export const agentPlanTaskListSource = withFixed({
  stepsRef: 'runningSteps',
  withStatus: 'running',
  elapsed: '1:04',
});
