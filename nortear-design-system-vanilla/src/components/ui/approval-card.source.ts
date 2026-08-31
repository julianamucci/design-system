// Snippet do painel Code do cartão de autorização — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground é o único que escreve a pergunta por extenso, e é de propósito:
// lá os controls a mudam, e um snippet que mostrasse só o nome de uma constante
// mentiria sobre o que a story renderiza. Nas demais o assunto é a FORMA do
// cartão, e o que varia é qual argumento chega — por isso o alcance e os
// controles aparecem como nome de variável, que é como quem consome os escreve.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ApprovalCardSnippetOptions = {
  /** A pergunta, por extenso. */
  question?: string;
  /** A expressão do alcance. Ausente desenha o cartão sem lista. */
  scope?: string;
  /** A expressão dos controles. Ausente não desenha a caixa da resposta. */
  actions?: string;
};

const ON_CHOOSE = '(choice) => answer(choice)';
const CHOICES = 'choices';
const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeOf(name: string): string {
  return `${name}Scope`;
}

function build(opts: ApprovalCardSnippetOptions): string {
  const lines = options([
    ['question', text(opts.question ?? DEFAULT_QUESTION)],
    ['scope', opts.scope],
    ['actions', opts.actions],
    // Sem controle nenhum não há o que escolher, então o retorno não teria como
    // disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    ['onChoose', opts.actions ? ON_CHOOSE : undefined],
  ]);

  return snippet(
    importing('approval-card', 'createApprovalCard'),
    `const approvalCard = ${callLine('createApprovalCard', lines)};`,
    appendLine('approvalCard'),
  );
}

/** Transform do `meta` — o Playground, que escreve a pergunta por extenso. */
export const approvalCardSource: SourceTransform<{ question: string; scope: string }> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({
    question: args.question,
    scope: args.scope && args.scope !== 'none' ? scopeOf(args.scope) : undefined,
    actions: CHOICES,
  });
};

/** O cartão inteiro: a pergunta, o alcance e o espaço da resposta. */
export function approvalCardWithScopeSource(): string {
  return build({ scope: scopeOf('publish'), actions: CHOICES });
}

/**
 * Sem alcance.
 *
 * O snippet não passa a lista, e é o assunto: a peça não desenha uma caixa
 * vazia no lugar dela.
 */
export function approvalCardWithoutScopeSource(): string {
  return build({ actions: CHOICES });
}

/**
 * O caminho comprido.
 *
 * Ele entra inteiro, e é o que a story mostra: alcance pela metade é
 * autorização pela metade, então o valor quebra em vez de receber reticências.
 */
export function approvalCardLongDetailSource(): string {
  return build({ scope: scopeOf('writeFile'), actions: CHOICES });
}

/**
 * Mais de duas escolhas.
 *
 * A ordem é a do produto do exemplo, e a peça não a conhece: para ela, o espaço
 * dos controles é uma lista de elementos que chega pronta.
 */
export function approvalCardManyChoicesSource(): string {
  return build({ scope: scopeOf('spend'), actions: CHOICES });
}

/**
 * Sem controle nenhum.
 *
 * A caixa da resposta não é desenhada, e o retorno some junto — não há o que
 * escolher. A pergunta continua à vista, e responder passa a depender de algo
 * que está fora do cartão.
 */
export function approvalCardWithoutActionsSource(): string {
  return build({ scope: scopeOf('publish') });
}

/**
 * A execução que espera por uma pessoa, FORA da caixa recolhida.
 *
 * Quem separa é quem consome, e a conta vem do vocabulário compartilhado. Um
 * componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 */
export function approvalCardOutsideTheGroupSource(): string {
  return snippet(
    [
      importing('approval-card', 'createApprovalCard'),
      importing('tool-group', 'createToolGroup'),
      "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';",
    ].join('\n'),
    'const { grouped, waiting } = splitWaitingCalls(calls);',
    [
      '// À vista, e antes do que já aconteceu: pedir autorização dentro de uma',
      '// caixa fechada é pedir sem mostrar.',
      'const cards = waiting.map((item) =>',
      `  ${callLine('createApprovalCard', options([
        ['question', text('Permitir que o agente conceda o acesso?')],
        ['scope', 'scopeOfWaiting(item)'],
        ['actions', CHOICES],
        ['onChoose', ON_CHOOSE],
      ]))},`,
      ');',
    ].join('\n'),
    [
      "document.querySelector('#app')?.append(",
      '  ...cards,',
      `  ${callLine('createToolGroup', options([
        ['calls', 'grouped'],
        ['labels', 'toolGroupLabels'],
      ]))},`,
      ');',
    ].join('\n'),
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
  return snippet(
    importing('approval-card', 'createApprovalCard'),
    [
      '// Só o controle que traz o atributo conta como resposta.',
      "const allowOnce = document.createElement('button');",
      "allowOnce.className = 'nds-button nds-button-sm nds-button-outline';",
      "allowOnce.textContent = 'Permitir uma vez';",
      "allowOnce.dataset.approvalChoice = 'allow-once';",
      '',
      '// Este não traz, e por isso não dispara nada.',
      "const learnMore = document.createElement('button');",
      "learnMore.className = 'nds-button nds-button-sm nds-button-ghost';",
      "learnMore.textContent = 'Saiba mais';",
    ].join('\n'),
    `const approvalCard = ${callLine('createApprovalCard', options([
      ['question', text(DEFAULT_QUESTION)],
      ['scope', scopeOf('publish')],
      ['actions', '[allowOnce, learnMore]'],
      ['onChoose', ON_CHOOSE],
    ]))};`,
    appendLine('approvalCard'),
  );
}
