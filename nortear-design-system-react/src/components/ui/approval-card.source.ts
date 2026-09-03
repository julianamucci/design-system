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
 * cartão, e o que varia é qual argumento chega — por isso o alcance aparece
 * como nome de variável, que é como quem consome o escreve.
 *
 * O ALCANCE E OS CONTROLES ENTRAM DECLARADOS, com o nome do ramo. Citar
 * `choices`, `answer` ou `publishScope` sem declará-los deixava quem copiava
 * com símbolo indefinido na primeira renderização — e no caso dos controles
 * era pior: eles são o único pedaço do contrato que atravessa a fronteira, e
 * sem vê-los ninguém descobre `data-approval-choice`.
 */
import { attrsMultilinha, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ApprovalCard } from "@/components/ui/approval-card";';
const BUTTON_IMPORT = 'import { Button } from "@/components/ui/button";';

const ON_CHOOSE = 'onChoose={(choice) => answer(choice)}';
const CHOICES = 'actions={choices}';
const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

/**
 * Os controles da resposta, todos com a MESMA ênfase.
 *
 * Nenhum é destacado, e é decisão: num cartão que pede autorização, dar ênfase
 * visual a "permitir" EMPURRA para permitir — padrão escuro conhecido em
 * diálogo de permissão, e um snippet que o ensinasse o espalharia por todo
 * produto que copiasse o exemplo.
 *
 * `data-approval-choice` é escrito AQUI, por quem monta os controles. É o único
 * pedaço do contrato que atravessa a fronteira do que a peça desenha: controle
 * sem o atributo não é resposta, e não dispara nada.
 */
const CHOICES_BLOCK = [
  'const choices = [',
  '  <Button key="allow-once" variant="outline" size="sm" data-approval-choice="allow-once">',
  '    Permitir uma vez',
  '  </Button>,',
  '  <Button key="always" variant="outline" size="sm" data-approval-choice="always">',
  '    Sempre permitir',
  '  </Button>,',
  '  <Button key="deny" variant="outline" size="sm" data-approval-choice="deny">',
  '    Recusar',
  '  </Button>,',
  '];',
].join('\n');

/**
 * O que se faz com a escolha.
 *
 * Uma linha, e o corpo é de quem consome: aplicar a autorização é do produto, e
 * a peça só relata qual controle foi acionado.
 */
const ANSWER_BLOCK = 'const answer = (choice) => { /* … */ };';

/**
 * O alcance de cada exemplo, em pares de termo e valor.
 *
 * Curto de propósito — dois ou três pares —, porque é isso que um alcance de
 * verdade tem: ele diz o que vai acontecer se a resposta for sim, e uma lista
 * longa deixa de ser lida justamente onde a leitura decide.
 */
const SCOPE_ITEMS: Record<string, string[]> = {
  publish: [
    '  { term: "Ferramenta", detail: "publicar_relatorio" },',
    '  { term: "Alvo", detail: "docs/relatorios/agosto.md" },',
    '  { term: "Efeito", detail: "Cria o arquivo e sobrescreve o que houver com esse nome." },',
  ],
  spend: [
    '  { term: "Ferramenta", detail: "comprar_creditos" },',
    '  { term: "Custo", detail: "R$ 128,00" },',
    '  { term: "Alvo", detail: "Carteira da equipe de conteúdo" },',
  ],
  writeFile: [
    '  { term: "Ferramenta", detail: "gravar_arquivo" },',
    '  // O caminho comprido é o assunto: alcance pela metade é autorização pela',
    '  // metade, e o valor quebra em linhas em vez de receber reticências.',
    '  { term: "Alvo", detail: "docs/relatorios/trimestre/anexos/planilha-de-custos-consolidada.csv" },',
  ],
};

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeOf(name: string): string {
  return `scope={${name}Scope}`;
}

/** A declaração daquele alcance, com o nome que o ramo cita. */
function scopeBlock(name: string): string {
  const items = SCOPE_ITEMS[name] ?? [
    '  { term: "Ferramenta", detail: "publicar_relatorio" },',
    '  { term: "Alvo", detail: "docs/relatorios/agosto.md" },',
  ];
  return [`const ${name}Scope = [`, ...items, '];'].join('\n');
}

export type ApprovalCardSnippetOptions = {
  /** A pergunta, por extenso. */
  question?: string;
  /** O nome do alcance. Ausente desenha o cartão sem lista. */
  scope?: string;
  /** Os controles chegam? Ausente não desenha a caixa da resposta. */
  actions?: boolean;
};

/** O import, os controles e o alcance — só o que aquele ramo cita. */
function preamble(scopeName: string | undefined, withActions: boolean): string {
  const imports = [IMPORT];
  if (withActions) imports.push(BUTTON_IMPORT);

  const parts = [imports.join('\n')];
  if (scopeName !== undefined) parts.push('', scopeBlock(scopeName));
  if (withActions) parts.push('', CHOICES_BLOCK, '', ANSWER_BLOCK);
  return parts.join('\n');
}

/** `scope={publishScope}` -> `publish`, que é a chave da declaração. */
function scopeNameOf(attr: string | undefined): string | undefined {
  const found = attr?.match(/^scope=\{([A-Za-z0-9_$]+)Scope\}$/);
  return found ? found[1] : undefined;
}

function build(opts: ApprovalCardSnippetOptions): string {
  const question = text(opts.question) ?? DEFAULT_QUESTION;
  const withActions = opts.actions !== false;

  return jsxSnippet(
    preamble(scopeNameOf(opts.scope), withActions),
    `<ApprovalCard${attrsMultilinha([
      `question="${question}"`,
      opts.scope,
      withActions ? CHOICES : undefined,
      // Sem controle nenhum não há o que escolher, então o retorno não teria
      // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
      withActions ? ON_CHOOSE : undefined,
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
 *
 * A LISTA DE CHAMADAS ENTRA RESUMIDA a três, e o alcance da que espera é
 * montado por quem consome: a peça receberia um dado do vocabulário de outra
 * peça e passaria a conhecer as duas.
 */
export function approvalCardOutsideTheGroupSource(): string {
  return jsxSnippet(
    [
      IMPORT,
      BUTTON_IMPORT,
      'import { ToolGroup } from "@/components/ui/tool-group";',
      'import { splitWaitingCalls } from "@shared/primitives/tool-group-summary";',
      '',
      '// A execução do exemplo tem seis chamadas — aqui, as três primeiras.',
      'const calls = [',
      '  { id: "t1", name: "ler_relatorio", state: "done", detail: "12 páginas." },',
      '  { id: "t2", name: "montar_grafico", state: "running" },',
      '  { id: "t3", name: "conceder_acesso", state: "pending", detail: "Leitura da pasta da diretoria." },',
      '];',
      '',
      'const { grouped, waiting } = splitWaitingCalls(calls);',
      '',
      '// O alcance da pergunta sai do que a chamada carrega — e quem faz essa',
      '// tradução é quem consome, não o cartão.',
      'const scopeOfWaiting = (call) => [',
      '  { term: "Ferramenta", detail: call.name },',
      '  { term: "Efeito", detail: call.detail },',
      '];',
      '',
      CHOICES_BLOCK,
      '',
      ANSWER_BLOCK,
      '',
      'const groupLabels = {',
      '  title: (count) => (count === 1 ? "1 ferramenta" : `${count} ferramentas`),',
      '  summary: {',
      '    pending: "Espera por você",',
      '    running: "Em curso",',
      '    done: "Concluído",',
      '    failed: "Algo falhou",',
      '  },',
      '  call: {',
      '    pending: "Esperando você",',
      '    running: "Em curso",',
      '    done: "Concluída",',
      '    failed: "Falhou",',
      '  },',
      '};',
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
      BUTTON_IMPORT,
      '',
      scopeBlock('publish'),
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
      '',
      ANSWER_BLOCK,
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
