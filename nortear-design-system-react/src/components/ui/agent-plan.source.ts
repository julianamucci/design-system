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
 * a lista chega RESUMIDA a três passos, com o comentário dizendo que é resumo —
 * cinco passos com rótulo e detalhe afogariam a chamada que o snippet existe
 * para ensinar.
 *
 * RESUMIDA, E NUNCA ELIDIDA. A versão anterior citava `proposedSteps`,
 * `runningSteps` e `titles` sem nunca declará-los, e quem copiasse recebia um
 * símbolo indefinido na primeira renderização. É a mesma exigência que o
 * compilador do Angular faz de expressão de template, do outro lado.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { AgentPlan } from "@/components/ui/agent-plan";';

const STATUS_IMPORT = 'import { AgentStatus } from "@/components/ui/agent-status";';

/** O que o control desenha quando ninguém mexeu nele. */
const FALLBACK_LABEL = 'Comparar com o trimestre anterior';
const FALLBACK_STATE = 'running';

/**
 * Os rótulos do plano, por INTEIRO.
 *
 * Não cabe resumir: o componente exige `plan` e a palavra de todos os cinco
 * estados, e um objeto pela metade não compila para quem copia — o tipo do
 * `state` é `Record` completo justamente para que estado sem palavra reprove a
 * compilação em vez de desenhar uma etiqueta vazia que ninguém repara.
 */
const LABELS_BLOCK = [
  'const labels = {',
  '  plan: "Plano",',
  '  // Um estado por chave: é a palavra que descreve, e não o marcador.',
  '  state: {',
  '    pending: "A fazer",',
  '    running: "Fazendo",',
  '    done: "Feito",',
  '    failed: "Falhou",',
  '    skipped: "Pulado",',
  '  },',
  '};',
].join('\n');

/**
 * Os rótulos da LINHA DE ESTADO, também por inteiro.
 *
 * Ela é peça irmã, e aparece nas duas composições. `status` traz os cinco
 * estados pelo mesmo motivo do plano; `action` fica de fora em espera e
 * concluída, e isso não é lacuna: começar uma execução é do campo de mensagem,
 * e sobre uma resposta pronta não há o que fazer ali.
 */
const STATUS_LABELS_BLOCK = [
  'const statusLabels = {',
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

/** Os três primeiros passos do plano de exemplo, na ordem em que se daria. */
const SAMPLE_LABELS = [
  'Ler o relatório de custos do trimestre',
  'Comparar com o trimestre anterior',
  'Buscar o histórico no arquivo antigo',
];

/** O detalhe que cabe ao estado — sem ele, a palavra sozinha não informa nada. */
const SAMPLE_DETAILS: Record<string, string> = {
  skipped: 'O relatório já trazia os doze meses.',
  failed: 'A planilha de origem não respondeu.',
};

/**
 * A lista de passos, declarada com o nome que AQUELE ramo usa.
 *
 * Mesma solução do preâmbulo da grade de atividade: nomes diferentes para a
 * mesma coisa (`proposedSteps` num ramo, `runningSteps` noutro) são o que diz
 * QUAL plano está na tela, então a declaração é gerada com o nome do ramo em
 * vez de todos os ramos convergirem para um nome só.
 */
function stepsBlock(name: string, states: readonly string[]): string {
  return [
    '// O plano do exemplo tem cinco passos — aqui, os três primeiros.',
    `const ${name} = [`,
    ...states.map((state, index) => {
      const detail = SAMPLE_DETAILS[state];
      const extra = detail === undefined ? '' : `, detail: "${detail}"`;
      const label = SAMPLE_LABELS[index] ?? FALLBACK_LABEL;
      return `  { id: "s${index + 1}", label: "${label}", state: "${state}"${extra} },`;
    }),
    '];',
  ].join('\n');
}

/**
 * O passo de rótulo longo, que é UM só.
 *
 * Aqui não há o que resumir: o assunto da story é o comprimento do rótulo, e
 * encurtá-lo apagaria justamente o que ela mostra.
 */
const LONG_STEPS_BLOCK = [
  'const longSteps = [',
  '  {',
  '    id: "s1",',
  '    label:',
  '      "Comparar o relatório de custos do trimestre com o do trimestre anterior, mês a mês, separando o que subiu por preço do que subiu por volume",',
  '    state: "running",',
  '  },',
  '];',
].join('\n');

/** A lista de cada ramo, pelo nome com que o ramo a cita. */
const STEP_LISTS: Record<string, string> = {
  proposedSteps: stepsBlock('proposedSteps', ['pending', 'pending', 'pending']),
  runningSteps: stepsBlock('runningSteps', ['done', 'done', 'running']),
  finishedSteps: stepsBlock('finishedSteps', ['done', 'done', 'skipped']),
  longSteps: LONG_STEPS_BLOCK,
};

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

/**
 * O import, a lista do ramo e os rótulos.
 *
 * `stepsRef` só declara constante quando o ramo cita uma: o Playground escreve
 * o passo por extenso dentro do atributo, e ali não há nome a declarar.
 */
function preamble(stepsRef?: string, withStatus = false): string {
  const parts = [withStatus ? [IMPORT, STATUS_IMPORT].join('\n') : IMPORT, ''];
  const list = stepsRef === undefined ? undefined : STEP_LISTS[stepsRef];
  if (list !== undefined) parts.push(list, '');
  parts.push(LABELS_BLOCK);
  if (withStatus) parts.push('', STATUS_LABELS_BLOCK);
  return parts.join('\n');
}

/** A lista e os rótulos, que é tudo que a peça recebe. */
function build(steps: string): string {
  return jsxSnippet(
    preamble(steps),
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
 *
 * Os títulos entram nos CINCO, e não em três: aqui a lista é indexada pelo
 * estado, e um título a menos deixaria um passo sem rótulo.
 */
export function agentPlanEveryStateSource(): string {
  return jsxSnippet(
    [
      [IMPORT, 'import { PLAN_STEP_STATES } from "@shared/primitives/chat-protocol";'].join('\n'),
      '',
      'const titles = [',
      '  "Ler o relatório de custos",',
      '  "Comparar com o trimestre anterior",',
      '  "Buscar o histórico no arquivo antigo",',
      '  "Montar o gráfico de variação",',
      '  "Escrever o resumo para a diretoria",',
      '];',
      '',
      LABELS_BLOCK,
    ].join('\n'),
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
    preamble(),
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
 * mostra isso montando-as lado a lado — cada uma com os SEUS rótulos, que é o
 * que a autonomia significa em código.
 */
export function agentPlanProposedWithStatusSource(): string {
  return jsxSnippet(
    preamble('proposedSteps', true),
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
    preamble('runningSteps', true),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  <AgentStatus status="running" elapsed="1:04" labels={statusLabels} />',
      '  <AgentPlan steps={runningSteps} labels={labels} />',
      '</div>',
    ].join('\n'),
  );
}
