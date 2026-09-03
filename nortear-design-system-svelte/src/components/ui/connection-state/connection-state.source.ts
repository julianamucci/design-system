/**
 * Transforms do painel Code do estado da ligação.
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
 * O Playground é o único que escreve estado e contagem por extenso, e é de
 * propósito: lá os controls mudam os dois, e um snippet que mostrasse só o nome
 * de uma constante mentiria sobre o que a story renderiza. Nas demais o que
 * varia é o estado, e ele continua literal porque é o assunto da story.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ConnectionStateSnippetOptions = {
  /** Em que pé está a ligação. */
  state?: string;
  /** A contagem, já escrita. Vazia quando nenhuma tentativa está marcada. */
  countdown?: string;
  /** O estado desenhado oferece ação? Só então o retorno tem para onde ir. */
  action?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: ConnectionStateSnippetOptions };

const IMPORT = "import { ConnectionState } from '@/components/ui/connection-state';";
const IMPORT_RUN = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_STATES =
  "import { CONNECTION_STATES } from '@shared/primitives/chat-protocol';";

const ON_RETRY = 'onRetry={() => religar()}';

/**
 * As declarações do exemplo, escritas por extenso.
 *
 * NOME LIGADO É NOME DECLARADO. O comentário abaixo já dizia que o retorno é um
 * fio que precisa ter onde chegar; faltava o bloco do painel declarar a ponta.
 */
const DECL_RETRY = 'function religar() { /* tenta a conexão de novo */ }';

/** O `<script>` do exemplo: os imports e o que a marcação liga. */
function bloco(imports: string[], ...declaracoes: string[]): string {
  return [...imports, '', ...declaracoes].join('\n');
}

/** O uso real: o estado, a contagem, os rótulos, e onde o pedido continua. */
function build(opts: ConnectionStateSnippetOptions): string {
  const attributes = attrsMultilinha([
    `state="${opts.state ?? 'reconnecting'}"`,
    opts.countdown ? `countdown="${opts.countdown}"` : false,
    '{labels}',
    // Estado sem rótulo de ação não desenha botão, então o retorno não teria
    // como disparar: mostrá-lo ali ensinaria a ligar um fio solto.
    opts.action !== false && ON_RETRY,
  ]);
  const script = bloco(
    [IMPORT],
    'const labels = { /* os rótulos da conexão */ };',
    ...(opts.action === false ? [] : ['', DECL_RETRY]),
  );
  return svelteSnippet(script, `<ConnectionState${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve estado e contagem por extenso. */
export function connectionStateSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    state: args.state,
    countdown: args.countdown,
    action: args.action,
  });
}

/**
 * Os três estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `CONNECTION_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function connectionStateEveryStateSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="md">',
    '  {#each CONNECTION_STATES as state (state)}',
    `    <ConnectionState {state} {labels} ${ON_RETRY} />`,
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_STATES],
      'const labels = { /* os rótulos da conexão */ };',
      '',
      DECL_RETRY,
    ),
    markup,
  );
}

/** A ligação de pé: nada a contar, e nada a oferecer. */
export function connectionStateConnectedSource(): string {
  return build({ state: 'connected', action: false });
}

/**
 * A que caiu com algo já tentando: a contagem aparece e a ação apressa.
 *
 * A contagem entra no snippet porque este é o único estado em que ela tem o que
 * contar — o vocabulário responde por isso, e não a tela.
 */
export function connectionStateReconnectingSource(): string {
  return build({ state: 'reconnecting', countdown: 'em 5 s' });
}

/**
 * A que caiu sem ninguém tentando.
 *
 * Sem contagem no snippet, e é o assunto: nenhuma tentativa está marcada, então
 * não há tempo a mostrar. Ensinar a passá-la aqui ensinaria a desenhar um
 * relógio que não corre.
 */
export function connectionStateDisconnectedSource(): string {
  return build({ state: 'disconnected' });
}

/**
 * As duas linhas lado a lado.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz se ainda há
 * por onde pedir, a outra diz o que o agente está fazendo com o que se pediu.
 * Por isso o snippet empilha as duas em sequência, e não passa uma para dentro
 * da outra.
 */
export function connectionStateBesideRunSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="sm">',
    '  <ConnectionState',
    '    state="reconnecting"',
    '    countdown="em 5 s"',
    '    labels={rotulos}',
    `    ${ON_RETRY}`,
    '  />',
    '  <AgentStatus status="stopped" labels={rotulosDaExecucao} />',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    bloco(
      [IMPORT, IMPORT_RUN],
      'const rotulos = { /* os rótulos da conexão */ };',
      'const rotulosDaExecucao = { /* os rótulos da linha de estado */ };',
      '',
      DECL_RETRY,
    ),
    markup,
  );
}
