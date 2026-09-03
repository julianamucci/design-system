/**
 * Transforms do painel Code do cartão de autorização.
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
 * O Playground é o único que escreve a pergunta por extenso, e é de propósito:
 * lá os controls a mudam, e um snippet que mostrasse só o nome de uma constante
 * mentiria sobre o que a story renderiza. Nas demais o assunto é a FORMA do
 * cartão, e o que varia é qual argumento chega — por isso o alcance aparece
 * como nome de variável, que é como quem consome o escreve.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ApprovalCardSnippetOptions = {
  /** A pergunta, por extenso. */
  question?: string;
  /** O nome do exemplo do alcance. Ausente desenha o cartão sem lista. */
  scope?: string;
  /** O cartão recebe controles? Só então o aviso tem para onde ir. */
  actions?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: { question?: string; scope?: string } };

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ApprovalCard } from '@/components/ui/approval-card';";

const IMPORT_WITH_BUTTON = [
  IMPORT,
  "import { Button } from '@/components/ui/button';",
].join('\n');

const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

// O aviso chega por prop de retorno nesta stack: quem consome o escuta e decide
// o que a escolha significa.
const ON_CHOOSE = 'onChoose={(choice) => answer(choice)}';

/** Indenta cada linha não vazia com dois espaços. */
function indent(block: string): string {
  return block
    .split('\n')
    .map((current) => (current.trim() ? `  ${current}` : current))
    .join('\n');
}

/**
 * Os controles, um por escolha, no espaço que a peça abre.
 *
 * Todos com a MESMA ênfase, e é decisão: dar destaque visual a "permitir" num
 * cartão de autorização empurra para aprovar, que é padrão escuro conhecido em
 * diálogo de permissão. O valor que declara o controle como resposta é escrito
 * AQUI, por quem monta — é o único pedaço do contrato que atravessa a fronteira
 * do que a peça desenha.
 */
/**
 * As escolhas, declaradas por quem monta.
 *
 * Elas entram no `<script>` do exemplo porque o bloco acima as ITERA, e um laço
 * sobre nome que o exemplo não declara é um laço que não resolve na mão de quem
 * copia. O conteúdo continua sendo do produto: o que "sempre permitir" abrange
 * e o que recusar significa não estão aqui e não vão estar.
 */
const CHOICES_DECL = [
  'const choices = [',
  '  { value: "allow-once", label: "Permitir uma vez" },',
  '  { value: "always", label: "Sempre permitir" },',
  '  { value: "deny", label: "Recusar" },',
  '];',
].join('\n');

const ACTIONS_SNIPPET = [
  '{#snippet actions()}',
  '  {#each choices as choice (choice.value)}',
  '    <Button',
  '      variant="outline"',
  '      size="sm"',
  '      data-approval-choice={choice.value}',
  '    >{choice.label}</Button>',
  '  {/each}',
  '{/snippet}',
].join('\n');

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeOf(name: string): string {
  return `${name}Scope`;
}

/**
 * As declarações do exemplo, pelo mesmo motivo das escolhas acima.
 *
 * NOME LIGADO É NOME DECLARADO, e não só nome ITERADO: o alcance e o retorno da
 * escolha chegavam ao painel sem nada por baixo, e quem copiasse o bloco
 * receberia `publishScope` e `answer` inexistentes.
 */
const DECL_ANSWER = [
  '// A escolha é um AVISO: o cartão diz o que foi escolhido, e o que aquilo',
  '// significa é de quem consome.',
  'function answer(choice) { /* registra a escolha */ }',
].join('\n');

/** O alcance declarado por quem monta, com o nome que a marcação liga. */
function declScope(name: string): string {
  return [
    '// O alcance é do produto: o que a autorização abrange, item a item.',
    `const ${name} = [/* as linhas do alcance */];`,
  ].join('\n');
}

/** A tag do cartão, com ou sem o espaço da resposta preenchido. */
function approvalTag(opts: ApprovalCardSnippetOptions): string {
  const attributes = attrsMultilinha([
    `question="${opts.question ?? DEFAULT_QUESTION}"`,
    opts.scope ? `scope={${opts.scope}}` : false,
    // Sem controle nenhum não há o que escolher, então o aviso não teria como
    // disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    opts.actions !== false && ON_CHOOSE,
  ]);

  if (opts.actions === false) return `<ApprovalCard${attributes} />`;
  return [`<ApprovalCard${attributes}>`, indent(ACTIONS_SNIPPET), '</ApprovalCard>'].join('\n');
}

function build(opts: ApprovalCardSnippetOptions): string {
  const partes =
    opts.actions === false ? [IMPORT] : [IMPORT_WITH_BUTTON, '', CHOICES_DECL, '', DECL_ANSWER];
  if (opts.scope) partes.push('', declScope(opts.scope));
  return svelteSnippet(partes.join('\n'), approvalTag(opts));
}

/** Transform do `meta` — o Playground, que escreve a pergunta por extenso. */
export function approvalCardSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    question: args.question,
    scope: args.scope && args.scope !== 'none' ? scopeOf(args.scope) : undefined,
  });
}

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
 * dos controles é um bloco que chega desenhado.
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
    CHOICES_DECL,
    '',
    DECL_ANSWER,
    '',
    '// As chamadas e os rótulos vêm de quem monta a conversa.',
    'const calls = [/* as chamadas da resposta */];',
    'const groupLabels = { /* os rótulos da caixa */ };',
    '',
    '// O alcance de cada espera sai da própria chamada, e quem o monta é quem',
    '// conhece o que aquela ferramenta faz.',
    'function scopeOfWaiting(call) { /* as linhas do alcance daquela chamada */ }',
    '',
    'const { grouped, waiting } = splitWaitingCalls(calls);',
  ].join('\n');

  const card = [
    '{#each waiting as call (call.id)}',
    '  <ApprovalCard',
    '    question="Permitir que o agente conceda o acesso?"',
    '    scope={scopeOfWaiting(call)}',
    `    ${ON_CHOOSE}`,
    '  >',
    indent(indent(ACTIONS_SNIPPET)),
    '  </ApprovalCard>',
    '{/each}',
  ].join('\n');

  const body = [
    '<!-- À vista, e antes do que já aconteceu: pedir autorização dentro de',
    '     uma caixa fechada é pedir sem mostrar. -->',
    card,
    '<ToolGroup calls={grouped} labels={groupLabels} />',
  ].join('\n');

  return svelteSnippet(
    script,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indent(body)}\n</div>`,
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
  const block = [
    '{#snippet actions()}',
    '  <!-- Só o controle que traz o atributo conta como resposta. -->',
    '  <Button',
    '    variant="outline"',
    '    size="sm"',
    '    data-approval-choice="allow-once"',
    '  >Permitir uma vez</Button>',
    '',
    '  <!-- Este não traz, e por isso não dispara nada. -->',
    '  <Button variant="ghost" size="sm">Saiba mais</Button>',
    '{/snippet}',
  ].join('\n');

  const card = [
    '<ApprovalCard',
    `  question="${DEFAULT_QUESTION}"`,
    `  scope={${scopeOf('publish')}}`,
    `  ${ON_CHOOSE}`,
    '>',
    indent(block),
    '</ApprovalCard>',
  ].join('\n');

  return svelteSnippet(
    [IMPORT_WITH_BUTTON, '', DECL_ANSWER, '', declScope(scopeOf('publish'))].join('\n'),
    card,
  );
}
