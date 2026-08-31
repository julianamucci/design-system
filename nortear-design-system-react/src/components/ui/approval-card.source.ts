/**
 * Snippet do painel Code do cartão de autorização — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a pergunta por extenso, e é de propósito:
 * lá os controls a mudam, e um snippet que mostrasse só o nome de uma constante
 * mentiria sobre o que a story renderiza. Nas demais o assunto é a FORMA do
 * cartão, e o que varia é qual argumento chega — por isso o alcance e os
 * controles aparecem como nome de variável, que é como quem consome os escreve.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ApprovalCard } from "@/components/ui/approval-card";';

const ON_CHOOSE = 'onChoose={(choice) => answer(choice)}';
const CHOICES = 'actions={choices}';
const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

export type ApprovalCardSnippetOptions = {
  /** A pergunta, por extenso. */
  question?: string;
  /** O nome do alcance. Ausente desenha o cartão sem lista. */
  scope?: string;
  /** Os controles chegam? Ausente não desenha a caixa da resposta. */
  actions?: boolean;
};

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeOf(name: string): string {
  return `scope={${name}Scope}`;
}

function build(opts: ApprovalCardSnippetOptions): string {
  const question = text(opts.question) ?? DEFAULT_QUESTION;

  return jsxSnippet(
    IMPORT,
    `<ApprovalCard${attrsMultilinha([
      `question="${question}"`,
      opts.scope,
      opts.actions === false ? undefined : CHOICES,
      // Sem controle nenhum não há o que escolher, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      opts.actions === false ? undefined : ON_CHOOSE,
    ])} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve a pergunta por extenso. */
export const approvalCardSource: SourceTransform<{ question: string; scope: string }> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  const scope = text(args.scope);
  return build({
    question: args.question,
    scope: scope && scope !== 'none' ? scopeOf(scope) : undefined,
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
 * dos controles é uma lista de nós que chega pronta.
 */
export function approvalCardManyChoicesSource(): string {
  return build({ scope: scopeOf('spend') });
}

/**
 * Sem controle nenhum.
 *
 * A caixa da resposta não é desenhada, e o retorno some junto — não há o que
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
  return jsxSnippet(
    [
      IMPORT,
      'import { ToolGroup } from "@/components/ui/tool-group";',
      'import { splitWaitingCalls } from "@shared/primitives/tool-group-summary";',
      '',
      'const { grouped, waiting } = splitWaitingCalls(calls);',
    ].join('\n'),
    [
      '<div className="nds-stack" data-spacing="sm">',
      '  {/* À vista, e antes do que já aconteceu: pedir autorização dentro de',
      '      uma caixa fechada é pedir sem mostrar. */}',
      '  {waiting.map((item) => (',
      '    <ApprovalCard',
      '      key={item.name}',
      '      question="Permitir que o agente conceda o acesso?"',
      '      scope={scopeOfWaiting(item)}',
      `      ${CHOICES}`,
      `      ${ON_CHOOSE}`,
      '    />',
      '  ))}',
      '  <ToolGroup calls={grouped} labels={groupLabels} />',
      '</div>',
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
  return jsxSnippet(
    [
      IMPORT,
      'import { Button } from "@/components/ui/button";',
      '',
      '// Só o controle que traz o atributo conta como resposta.',
      'const allowOnce = (',
      '  <Button variant="outline" size="sm" data-approval-choice="allow-once">',
      '    Permitir uma vez',
      '  </Button>',
      ');',
      '',
      '// Este não traz, e por isso não dispara nada.',
      'const learnMore = (',
      '  <Button variant="ghost" size="sm">Saiba mais</Button>',
      ');',
    ].join('\n'),
    [
      '<ApprovalCard',
      `  question="${DEFAULT_QUESTION}"`,
      `  ${scopeOf('publish')}`,
      '  actions={[allowOnce, learnMore]}',
      `  ${ON_CHOOSE}`,
      '/>',
    ].join('\n'),
  );
}
