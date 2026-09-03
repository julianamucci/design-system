/**
 * Transforms do painel Code do estado da ligação.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
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
import {
  attrsMultilinha,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type ConnectionStateArgs = {
  /** Em que pé está a ligação. */
  state?: string;
  /** A contagem, já escrita. Vazia quando nenhuma tentativa está marcada. */
  countdown?: string;
  /** O estado desenhado oferece ação? Só então o aviso tem para onde ir. */
  action?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { ConnectionState } from '@/components/ui/connection-state';";

const IMPORT_STATES = [
  IMPORT,
  "import { CONNECTION_STATES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT,
  "import { AgentStatus } from '@/components/ui/agent-status';",
].join('\n');

/**
 * O que o exemplo DECLARA, e não só o que ele importa.
 *
 * `:labels="rotulos"` e `@retry="religar"` nomeiam coisas de quem consome, e
 * nenhum exemplo as declarava: quem copiasse recebia um `labels` indefinido e
 * um ouvinte que não existe. O que RECONECTAR significa continua sendo decisão
 * de fora — a linha só avisa que alguém pediu.
 */
const ROTULOS = [
  'const rotulos = {',
  "  state: { connected: 'Ligado', reconnecting: 'Reconectando', disconnected: 'Sem ligação' },",
  "  action: { reconnecting: 'Tentar agora', disconnected: 'Reconectar' },",
  '};',
].join('\n');

const RELIGAR = [
  'function religar() {',
  '  // Reconectar é de quem consome: a linha só avisa que alguém pediu.',
  '  abrirLigacao();',
  '}',
].join('\n');

/** Os rótulos da LINHA DE EXECUÇÃO, a irmã autônoma de um dos exemplos. */
const ROTULOS_DA_EXECUCAO = [
  'const rotulosDaExecucao = {',
  "  status: { idle: 'Em espera', running: 'Respondendo', stopped: 'Interrompida', complete: 'Concluída', failed: 'Falhou' },",
  "  action: { running: 'Parar', stopped: 'Retomar', failed: 'Tentar de novo' },",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS, '', RELIGAR].join('\n');
const SETUP_SEM_ACAO = [IMPORT, '', ROTULOS].join('\n');
const SETUP_STATES = [IMPORT_STATES, '', ROTULOS, '', RELIGAR].join('\n');
const SETUP_BESIDE = [IMPORT_BESIDE, '', ROTULOS, '', ROTULOS_DA_EXECUCAO, '', RELIGAR].join('\n');

/**
 * A tag da linha, só com o que o exemplo precisa dizer.
 *
 * O aviso sai por EVENTO nesta stack, e por isso ele está aqui como `@retry`:
 * quem consome o escuta e decide o que reconectar significa. Estado sem rótulo
 * de ação não desenha botão, então ali o ouvinte não teria como disparar —
 * mostrá-lo ensinaria a ligar um fio solto.
 */
function connectionTag(opts: ConnectionStateArgs): string {
  const attributes = attrsMultilinha([
    `state="${text(opts.state, 'reconnecting')}"`,
    opts.countdown ? `countdown="${text(opts.countdown)}"` : undefined,
    ':labels="rotulos"',
    opts.action === false ? undefined : '@retry="religar"',
  ]);
  return `<ConnectionState${attributes} />`;
}

function build(opts: ConnectionStateArgs): string {
  return vueSnippet(opts.action === false ? SETUP_SEM_ACAO : SETUP, connectionTag(opts));
}

/** Transform do `meta` — o Playground, que escreve estado e contagem por extenso. */
export const connectionStateSource: SourceTransform<ConnectionStateArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({ state: args.state, countdown: args.countdown, action: args.action });
};

/**
 * Os três estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `CONNECTION_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function connectionStateEveryStateSource(): string {
  return vueSnippet(
    SETUP_STATES,
    [
      '<ConnectionState',
      '  v-for="state in CONNECTION_STATES"',
      '  :key="state"',
      '  :state="state"',
      '  :labels="rotulos"',
      '  @retry="religar"',
      '/>',
    ].join('\n'),
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
 * Por isso o snippet monta as duas como irmãs, e não passa uma para dentro da
 * outra.
 */
export function connectionStateBesideRunSource(): string {
  const body = [
    connectionTag({ state: 'reconnecting', countdown: 'em 5 s' }),
    '<AgentStatus status="stopped" :labels="rotulosDaExecucao" />',
  ].join('\n');

  return vueSnippet(
    SETUP_BESIDE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="sm">\n${indentar(body)}\n</div>`,
  );
}
