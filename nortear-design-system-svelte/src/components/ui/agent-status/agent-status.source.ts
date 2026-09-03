/**
 * Transforms do painel Code do estado da execução.
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
 * O Playground é o único que escreve estado e relógio por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de uma constante mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type AgentStatusSnippetOptions = {
  /** Em que pé está a execução. */
  status?: string;
  /** O relógio, já escrito. Vazio quando não há o que contar. */
  elapsed?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: AgentStatusSnippetOptions };

const IMPORT = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_FIELD = "import { Composer } from '@/components/ui/composer';";
const IMPORT_STATUSES =
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

const ON_ACTION = "onAction={(intent) => (intent === 'stop' ? stop() : start())}";

/**
 * As declarações do exemplo, escritas por extenso.
 *
 * NOME LIGADO É NOME DECLARADO. O bloco do painel é copiado inteiro, e o que
 * mora só no arquivo da story fica para trás — quem colasse receberia `labels`,
 * `stop` e `start` sem nada por baixo.
 */
const DECL_LABELS = 'const labels = { /* os rótulos da linha */ };';
const DECL_ACOES = [
  '// O pedido é só um AVISO: a linha diz o que foi pedido, e quem interrompe',
  '// ou recomeça a execução é quem consome.',
  'function stop() { /* interrompe a execução */ }',
  'function start() { /* recomeça a execução */ }',
].join('\n');

/** O `<script>` do exemplo: os imports e o que a marcação liga. */
function bloco(imports: string[], ...declaracoes: string[]): string {
  return [...imports, '', ...declaracoes].join('\n');
}

/** O uso real: o estado, o relógio, os rótulos, e onde o pedido continua. */
function build(opts: AgentStatusSnippetOptions): string {
  const comAcao = opts.action !== false;
  const attributes = attrsMultilinha([
    `status="${opts.status ?? 'running'}"`,
    opts.elapsed ? `elapsed="${opts.elapsed}"` : false,
    '{labels}',
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    comAcao && ON_ACTION,
  ]);
  const script = comAcao
    ? bloco([IMPORT], DECL_LABELS, '', DECL_ACOES)
    : bloco([IMPORT], DECL_LABELS);
  return svelteSnippet(script, `<AgentStatus${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve estado e relógio por extenso. */
export function agentStatusSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    elapsed: args.elapsed,
    action: args.action,
  });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function agentStatusEveryStateSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="md">',
    '  {#each RUN_STATUSES as status (status)}',
    `    <AgentStatus {status} {labels} ${ON_ACTION} />`,
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(bloco([IMPORT, IMPORT_STATUSES], DECL_LABELS, '', DECL_ACOES), markup);
}

/** A execução em curso: relógio correndo e a ação que interrompe. */
export function agentStatusRunningSource(): string {
  return build({ status: 'running', elapsed: '1:04' });
}

/** A que a pessoa parou: neutra de propósito, e a ação que retoma. */
export function agentStatusStoppedSource(): string {
  return build({ status: 'stopped', elapsed: '0:42' });
}

/** A que quebrou sozinha: a ação passa a pedir para começar de novo. */
export function agentStatusFailedSource(): string {
  return build({ status: 'failed', elapsed: '0:08' });
}

/** A que chegou ao fim: duração final, e nenhuma ação a oferecer. */
export function agentStatusCompleteSource(): string {
  return build({ status: 'complete', elapsed: '2:11', action: false });
}

/**
 * A linha acima do campo de mensagem.
 *
 * Ela é AUTÔNOMA: fica acima do campo e nenhum arquivo do campo sabe que ela
 * existe. Por isso o snippet empilha as duas lado a lado, e não passa uma para
 * dentro da outra.
 */
export function agentStatusAboveFieldSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="sm">',
    '  <AgentStatus',
    '    status="running"',
    '    elapsed="1:04"',
    '    labels={statusLabels}',
    `    ${ON_ACTION}`,
    '  />',
    '  <Composer labels={fieldLabels} />',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_FIELD],
      'const statusLabels = { /* os rótulos da linha */ };',
      'const fieldLabels = { /* os rótulos do campo */ };',
      '',
      DECL_ACOES,
    ),
    markup,
  );
}
