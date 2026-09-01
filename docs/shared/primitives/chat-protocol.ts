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

// ─── Plano ────────────────────────────────────────────────────────────────────

/**
 * Estado de um passo do plano.
 *
 * Quatro deles coincidem com `ToolCallState`, e ainda assim são tipo próprio: um
 * passo de plano não é uma chamada de ferramenta, e juntar os dois faria a lista
 * de estados de um crescer toda vez que o outro precisasse de um estado novo.
 *
 * `skipped` é o quinto, e é o que justifica o tipo existir. Um passo que o
 * agente decidiu não fazer não é `done` nem `failed`: não aconteceu, e continua
 * na lista com o motivo. Sumir com ele reescreveria o plano depois do fato, e
 * quem lê perderia a informação de que havia outro caminho.
 */
export type PlanStepState = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

/** Na ordem em que o passo anda. `skipped` sai de `pending`, como `done`. */
export const PLAN_STEP_STATES: readonly PlanStepState[] = [
  'pending',
  'running',
  'done',
  'failed',
  'skipped',
] as const;

/**
 * Um passo do que o agente pretende fazer, ou já fez.
 *
 * O MESMO TIPO SERVE À LISTA DE TAREFAS do catálogo. Plano e lista de tarefas
 * têm o mesmo desenho, os mesmos estados e o mesmo vocabulário — o que muda é
 * quando a lista aparece e quem a propôs, e isso é política de produto, não
 * forma. Dois componentes aqui seriam duas páginas para uma coisa só.
 */
export interface PlanStep {
  /** Endereço do passo, para atualizar o certo quando dois têm o mesmo texto. */
  id?: string;
  label: string;
  state: PlanStepState;
  /** Por que pulou, o que produziu, o que falhou — o que couber ao estado. */
  detail?: string;
}

/**
 * O passo acabou, de qualquer maneira?
 *
 * `skipped` conta: não vai acontecer mais. É a mesma leitura de `isRunFinished`,
 * onde `stopped` é fim ainda que sem resposta.
 */
export function isStepFinished(state: PlanStepState): boolean {
  return state === 'done' || state === 'failed' || state === 'skipped';
}

// ─── Ligação com o serviço ────────────────────────────────────────────────────

/**
 * Estado da ligação com o serviço que responde.
 *
 * NÃO É `RunStatus`, e a distinção é a razão de este tipo existir. Aquele
 * descreve a EXECUÇÃO — o que o agente está fazendo com o que se pediu. Este
 * descreve o TRANSPORTE — se ainda há por onde pedir. Uma execução concluída
 * sobre uma ligação caída é um par perfeitamente possível, e dois tipos que se
 * confundissem não conseguiriam escrevê-lo.
 *
 * Três estados, e é o que o critério deixa passar. Eles são a combinação
 * completa de duas perguntas: a ligação está de pé, e há alguma tentativa em
 * curso? De pé é `connected`; caída com alguém tentando é `reconnecting`;
 * caída sem ninguém tentando é `disconnected`. A quarta combinação — de pé e
 * tentando — não descreve nada.
 *
 * `connecting` NÃO É UM QUARTO ESTADO, e é a decisão mais fácil de errar aqui.
 * A primeira tentativa desenha exatamente como a quinta: ponto de atenção,
 * palavra, contagem para a próxima e a ação que apressa. Ter sido a primeira é
 * conhecimento de quem consome, e a palavra que ele quiser usar sai dos
 * rótulos, que são dele. Estado que não muda o desenho não é estado.
 */
export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

/**
 * Do melhor para o pior. Mesma razão de `RUN_STATUSES`: quem itera estados —
 * tabela da docs page, story de estados, mapa de rótulos — lê uma lista só.
 */
export const CONNECTION_STATES: readonly ConnectionState[] = [
  'connected',
  'reconnecting',
  'disconnected',
] as const;

/**
 * Há uma próxima tentativa marcada?
 *
 * Só `reconnecting`. É o que decide se a contagem para a próxima tentativa tem
 * o que contar: desenhar "em 5 s" ao lado de "Sem ligação" é mostrar um relógio
 * que não corre, e quem lê fica esperando por algo que ninguém agendou.
 *
 * Mora aqui, e não em cinco `if`, pelo mesmo motivo de `waitsForPerson`: é uma
 * regra de duas frases que renderia cinco implementações, e a que discordasse
 * seria justamente a de `disconnected`, onde a resposta é menos óbvia.
 */
export function isRetryScheduled(state: ConnectionState): boolean {
  return state === 'reconnecting';
}

// ─── Trabalho longo ───────────────────────────────────────────────────────────

/**
 * O quanto um trabalho longo já andou.
 *
 * NÃO É UM ESTADO, e por isso não há tipo de estado novo aqui: o trabalho longo
 * — indexar um repositório, processar um lote — nasce, corre, é interrompido,
 * termina ou quebra, que é exatamente `RunStatus`, e cada um dos cinco já
 * desenha diferente naquela linha pelos mesmos motivos. O que o trabalho longo
 * acrescenta ao estado da execução é a CONTA, e conta não é estado.
 *
 * `total` É OPCIONAL, e é a razão de este tipo existir em vez de dois números
 * soltos. Trabalho que não sabe de quantos é caso REAL — quem varre um
 * repositório sabe quantos arquivos abriu, e não quantos vai abrir — e ele
 * precisa desenhar diferente de "acabou de começar", que é a leitura de zero.
 * Guardar `total: 0` para dizer "não sei" é o mesmo defeito que `TokenUsage`
 * evita ao deixar `limit` de fora: ausência tem de se distinguir de zero, e um
 * número não distingue as duas.
 */
export interface JobCount {
  /** Quantas unidades já foram feitas. */
  done: number;
  /** De quantas, quando se sabe. Ausente é "não se sabe", nunca zero. */
  total?: number;
}

/**
 * Sabe-se de quantas?
 *
 * `undefined` e zero respondem a mesma coisa, e o zero é o que faz esta função
 * valer mais que um `!== undefined` escrito em cinco lugares: dividir por zero
 * devolve fração inválida, e o componente que a arredondasse desenharia trilha
 * vazia — "acabou de começar" — para um trabalho que não tem o que fazer.
 */
export function hasKnownTotal(count: JobCount): boolean {
  return count.total !== undefined && count.total > 0;
}

/**
 * O quanto a barra mostra, em porcentagem, ou `null` para "andando sem
 * estimativa".
 *
 * Mora aqui, e não em cinco `if`, pelo mesmo motivo de `isRetryScheduled`: são
 * três decisões de uma frase cada, e a que discordaria entre stacks é
 * justamente a terceira.
 *
 * 1. CONCLUÍDO É CHEIO, e a conta não entra. Um trabalho que terminou está
 *    inteiro feito ainda que ninguém tenha contado as unidades, e uma barra
 *    pela metade ao lado da palavra "Concluído" é a peça discordando de si.
 * 2. SEM TOTAL CONHECIDO, ANDANDO É INDETERMINADO. `null` é o que a barra do
 *    design system já entende por "em andamento, sem estimativa" — ela troca a
 *    fração por um traço que percorre o trilho e deixa de escrever
 *    `aria-valuenow`, porque zero mentiria. É a armadilha que este tipo existe
 *    para fechar: vazio não pode parecer começo.
 * 3. SEM TOTAL CONHECIDO E PARADO, A TRILHA FICA VAZIA. Aqui o traço correndo
 *    diria que ainda anda, que é pior que não dizer nada — e a palavra do
 *    estado ao lado ("Em espera", "Interrompido", "Falhou") já impede a leitura
 *    de "acabou de começar", que era o risco de zero.
 *
 * O ARREDONDAMENTO É PARA BAIXO, e isso é decisão e não gosto: com
 * arredondamento ao mais próximo, 4 999 de 5 000 vira cem por cento, e a barra
 * enche ANTES de o trabalho acabar. Barra cheia ao lado de "Em andamento" é a
 * mesma discordância da decisão 1, invertida.
 */
export function jobProgressValue(status: RunStatus, count?: JobCount): number | null {
  if (status === 'complete') return 100;
  if (count && hasKnownTotal(count)) {
    const fracao = Math.min(Math.max(count.done, 0) / count.total!, 1);
    return Math.floor(fracao * 100);
  }
  return status === 'running' ? null : 0;
}

// ─── Sessão de computador ─────────────────────────────────────────────────────

/**
 * Um passo de uma sessão em que o agente dirige uma tela.
 *
 * É O PRIMEIRO TIPO DESTE ARQUIVO QUE CARREGA GEOMETRIA, e vale dizer por quê
 * ele mora aqui mesmo assim. Um ponto na tela não é conversa — `x` e `y` não
 * têm par em nada que este vocabulário já descreva —, mas o critério deste
 * arquivo nunca foi "é conversa": é ser a origem única do que mais de uma stack
 * vai reescrever. `PlanStep` e `JobCount` são igualmente de uma peça só, e
 * estão aqui pelo mesmo motivo. Cinco stacks escrevendo o próprio ponto é como
 * se produz cinco geometrias que discordam, e geometria que discorda não
 * aparece em teste: aparece como marca fora de lugar numa foto.
 *
 * `action` e `target` RIMAM com `name` e `detail` de `ChatToolCall`, e ainda
 * assim o tipo é próprio: uma chamada de ferramenta tem estado e esta não tem
 * nenhum — o que está acontecendo na sessão é `RunStatus`, e vale para a
 * sessão inteira, não por passo. Um passo que carregasse estado faria a peça
 * desenhar cinco marcas diferentes sobre a tela, que é justamente a codificação
 * que a legenda existe para não precisar.
 *
 * O PONTO É PORCENTAGEM DO QUADRO, e não pixel. O quadro é fluido — a mesma
 * sessão é desenhada em três larguras —, e um ponto em pixel apontaria para
 * lugares diferentes em cada uma. Fora de 0–100 não é erro de tipo, e quem
 * desenha decide o que fazer com isso.
 */
export interface ComputerStep {
  /** Endereço do passo, para atualizar o certo quando dois têm o mesmo verbo. */
  id?: string;
  /** O que o agente fez, no verbo com que ele nomeou a ação. */
  action: string;
  /** Sobre o que ele agiu, como ele o descreveu. */
  target: string;
  /** Distância da borda de início, em porcentagem da largura do quadro. */
  x: number;
  /** Distância do topo, em porcentagem da altura do quadro. */
  y: number;
}

// ─── Grafo de dependência ─────────────────────────────────────────────────────

/**
 * Um nó de um grafo de trabalho: o que se faz, onde ele fica e em que pé está.
 *
 * É O SEGUNDO TIPO DESTE ARQUIVO QUE CARREGA GEOMETRIA, e entra pelo mesmo
 * critério com que `ComputerStep` entrou: o critério nunca foi "é conversa", é
 * ser a origem única do que mais de uma stack vai reescrever. Cinco stacks
 * escrevendo o próprio par de coordenadas é como se produz cinco geometrias que
 * discordam, e geometria que discorda não aparece em teste — aparece como nó
 * fora de lugar numa foto.
 *
 * A COORDENADA É DE QUEM MONTA, e não da peça. Quem desenha o grafo não calcula
 * disposição: calcular traria algoritmo de layout para dentro do design system,
 * e algoritmo de layout envelhece por produto. `column` e `row` são a casa da
 * grade em que o nó cai, e a peça só as lê.
 *
 * A BASE DA CONTAGEM NÃO IMPORTA, e é decisão. As coordenadas são RELATIVAS
 * entre si: quem desenha desloca o grafo inteiro para que a menor coluna e a
 * menor linha caiam na origem. Zero, um ou negativo descrevem o mesmo grafo, e
 * exigir uma base seria exigir que quem monta soubesse de uma convenção que não
 * muda nada do que ele vê.
 *
 * O ESTADO É `ToolCallState` INTEIRO. A fonte do catálogo achata em três —
 * feito, em curso e por fazer —, e o que se perde ali é `failed`: um nó de
 * trabalho que quebrou desenharia igual a um que terminou. É o mesmo movimento
 * que a família 2 já fez sete vezes.
 */
export interface FlowNode {
  /** Endereço do nó. É por ele que as arestas o encontram, e é obrigatório. */
  id: string;
  /** O que este passo é, como uma pessoa o chamaria. */
  label: string;
  /** A casa da grade na horizontal. Relativa às demais. */
  column: number;
  /** A casa da grade na vertical. Relativa às demais. */
  row: number;
  state: ToolCallState;
}

/**
 * Uma dependência entre dois nós: o de onde a seta sai e o para onde ela chega.
 *
 * É A PRIMEIRA RELAÇÃO DESTE VOCABULÁRIO, e é o que ele não sabia dizer.
 * `PlanStep` é fila ordenada, e ordem não é dependência: uma fila não se
 * ramifica nem se reencontra. Um par de endereços diz "este depende daquele" —
 * uma relação entre dois itens, e não mais um campo dentro de um item.
 *
 * NÃO CARREGA ESTADO. O estado mora nos nós, e uma aresta com estado próprio
 * poderia discordar das duas pontas — dizer que o caminho falhou entre dois nós
 * concluídos. Duas verdades sobre a mesma coisa é como elas divergem.
 */
export interface FlowEdge {
  /** Endereço do nó de que se depende. */
  from: string;
  /** Endereço do nó que depende. */
  to: string;
}

// ─── Intervalo num eixo de tempo ──────────────────────────────────────────────

/**
 * Um trecho de uma execução: o que ele é, QUANDO ele começou e quanto durou.
 *
 * É O TERCEIRO TIPO DESTE ARQUIVO QUE CARREGA GEOMETRIA, e entra pelo critério
 * que os dois primeiros fixaram: o critério nunca foi "é conversa", é ser a
 * ORIGEM ÚNICA do que mais de uma stack vai reescrever. Cinco stacks escrevendo
 * o próprio par começo/duração é como se produz cinco geometrias que discordam,
 * e geometria que discorda não aparece em teste — aparece como barra fora de
 * lugar numa foto.
 *
 * O INTERVALO É PLANO, e não um `TimeSpan` aninhado. A forma foi decidida com a
 * peça na mão, e o que decidiu foi o precedente deste arquivo mais a falta de um
 * segundo consumidor: `ComputerStep` carrega `x` e `y` soltos, `FlowNode` carrega
 * `column` e `row` soltos, e nenhum dos dois embrulha a geometria num tipo
 * próprio. Um `TimeSpan` seria o primeiro objeto de geometria aninhado do
 * vocabulário, custaria um nível a mais em toda chamada, e a única peça que sabe
 * dizer QUANDO dentro de quê é esta — a medição do tempo de uma resposta, na
 * família 5, é um par termo/valor sem eixo nenhum, e não tem começo para guardar.
 * Tipo que embrulha dois campos para um consumidor só não é vocabulário: é
 * indireção.
 *
 * O TOTAL NÃO MORA AQUI, e essa é a outra metade da mesma decisão. O total é
 * propriedade do EIXO, não do trecho: é ele que faz as barras dividirem uma
 * régua só, e é ele que continua sendo o total verdadeiro quando quem monta
 * mostra apenas os últimos trechos — sem isso as barras restantes reescalariam e
 * perderiam a posição real. Um total por trecho seriam N verdades sobre a mesma
 * régua, que é exatamente o que `FlowEdge` recusa ao não carregar estado próprio.
 *
 * A BASE DA CONTAGEM DO RECUO NÃO IMPORTA, como no grafo: `depth` é RELATIVO
 * entre os trechos, e quem desenha encosta o menor no zero.
 *
 * O ESTADO É `ToolCallState` INTEIRO. A fonte do catálogo achata em três — em
 * curso, concluído e falhou — e o que falta lá é `pending`: o trecho que ainda
 * não começou, que num eixo de tempo é justamente o que se quer ver.
 */
export interface TraceSpan {
  /** Endereço do trecho, para atualizar o certo quando dois têm o mesmo rótulo. */
  id: string;
  /** O que este trecho é, como uma pessoa o chamaria. */
  label: string;
  /** Quando ele começou, em milissegundos desde a origem do eixo. */
  startMs: number;
  /** Quanto ele durou, em milissegundos. */
  durationMs: number;
  /** O recuo do trecho, em degraus. Relativo aos demais. */
  depth: number;
  state: ToolCallState;
}

// ─── Atividade por dia ────────────────────────────────────────────────────────

/**
 * Quanta coisa aconteceu num dia.
 *
 * NÃO CARREGA GEOMETRIA, e é a diferença em relação aos três tipos acima: a casa
 * de calendário em que este dia cai não está aqui, porque ela não é declarada —
 * ela se DEDUZ da data e da janela, e essa dedução é a conta que mora em
 * `activity-calendar.ts`. Quem monta declara o que mediu; a grade é consequência.
 *
 * Entra neste arquivo pelo critério de sempre: ser a origem única do que mais de
 * uma stack vai reescrever. `PlanStep` e `JobCount` são igualmente de uma peça
 * só e estão aqui pelo mesmo motivo.
 *
 * A DATA É UM DIA CIVIL, e não um instante. Ano-mês-dia em quatro-dois-dois
 * (`2026-03-04`), sem hora e sem fuso — porque a pergunta que um mapa de
 * calendário responde é "o que aconteceu naquele dia", e um carimbo de instante
 * arrastaria fuso para dentro de uma peça que só desenha casas. Guardar o
 * instante e converter em dia é decisão de produto, e produto envelhece por
 * produto.
 *
 * NÃO CARREGA ESTADO, e não é achatamento: um dia não está em curso nem falhou.
 * O que ele tem é uma contagem, e o NÍVEL — a força da tinta na casa — não mora
 * aqui porque não é dado: é uma classificação da contagem contra uma escala que
 * quem monta declara. Guardá-lo aqui deixaria duas verdades sobre a mesma casa,
 * livres para discordar.
 */
export interface ActivityDay {
  /** O dia, em ano-mês-dia: `2026-03-04`. */
  date: string;
  /** Quanta coisa aconteceu nele. Dias repetidos SOMAM, ver `activity-calendar.ts`. */
  count: number;
}
