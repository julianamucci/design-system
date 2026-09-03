/**
 * Transforms do painel Code do plano.
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
 * O Playground é o único que escreve o passo por extenso, e é de propósito: lá
 * os controls mudam o estado, o rótulo e o detalhe, e um snippet que mostrasse
 * só o nome de uma constante mentiria sobre o que a story renderiza. Nas demais
 * a lista é andaime — cinco passos de exemplo —, e despejá-la faria o painel
 * ensinar o andaime em vez da peça.
 */
import { svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type AgentPlanSnippetOptions = {
  /** Em que pé está o passo que o Playground desenha. */
  state?: string;
  /** O que se faz naquele passo. */
  label?: string;
  /** O motivo, o resultado ou a falha. Vazio quando não há o que explicar. */
  detail?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: AgentPlanSnippetOptions };

const IMPORT = "import { AgentPlan } from '@/components/ui/agent-plan';";
const IMPORT_STATUS = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_STATES =
  "import { PLAN_STEP_STATES } from '@shared/primitives/chat-protocol';";

/** Texto entre aspas simples, que é como o snippet desta stack escreve string. */
function quoted(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`;
}

/**
 * As declarações do exemplo, escritas por extenso.
 *
 * NOME LIGADO É NOME DECLARADO. O bloco do painel é copiado inteiro, e o que
 * mora só no arquivo da story fica para trás — quem colasse receberia `labels`
 * e `proposedSteps` sem nada por baixo. A lista continua entrando por NOME e
 * não por extenso: o que passa a aparecer é a declaração, não o conteúdo dela.
 */
const DECL_LABELS = 'const labels = { /* os rótulos do plano */ };';
const DECL_STATUS_LABELS = 'const statusLabels = { /* os rótulos da linha de estado */ };';

/** A lista de passos que a story mostra, declarada com o nome que ela liga. */
function declPassos(nome: string): string {
  return [
    '// Os passos vêm de quem monta o plano: o que se faz, em que pé está e o',
    '// motivo, o resultado ou a falha.',
    `const ${nome} = [/* os passos do plano */];`,
  ].join('\n');
}

/** O `<script>` do exemplo: os imports e o que a marcação liga. */
function bloco(imports: string[], ...declaracoes: string[]): string {
  return [...imports, '', ...declaracoes].join('\n');
}

/**
 * O uso da peça, com os passos vindos de onde a story diz.
 *
 * `{labels}` abreviado porque o nome da constante é o nome da prop: repetir
 * `labels={labels}` ensina ruído a quem copia.
 */
function usage(stepsAttribute: string): string {
  return `<AgentPlan ${stepsAttribute} {labels} />`;
}

/** O passo por extenso, na ordem em que o tipo declara os campos. */
function stepLiteral(opts: AgentPlanSnippetOptions): string {
  const fields = [
    `id: ${quoted('s1')}`,
    `label: ${quoted(opts.label ?? 'Comparar com o trimestre anterior')}`,
    `state: ${quoted(opts.state ?? 'running')}`,
    opts.detail ? `detail: ${quoted(opts.detail)}` : undefined,
  ].filter((field): field is string => field !== undefined);

  return `const steps = [\n  { ${fields.join(', ')} },\n];`;
}

/** Transform do `meta` — o Playground, que escreve o passo por extenso. */
export function agentPlanSource(_generated?: unknown, ctx?: StoryContext): string {
  return svelteSnippet(
    bloco([IMPORT], stepLiteral(ctx?.args ?? {}), DECL_LABELS),
    usage('{steps}'),
  );
}

/**
 * Um passo por estado, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `PLAN_STEP_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentPlanEveryStateSource(): string {
  const script = bloco(
    [IMPORT, IMPORT_STATES],
    '// Um título por estado, na ordem em que o vocabulário compartilhado os declara.',
    'const titles = [/* os títulos do exemplo */];',
    '',
    'const steps = PLAN_STEP_STATES.map((state, index) => ({',
    '  label: titles[index],',
    '  state,',
    '}));',
    DECL_LABELS,
  );

  return svelteSnippet(script, usage('{steps}'));
}

/** O plano proposto, antes de agir: nada começou, e o primeiro é o atual. */
export function agentPlanProposedSource(): string {
  return svelteSnippet(
    bloco([IMPORT], declPassos('proposedSteps'), DECL_LABELS),
    usage('steps={proposedSteps}'),
  );
}

/** A lista mantida durante o trabalho: dois fechados, um em curso. */
export function agentPlanInProgressSource(): string {
  return svelteSnippet(
    bloco([IMPORT], declPassos('runningSteps'), DECL_LABELS),
    usage('steps={runningSteps}'),
  );
}

/** O plano encerrado: o pulado e o que falhou, lado a lado. */
export function agentPlanFinishedSource(): string {
  return svelteSnippet(
    bloco([IMPORT], declPassos('finishedSteps'), DECL_LABELS),
    usage('steps={finishedSteps}'),
  );
}

/** O rótulo longo, que quebra em linhas em vez de receber reticências. */
export function agentPlanLongLabelSource(): string {
  return svelteSnippet(
    bloco([IMPORT], declPassos('longSteps'), DECL_LABELS),
    usage('steps={longSteps}'),
  );
}

/**
 * A lista SEM passo nenhum.
 *
 * É o único snippet cujo assunto é a ausência: nesta stack a peça não desenha
 * nada quando a lista chega vazia, e quem copia precisa saber que não há teste
 * nenhum a escrever do lado de fora.
 */
export function agentPlanEmptySource(): string {
  const markup = [
    '<!-- Nada é desenhado: uma lista vazia prometeria zero passos. -->',
    usage('steps={[]}'),
  ].join('\n');

  return svelteSnippet(bloco([IMPORT], DECL_LABELS), markup);
}

/**
 * O plano PROPOSTO, ao lado da linha de estado.
 *
 * As duas peças são IRMÃS: a linha diz em que pé está a resposta, e o plano
 * detalha os passos dentro dela. Nenhuma das duas é prop da outra, e o snippet
 * mostra isso montando-as lado a lado.
 */
export function agentPlanProposedWithStatusSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="sm">',
    '  <AgentStatus status="idle" labels={statusLabels} />',
    `  ${usage('steps={proposedSteps}')}`,
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_STATUS],
      declPassos('proposedSteps'),
      DECL_LABELS,
      DECL_STATUS_LABELS,
    ),
    markup,
  );
}

/**
 * A LISTA DE TAREFAS mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesma marcação: o que muda é a lista que chega e
 * o estado da linha acima. É o que a decisão de não criar um segundo componente
 * afirma, escrito em código.
 */
export function agentPlanTaskListSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="sm">',
    '  <AgentStatus status="running" elapsed="1:04" labels={statusLabels} />',
    `  ${usage('steps={runningSteps}')}`,
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_STATUS],
      declPassos('runningSteps'),
      DECL_LABELS,
      DECL_STATUS_LABELS,
    ),
    markup,
  );
}
