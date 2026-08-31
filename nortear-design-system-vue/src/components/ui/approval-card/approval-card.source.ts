/**
 * Transforms do painel Code do cartão de autorização.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a pergunta por extenso, e é de propósito:
 * lá os controls a mudam, e um snippet que mostrasse só o nome de uma constante
 * mentiria sobre o que a story renderiza. Nas demais o assunto é a FORMA do
 * cartão, e o que varia é qual argumento chega — por isso o alcance aparece
 * como nome de variável, que é como quem consome o escreve.
 */
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que a story muda e que o snippet precisa mostrar. */
export type ApprovalCardArgs = {
  /** A pergunta, por extenso. */
  question?: string;
  /** O nome do exemplo do alcance. Ausente desenha o cartão sem lista. */
  scope?: string;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ApprovalCard } from '@/components/ui/approval-card';";

const IMPORT_WITH_BUTTON = [
  IMPORT,
  "import { Button } from '@/components/ui/button';",
].join('\n');

const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

// O aviso sai por EVENTO nesta stack: quem consome o escuta e decide o que a
// escolha significa.
const ON_CHOOSE = '@choose="answer"';

/**
 * Os controles, um por escolha, no espaço que a peça abre.
 *
 * Todos com a MESMA ênfase, e é decisão: dar destaque visual a "permitir" num
 * cartão de autorização empurra para aprovar, que é padrão escuro conhecido em
 * diálogo de permissão. O valor que declara o controle como resposta é escrito
 * AQUI, por quem monta — é o único pedaço do contrato que atravessa a fronteira
 * do que a peça desenha.
 */
const ACTIONS_SLOT = [
  '<template #actions>',
  '  <Button',
  '    v-for="choice in choices"',
  '    :key="choice.value"',
  '    variant="outline"',
  '    size="sm"',
  '    :data-approval-choice="choice.value"',
  '  >{{ choice.label }}</Button>',
  '</template>',
].join('\n');

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeOf(name: string): string {
  return `${name}Scope`;
}

type CardShape = {
  question?: string;
  scope?: string;
  /** Sem controle nenhum o cartão fecha em si mesmo, e o aviso some junto. */
  actions?: boolean;
};

function approvalTag(opts: CardShape): string {
  const attributes = attrsMultilinha([
    `question="${text(opts.question, DEFAULT_QUESTION)}"`,
    opts.scope ? `:scope="${opts.scope}"` : undefined,
    // Sem controle nenhum não há o que escolher, então o aviso não teria como
    // disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    opts.actions === false ? undefined : ON_CHOOSE,
  ]);

  if (opts.actions === false) return `<ApprovalCard${attributes} />`;
  return [`<ApprovalCard${attributes}>`, indentar(ACTIONS_SLOT), '</ApprovalCard>'].join('\n');
}

function build(opts: CardShape): string {
  return vueSnippet(opts.actions === false ? IMPORT : IMPORT_WITH_BUTTON, approvalTag(opts));
}

/** Transform do `meta` — o Playground, que escreve a pergunta por extenso. */
export const approvalCardSource: SourceTransform<ApprovalCardArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    question: args.question,
    scope: args.scope && args.scope !== 'none' ? scopeOf(args.scope) : undefined,
  });
};

/** O cartão inteiro: a pergunta, o alcance e o espaço da resposta. */
export function approvalCardWithScopeSource(): string {
  return build({ scope: scopeOf('publish') });
}

/**
 * Sem alcance.
 *
 * O snippet não passa a lista, e é o assunto: a peça não desenha uma caixa
 * vazia no lugar dela.
 */
export function approvalCardWithoutScopeSource(): string {
  return build({});
}

/**
 * O caminho comprido.
 *
 * Ele entra inteiro, e é o que a story mostra: alcance pela metade é
 * autorização pela metade, então o valor quebra em vez de receber reticências.
 */
export function approvalCardLongDetailSource(): string {
  return build({ scope: scopeOf('writeFile') });
}

/**
 * Mais de duas escolhas.
 *
 * A ordem é a do produto do exemplo, e a peça não a conhece: para ela, o espaço
 * dos controles é um slot que chega desenhado.
 */
export function approvalCardManyChoicesSource(): string {
  return build({ scope: scopeOf('spend') });
}

/**
 * Sem controle nenhum.
 *
 * A caixa da resposta não é desenhada, e o aviso some junto — não há o que
 * escolher. A pergunta continua à vista, e responder passa a depender de algo
 * que está fora do cartão.
 */
export function approvalCardWithoutActionsSource(): string {
  return build({ scope: scopeOf('publish'), actions: false });
}

/**
 * A execução que espera por uma pessoa, FORA da caixa recolhida.
 *
 * Quem separa é quem consome, e a conta vem do vocabulário compartilhado. Um
 * componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 */
export function approvalCardOutsideTheGroupSource(): string {
  const script = [
    IMPORT_WITH_BUTTON,
    "import { ToolGroup } from '@/components/ui/tool-group';",
    "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';",
    '',
    'const { grouped, waiting } = splitWaitingCalls(calls);',
  ].join('\n');

  const card = [
    '<ApprovalCard',
    '  v-for="call in waiting"',
    '  :key="call.id"',
    '  :question="question"',
    '  :scope="scopeOfWaiting(call)"',
    `  ${ON_CHOOSE}`,
    '>',
    indentar(ACTIONS_SLOT),
    '</ApprovalCard>',
  ].join('\n');

  const body = [
    '<!-- À vista, e antes do que já aconteceu: pedir autorização dentro de',
    '     uma caixa fechada é pedir sem mostrar. -->',
    card,
    '<ToolGroup',
    '  :calls="grouped"',
    '  :labels="groupLabels"',
    '/>',
  ].join('\n');

  return vueSnippet(
    script,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}

/**
 * Quem responde, e quem só estava ali.
 *
 * O atributo é o único pedaço do contrato que atravessa a fronteira: quem
 * escreve é quem monta os controles, e é ele que diz qual deles conta como
 * resposta.
 */
export function approvalCardAnsweringSource(): string {
  const slot = [
    '<template #actions>',
    '  <!-- Só o controle que traz o atributo conta como resposta. -->',
    '  <Button',
    '    variant="outline"',
    '    size="sm"',
    '    data-approval-choice="allow-once"',
    '  >Permitir uma vez</Button>',
    '',
    '  <!-- Este não traz, e por isso não dispara nada. -->',
    '  <Button',
    '    variant="ghost"',
    '    size="sm"',
    '  >Saiba mais</Button>',
    '</template>',
  ].join('\n');

  const card = [
    '<ApprovalCard',
    `  question="${DEFAULT_QUESTION}"`,
    `  :scope="${scopeOf('publish')}"`,
    `  ${ON_CHOOSE}`,
    '>',
    indentar(slot),
    '</ApprovalCard>',
  ].join('\n');

  return vueSnippet(IMPORT_WITH_BUTTON, card);
}
