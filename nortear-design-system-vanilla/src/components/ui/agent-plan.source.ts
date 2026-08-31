// Snippet do painel Code do plano — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve o passo por extenso, e é de propósito: lá
// os controls mudam o estado, o rótulo e o detalhe, e um snippet que mostrasse
// só o nome de uma constante mentiria sobre o que a story renderiza. Nas demais
// a lista é andaime — cinco passos de exemplo —, e despejá-la faria o painel
// ensinar o andaime em vez da peça.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

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
  const fields = [
    `id: ${text('s1')}`,
    `label: ${text(opts.label ?? 'Comparar com o trimestre anterior')}`,
    `state: ${text(opts.state ?? 'running')}`,
    opts.detail ? `detail: ${text(opts.detail)}` : undefined,
  ].filter((field): field is string => field !== undefined);

  return `[\n    { ${fields.join(', ')} },\n  ]`;
}

/**
 * O corpo do snippet, com a guarda da lista vazia sempre presente.
 *
 * A fábrica devolve nada quando não há passo nenhum, e quem copia precisa saber
 * disso na primeira linha que cola: uma `<ol>` vazia seria anunciada como
 * "lista com zero itens", que promete algo que não há.
 */
function build(steps: string): string {
  const call = callLine('createAgentPlan', options([
    ['steps', steps],
    ['labels', 'labels'],
  ]));

  return snippet(
    importing('agent-plan', 'createAgentPlan'),
    `const plan = ${call};`,
    `// Lista vazia não desenha nada.\nif (plan) ${appendLine('plan')}`,
  );
}

/** Transform do `meta` — o Playground, que escreve o passo por extenso. */
export const agentPlanSource: SourceTransform<AgentPlanSnippetOptions> = (_c, ctx) => {
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
  const call = callLine('createAgentPlan', options([
    ['steps', 'PLAN_STEP_STATES.map((state, index) => ({ label: titles[index], state }))'],
    ['labels', 'labels'],
  ]));

  return snippet(
    [
      importing('agent-plan', 'createAgentPlan'),
      "import { PLAN_STEP_STATES } from '@shared/primitives/chat-protocol';",
    ].join('\n'),
    `const plan = ${call};`,
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
 * É o único snippet cujo assunto é a guarda: a fábrica devolve nada, e quem
 * copia precisa do teste que impede uma lista vazia de chegar à tela.
 */
export function agentPlanEmptySource(): string {
  const call = callLine('createAgentPlan', options([
    ['steps', '[]'],
    ['labels', 'labels'],
  ]));

  return snippet(
    importing('agent-plan', 'createAgentPlan'),
    `const plan = ${call};`,
    `// Nada é desenhado: uma lista vazia prometeria zero passos.\nif (plan) ${appendLine('plan')}`,
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
  const plan = callLine('createAgentPlan', options([
    ['steps', 'proposedSteps'],
    ['labels', 'labels'],
  ]));

  const status = callLine('createAgentStatus', options([
    ['status', text('idle')],
    ['labels', 'statusLabels'],
  ]));

  return snippet(
    [
      importing('agent-plan', 'createAgentPlan'),
      importing('agent-status', 'createAgentStatus'),
    ].join('\n'),
    [
      `const agentStatus = ${status};`,
      `const plan = ${plan};`,
    ].join('\n'),
    `document.querySelector('#app')?.append(agentStatus, plan);`,
  );
}

/**
 * A LISTA DE TAREFAS mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesma chamada: o que muda é a lista que chega e o
 * estado da linha acima. É o que a decisão de não criar um segundo componente
 * afirma, escrito em código.
 */
export function agentPlanTaskListSource(): string {
  const plan = callLine('createAgentPlan', options([
    ['steps', 'runningSteps'],
    ['labels', 'labels'],
  ]));

  const status = callLine('createAgentStatus', options([
    ['status', text('running')],
    ['elapsed', text('1:04')],
    ['labels', 'statusLabels'],
  ]));

  return snippet(
    [
      importing('agent-plan', 'createAgentPlan'),
      importing('agent-status', 'createAgentStatus'),
    ].join('\n'),
    [
      `const agentStatus = ${status};`,
      `const plan = ${plan};`,
    ].join('\n'),
    `document.querySelector('#app')?.append(agentStatus, plan);`,
  );
}
