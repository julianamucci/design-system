/**
 * Snippet do painel Code do plano — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve o passo por extenso, e é de propósito: lá
 * os controls mudam o estado, o rótulo e o detalhe, e um snippet que mostrasse
 * só o nome de uma constante mentiria sobre o que a story renderiza. Nas demais
 * a lista é andaime — cinco passos de exemplo —, e despejá-la faria o painel
 * ensinar o andaime em vez da peça.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { AgentPlan } from "@/components/ui/agent-plan";';

const STATUS_IMPORT = 'import { AgentStatus } from "@/components/ui/agent-status";';

/** O que o control desenha quando ninguém mexeu nele. */
const FALLBACK_LABEL = 'Comparar com o trimestre anterior';
const FALLBACK_STATE = 'running';

export type AgentPlanSnippetOptions = {
  /** Em que pé está o passo que o Playground desenha. */
  state?: string;
  /** O que se faz naquele passo. */
  label?: string;
  /** O motivo, o resultado ou a falha. Vazio quando não há o que explicar. */
  detail?: string;
};

/** O passo por extenso, na ordem em que o tipo declara os campos. */
function stepLiteral(opts: AgentPlanSnippetOptions): string {
  const detail = text(opts.detail);

  const fields = [
    'id: "s1"',
    `label: "${text(opts.label) ?? FALLBACK_LABEL}"`,
    `state: "${text(opts.state) ?? FALLBACK_STATE}"`,
    detail === undefined ? undefined : `detail: "${detail}"`,
  ].filter((field): field is string => field !== undefined);

  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

/** A lista e os rótulos, que é tudo que a peça recebe. */
function build(steps: string): string {
  return jsxSnippet(
    IMPORT,
    `<AgentPlan${attrsMultilinha([`steps={${steps}}`, 'labels={labels}'])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve o passo por extenso. */
export const agentPlanSource: SourceTransform<AgentPlanSnippetOptions> = (_generated, ctx) => {
  return build(stepLiteral(ctx?.args ?? {}));
};

/**
 * Um passo por estado, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `PLAN_STEP_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentPlanEveryStateSource(): string {
  return jsxSnippet(
    [IMPORT, 'import { PLAN_STEP_STATES } from "@shared/primitives/chat-protocol";'].join('\n'),
    [
      '<AgentPlan',
      '  steps={PLAN_STEP_STATES.map((state, index) => ({ label: titles[index], state }))}',
      '  labels={labels}',
      '/>',
    ].join('\n'),
  );
}

/** O plano proposto, antes de agir: nada começou, e o primeiro é o atual. */
export function agentPlanProposedSource(): string {
  return build('proposedSteps');
}

/** A lista mantida durante o trabalho: dois fechados, um em curso. */
export function agentPlanInProgressSource(): string {
  return build('runningSteps');
}

/** O plano encerrado: o pulado e o que falhou, lado a lado. */
export function agentPlanFinishedSource(): string {
  return build('finishedSteps');
}

/** O rótulo longo, que quebra em linhas em vez de receber reticências. */
export function agentPlanLongLabelSource(): string {
  return build('longSteps');
}

/**
 * A lista SEM passo nenhum.
 *
 * É o único snippet cujo assunto é a guarda: a peça não desenha nada, e quem
 * copia precisa saber disso antes de reservar espaço para ela na tela.
 */
export function agentPlanEmptySource(): string {
  return jsxSnippet(
    IMPORT,
    [
      '// Sem passo nenhum a peça não desenha nada: uma lista vazia seria',
      '// anunciada como "lista com zero itens", que promete algo que não há.',
      '<AgentPlan steps={[]} labels={labels} />',
    ].join('\n'),
  );
}

/**
 * O plano PROPOSTO, ao lado da linha de estado.
 *
 * As duas peças são IRMÃS: a linha diz em que pé está a resposta, e o plano
 * detalha os passos dentro dela. Nenhuma das duas é prop da outra, e o snippet
 * mostra isso montando-as lado a lado.
 */
export function agentPlanProposedWithStatusSource(): string {
  return jsxSnippet(
    [IMPORT, STATUS_IMPORT].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <AgentStatus status="idle" labels={statusLabels} />',
      '  <AgentPlan steps={proposedSteps} labels={labels} />',
      '</div>',
    ].join('\n'),
  );
}

/**
 * A LISTA DE TAREFAS mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesma composição: o que muda é a lista que chega
 * e o estado da linha acima. É o que a decisão de não criar um segundo
 * componente afirma, escrito em código.
 */
export function agentPlanTaskListSource(): string {
  return jsxSnippet(
    [IMPORT, STATUS_IMPORT].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <AgentStatus status="running" elapsed="1:04" labels={statusLabels} />',
      '  <AgentPlan steps={runningSteps} labels={labels} />',
      '</div>',
    ].join('\n'),
  );
}
