/**
 * O vocabulário da família conversacional.
 *
 * Só tipos, constantes e decisões que cabem em duas frases. Sem framework, sem
 * DOM — é o mesmo contrato de `chat-scroll.ts`, e pelo mesmo motivo: o que é
 * decisão vive uma vez e é testável sem navegador; o que é DOM é de cada stack.
 *
 * POR QUE ISTO EXISTE, e por que antes da segunda peça e não depois:
 *
 * `chat-thread` nasceu com o vocabulário dentro de si, em
 * `nortear-design-system-vanilla/src/components/ui/chat-thread.ts`. Com uma peça
 * só isso não custa nada. Ele já tinha sido duplicado UMA vez — `ChatExampleRole`
 * em `chat-examples.ts` repetia `ChatRole` palavra por palavra — e a família
 * prevista tem mais de oitenta peças que falam de "mensagem", "parte" e "chamada
 * de ferramenta". Cinco stacks vezes oitenta peças é como se produz cinco
 * vocabulários divergentes, e a divergência de vocabulário não aparece em teste:
 * aparece quando duas peças que deviam falar do mesmo estado desenham coisas
 * diferentes.
 *
 * O CRITÉRIO PARA UM ESTADO EXISTIR: ele muda o desenho.
 *
 * `pending` e `running` são separados porque um espera por uma PESSOA e o outro
 * pela MÁQUINA. Na tela parecem o mesmo "ainda não terminou", e são opostos: um
 * pede ação de quem lê, o outro pede paciência. Todo estado novo passa por esse
 * teste antes de entrar aqui.
 *
 * O que NÃO entra: nada que carregue nó de interface. `approval`, `actions` e
 * `avatar` são espaço que quem consome preenche, e o tipo desse espaço é de cada
 * stack (`HTMLElement[]` no vanilla, `ReactNode` no react, `Snippet` no svelte,
 * slot no vue, `TemplateRef` no angular). Cada stack estende o que está aqui com
 * o próprio tipo de espaço; a forma dos DADOS é compartilhada.
 *
 * Vocabulário derivado do catálogo Elements da assistant-ui (MIT) — o que se
 * pega de lá são os conceitos e os estados, nunca o código, que é ligado a um
 * runtime de React. Ver `docs/shared/guidelines/17-componentes-conversacionais.md`.
 */

// ─── Quem fala ────────────────────────────────────────────────────────────────

/** Papel de um turno da conversa. */
export type ChatRole = 'user' | 'assistant' | 'system';

// ─── O que a resposta traz ────────────────────────────────────────────────────

/**
 * O tipo de uma parte da resposta.
 *
 * NENHUMA peça consome isto hoje, e é honesto dizer: o `chat-thread` modela a
 * mensagem como campos paralelos (`content`, `reasoning`, `toolCalls`,
 * `sources`), não como lista de partes. Converter a thread agora seria mudança
 * de contrato sem um segundo consumidor para justificá-la.
 *
 * Está aqui porque a família 4 (resposta estruturada) é feita de partes que não
 * são texto, e o nome delas precisa ser o mesmo desde a primeira. Quando a
 * segunda peça pedir, a união já existe e não nasce divergente.
 */
export type MessagePartKind =
  | 'text'
  | 'tool'
  | 'reasoning'
  | 'source'
  | 'file'
  | 'image'
  | 'chart';

// ─── Ferramenta ───────────────────────────────────────────────────────────────

/** Estado de uma chamada de ferramenta. */
export type ToolCallState = 'pending' | 'running' | 'done' | 'failed';

/**
 * Na ordem em que a chamada anda.
 *
 * Existe para quem itera estados — tabela de estados da docs page, story de
 * variações, mapa de rótulos. Sem uma lista, cada lugar escreve a sua e uma
 * delas esquece `pending`, que é exatamente o estado que ninguém lembra porque
 * é o único que não é da máquina.
 */
export const TOOL_CALL_STATES: readonly ToolCallState[] = [
  'pending',
  'running',
  'done',
  'failed',
] as const;

/**
 * A chamada acabou?
 *
 * `done` e `failed` são terminais: nada mais vai chegar. `pending` e `running`
 * não. É a decisão que separa "mostrar indicador de atividade" de "mostrar
 * resultado", e sem ela cada peça da família 2 escreveria o próprio `if`.
 */
export function isTerminal(state: ToolCallState): boolean {
  return state === 'done' || state === 'failed';
}

/**
 * A chamada espera por uma PESSOA?
 *
 * Só `pending`. É a distinção que justifica o estado existir, e ela decide
 * desenho em mais de uma peça: uma chamada que espera por alguém nasce ABERTA
 * (pedir autorização dentro de uma caixa fechada é pedir sem mostrar) e não
 * mostra indicador de atividade, porque não há atividade nenhuma — há espera.
 */
export function waitsForPerson(state: ToolCallState): boolean {
  return state === 'pending';
}

/** Uma chamada de ferramenta, sem o espaço de interface que cada stack define. */
export interface ChatToolCall {
  /** Endereço da chamada. É por ele que um protocolo atualiza o que já mandou. */
  id?: string;
  /** Nome da ferramenta, como o agente a chamou. */
  name: string;
  state: ToolCallState;
  /** Argumento, resultado ou motivo da falha — o que couber ao estado. */
  detail?: string;
}

// ─── Execução ─────────────────────────────────────────────────────────────────

/**
 * Estado de uma execução do agente.
 *
 * `stopped` é interrupção de quem lê; `failed` é a execução que quebrou sozinha.
 * Os dois terminam sem resposta e desenham diferente: um oferece continuar, o
 * outro oferece tentar de novo. É o mesmo critério do par `pending`/`running`.
 */
export type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';

/** Na ordem em que a execução anda. Mesma razão de `TOOL_CALL_STATES`. */
export const RUN_STATUSES: readonly RunStatus[] = [
  'idle',
  'running',
  'stopped',
  'complete',
  'failed',
] as const;

/** A execução acabou? `stopped` conta: parada por gente também é fim. */
export function isRunFinished(status: RunStatus): boolean {
  return status === 'stopped' || status === 'complete' || status === 'failed';
}

// ─── Em que a resposta se apoia ───────────────────────────────────────────────

/** Uma fonte citável. */
export interface ChatSource {
  title: string;
  url: string;
}

/**
 * Uma citação: a fonte, o trecho em que ela se apoia e onde dentro dela.
 *
 * Separada de `ChatSource` porque a fonte é a MESMA em citações diferentes — a
 * lista de fontes de um turno traz o documento uma vez, e cada citação em linha
 * aponta para um trecho dele. Guardar o trecho dentro da fonte faria a mesma
 * fonte aparecer três vezes na lista.
 */
export interface Citation {
  source: ChatSource;
  /** O texto citado, como saiu da fonte. */
  excerpt?: string;
  /** Onde dentro da fonte — âncora, página, intervalo de linhas. */
  anchor?: string;
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/**
 * Consumo de tokens de uma execução.
 *
 * `total` é FUNÇÃO, e não campo: total guardado pode discordar da soma, e um
 * número que discorda de si mesmo é pior que número nenhum. Quem produz o dado
 * costuma mandar os três; aqui só os dois independentes entram.
 *
 * A aritmética de fração, limiar de aviso e repartição NÃO mora aqui — é o
 * `token-budget.ts`, que três peças de medição compartilham. Este módulo é o
 * vocabulário; aquele é a conta.
 */
export interface TokenUsage {
  input: number;
  output: number;
  /** Teto da janela, quando se sabe. Sem ele não há fração, só contagem. */
  limit?: number;
}

/** A soma, sempre derivada. */
export function totalTokens(usage: TokenUsage): number {
  return usage.input + usage.output;
}

// ─── Anexo ────────────────────────────────────────────────────────────────────

/**
 * Estado de um anexo.
 *
 * `pending` é o arquivo escolhido que ainda não começou a subir — ele já ocupa
 * espaço na tela e ainda não tem barra. Passa no critério: desenha diferente de
 * `uploading`, que tem progresso, e de `ready`, que tem miniatura.
 */
export type AttachmentState = 'pending' | 'uploading' | 'ready' | 'failed';

/** Na ordem em que o anexo anda. */
export const ATTACHMENT_STATES: readonly AttachmentState[] = [
  'pending',
  'uploading',
  'ready',
  'failed',
] as const;

/** Um arquivo anexado à mensagem que ainda está sendo escrita. */
export interface Attachment {
  /** Endereço do anexo, para remover ou atualizar o progresso do certo. */
  id?: string;
  name: string;
  /** Tipo MIME. É ele que decide se cabe miniatura ou só ícone. */
  mediaType?: string;
  /** Bytes. Ausente quando quem produziu o dado não sabe. */
  size?: number;
  /** De 0 a 1. Só faz sentido em `uploading`. */
  progress?: number;
  state: AttachmentState;
}

/** O anexo já pode ser enviado com a mensagem? */
export function isAttachmentReady(attachment: Attachment): boolean {
  return attachment.state === 'ready';
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

/**
 * De onde veio um item de contexto.
 *
 * Passa no critério de "o estado muda o desenho": cada espécie tem ícone
 * próprio, e `selection` é a única que sempre traz `detail` — um trecho sem
 * dizer QUAL trecho não é contexto, é o nome de um arquivo repetido.
 */
export type ContextKind = 'file' | 'directory' | 'selection' | 'page' | 'repository';

/** Na ordem do mais estreito para o mais largo. */
export const CONTEXT_KINDS: readonly ContextKind[] = [
  'selection',
  'file',
  'directory',
  'page',
  'repository',
] as const;

/**
 * Uma coisa que já existe e que vai junto com a pergunta.
 *
 * ANEXO E CONTEXTO NÃO SÃO A MESMA PEÇA, ainda que se pareçam na tela. O anexo
 * é CARGA: um arquivo que sobe, tem bytes, progresso e pode falhar no meio. O
 * contexto é REFERÊNCIA: aponta para algo que já está lá, não sobe nada e não
 * tem como falhar. Por isso `ContextItem` não tem `state` nem `progress` — não
 * há o que esperar.
 */
export interface ContextItem {
  /** Endereço do item, para remover o certo quando dois têm o mesmo nome. */
  id?: string;
  /** O nome curto da etiqueta. Caminho inteiro não cabe e não ajuda. */
  label: string;
  kind: ContextKind;
  /** Onde dentro do item — intervalo de linhas, seção, aba. */
  detail?: string;
  /**
   * O item entrou sem ninguém pedir?
   *
   * Muda o desenho e muda a interação: contexto automático é o arquivo aberto,
   * a página em que se está, e tirá-lo à mão não adianta — ele volta na próxima
   * pergunta. Então ele não ganha botão de remover, e ganha uma marca que diz
   * por que está ali. O que "automático" significa é do produto; o design
   * system só desenha a diferença.
   */
  automatic?: boolean;
}

/** O item pode ser tirado à mão? */
export function isContextRemovable(item: ContextItem): boolean {
  return item.automatic !== true;
}

// ─── Controles do trilho ──────────────────────────────────────────────────────

/**
 * Um modelo que pode responder.
 *
 * `description` é o que o seletor mostra na lista e o gatilho não mostra: um
 * trilho é estreito, e escolher entre "Rápido" e "Profundo" sem saber o que
 * cada um custa é escolher no escuro. O gatilho leva só o nome.
 *
 * `unavailable` vem com MOTIVO obrigatório quando é verdadeiro. Opção apagada
 * sem explicação é a pergunta "por que não posso?" sem resposta na tela — e
 * quem não enxerga o cinza não recebe nem a pista.
 */
export interface ModelOption {
  id: string;
  label: string;
  description?: string;
  /** Etiqueta curta — "Novo", "Beta". Nunca o único portador da informação. */
  badge?: string;
  unavailable?: boolean;
  /** Obrigatório quando `unavailable`. É texto, e é o que se anuncia. */
  unavailableReason?: string;
}

/** A opção pode ser escolhida agora? */
export function isModelSelectable(model: ModelOption): boolean {
  return model.unavailable !== true;
}

/**
 * Estado do ditado por voz.
 *
 * `recording` capta e `transcribing` já parou de captar e ainda processa. São
 * separados porque desenham diferente e porque só o primeiro se interrompe —
 * apertar de novo durante a transcrição não devolve o áudio.
 */
export type VoiceState = 'idle' | 'recording' | 'transcribing';

/** Na ordem em que o ditado anda. */
export const VOICE_STATES: readonly VoiceState[] = [
  'idle',
  'recording',
  'transcribing',
] as const;

/** O ditado está ocupado — captando ou processando? */
export function isVoiceBusy(state: VoiceState): boolean {
  return state !== 'idle';
}

// ─── Fila de envio ────────────────────────────────────────────────────────────

/**
 * Estado de uma mensagem que espera a vez.
 *
 * Passa no critério de "o estado muda o desenho" e, mais que isso, muda o que
 * se PODE fazer: a que espera ainda se retira, a que já está indo não se
 * retira mais. Duas palavras porque a terceira — enviada — sai da fila e vira
 * turno da conversa; guardá-la aqui faria a fila crescer para sempre.
 */
export type QueuedMessageState = 'waiting' | 'sending';

/** Na ordem em que a mensagem anda. */
export const QUEUED_MESSAGE_STATES: readonly QueuedMessageState[] = ['waiting', 'sending'] as const;

/** Uma mensagem escrita enquanto a anterior ainda era respondida. */
export interface QueuedMessage {
  /** Endereço, para retirar a certa quando duas têm o mesmo texto. */
  id?: string;
  text: string;
  state: QueuedMessageState;
}

/**
 * Ainda dá para retirar?
 *
 * Só `waiting`. Oferecer o botão em `sending` é oferecer um desfazer que não
 * desfaz — a mensagem já saiu, e o que acontece depois disso é do produto, não
 * do design system.
 */
export function canWithdraw(message: QueuedMessage): boolean {
  return message.state === 'waiting';
}
