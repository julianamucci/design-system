/**
 * Transforms do painel Code do plano.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import {
  attrsMultilinha,
  indentar,
  vueSnippet,
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

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { AgentPlan } from '@/components/ui/agent-plan';";

const IMPORT_STATES = [
  IMPORT,
  "import { PLAN_STEP_STATES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_WITH_STATUS = [
  IMPORT,
  "import { AgentStatus } from '@/components/ui/agent-status';",
].join('\n');

/**
 * O que o exemplo DECLARA, além do que ele importa.
 *
 * `:labels="labels"` nomeia texto de interface, que é de quem consome — e até
 * aqui nenhum exemplo o declarava: quem copiasse recebia um `labels`
 * indefinido, e a peça não tem rótulo padrão para cair de volta.
 */
const ROTULOS = [
  'const labels = {',
  "  plan: 'Plano',",
  "  state: { pending: 'A fazer', running: 'Fazendo', done: 'Feito', failed: 'Falhou', skipped: 'Pulado' },",
  '};',
].join('\n');

/** Os rótulos da linha de estado, que entra ao lado do plano em duas stories. */
const ROTULOS_DA_LINHA = [
  'const statusLabels = {',
  "  status: { idle: 'Em espera', running: 'Respondendo', stopped: 'Interrompida', complete: 'Concluída', failed: 'Falhou' },",
  "  action: { running: 'Parar', stopped: 'Retomar', failed: 'Tentar de novo' },",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS].join('\n');
/**
 * Um rótulo por estado, na ordem em que `PLAN_STEP_STATES` os declara.
 *
 * A lista percorrida sai do vocabulário compartilhado; o TEXTO de cada passo é
 * de quem consome, e por isso ele entra declarado aqui — sem esta linha o
 * exemplo lia `titles[index]` de um nome que não existe.
 */
const TITULOS = [
  'const titles = [',
  "  'Ler o arquivo',",
  "  'Comparar com o trimestre anterior',",
  "  'Escrever o resumo',",
  "  'Enviar por e-mail',",
  "  'Arquivar a versão antiga',",
  '];',
].join('\n');

const SETUP_STATES = [IMPORT_STATES, '', ROTULOS, '', TITULOS].join('\n');
const SETUP_WITH_STATUS = [IMPORT_WITH_STATUS, '', ROTULOS, '', ROTULOS_DA_LINHA].join('\n');

/**
 * A guarda da lista vazia, dita onde ela mora nesta stack.
 *
 * A peça não desenha nada quando não há passo nenhum, e quem copia precisa
 * saber disso na primeira linha que cola: uma lista com zero itens seria
 * anunciada como tal, prometendo algo que não há.
 */
const EMPTY_NOTE =
  '<!-- Lista vazia não desenha nada: zero itens prometeriam o que não há. -->';

/** Uma string de código, entre aspas simples. */
function quoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** A tag do plano, com os dois únicos atributos que ela tem. */
function planTag(steps: string, labels = 'labels'): string {
  const attributes = attrsMultilinha([`:steps="${steps}"`, `:labels="${labels}"`]);
  return `<AgentPlan${attributes} />`;
}

/** O corpo do snippet, com a guarda da lista vazia sempre presente. */
function build(steps: string, script: string = SETUP): string {
  return vueSnippet(script, [EMPTY_NOTE, planTag(steps)].join('\n'));
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
export const agentPlanSource: SourceTransform<AgentPlanSnippetOptions> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build('steps', [IMPORT, '', ROTULOS, '', stepLiteral(args)].join('\n'));
};

/**
 * Um passo por estado, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `PLAN_STEP_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentPlanEveryStateSource(): string {
  return vueSnippet(
    SETUP_STATES,
    [
      '<AgentPlan',
      '  :steps="PLAN_STEP_STATES.map((state, index) => ({ label: titles[index], state }))"',
      '  :labels="labels"',
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
 * copia precisa saber que uma lista vazia nunca chega à tela.
 */
export function agentPlanEmptySource(): string {
  return vueSnippet(
    SETUP,
    [
      '<!-- Nada é desenhado: uma lista vazia prometeria zero passos. -->',
      planTag('[]'),
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
  const body = [
    '<!-- A linha fala da execução inteira; o plano detalha os passos dela. -->',
    '<AgentStatus status="idle" :labels="statusLabels" />',
    EMPTY_NOTE,
    planTag('proposedSteps'),
  ].join('\n');

  return vueSnippet(
    SETUP_WITH_STATUS,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}

/**
 * A LISTA DE TAREFAS mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesma tag: o que muda é a lista que chega e o
 * estado da linha acima. É o que a decisão de não criar um segundo componente
 * afirma, escrito em código.
 */
export function agentPlanTaskListSource(): string {
  const body = [
    '<!-- Mesma peça do plano proposto: o que muda é a lista que chega. -->',
    '<AgentStatus status="running" elapsed="1:04" :labels="statusLabels" />',
    EMPTY_NOTE,
    planTag('runningSteps'),
  ].join('\n');

  return vueSnippet(
    SETUP_WITH_STATUS,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
