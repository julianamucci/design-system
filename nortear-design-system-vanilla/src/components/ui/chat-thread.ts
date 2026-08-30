import { cn } from '@/lib/utils';
import { createMarkdown } from './markdown';
import {
  BOTTOM_THRESHOLD,
  initialThreadScroll,
  onJumpToEnd,
  onThreadMessage,
  onThreadScroll,
  shouldFollow,
  type ThreadScrollState,
} from '@shared/primitives/chat-scroll';
// No call site, e não atrás de um invólucro local: é o que faz a análise
// estática reconhecer a validação onde ela acontece.
import { isSafeUrl } from '@shared/primitives/markdown-ast';

// ─── ChatThread ──────────────────────────────────────────────────────────────
//
// A superfície da conversa. Estrutura e cores em
// docs/shared/styles/nds/chat-thread.css, que também guarda as três decisões de
// acessibilidade que valem mais que o desenho.
//
// O conteúdo de cada mensagem é delegado ao Markdown — que já não interpreta
// HTML, o que importa aqui mais do que em qualquer outro lugar: num chat o
// texto vem de um modelo.
//
// A decisão de rolagem vem de @shared/primitives/chat-scroll, compartilhada
// pelas cinco stacks: sem ela, cada uma escreveria o próprio `if` e a
// divergência só apareceria com a conversa em movimento.
//
// POR QUE EXISTE `id` E `update`
//
// Um protocolo de agente não manda mensagens prontas: manda um começo, uma
// sequência de trechos e um fim, todos endereçados ao MESMO id. Sem endereço,
// cada trecho só poderia virar mensagem nova, e a conversa cresceria uma linha
// por token. `update(id, patch)` é onde o streaming pousa — e é a metade do
// protocolo que dá razão a este componente existir.
//
// A primeira versão daqui só tinha `append`, e com ela o anúncio único era
// INALCANÇÁVEL no fluxo de streaming: a mensagem entrava com `streaming: true`
// e nada podia desligá-lo depois. A regra estava escrita e o caminho até ela,
// não. É o defeito que `update` fecha.

/**
 * O vocabulário vem de `chat-protocol.ts`, e não daqui.
 *
 * Ele NASCEU aqui, e por um tempo isso foi certo: com uma peça só, tipo perto
 * do componente é tipo fácil de achar. Ele já tinha sido copiado uma vez — o
 * `ChatExampleRole` do `chat-examples.ts` repetia esta união palavra por
 * palavra —, e a família conversacional tem mais de oitenta peças pela frente
 * em cinco stacks. Vocabulário duplicado não quebra teste: ele diverge devagar,
 * e o sintoma é duas peças desenhando o mesmo estado de jeitos diferentes.
 *
 * Reexportar, e não redeclarar: o nome público desta stack não muda. O motivo
 * de `pending` existir separado de `running` — um espera por uma PESSOA, o
 * outro pela máquina — está escrito lá, uma vez, junto com o critério que
 * decide se um estado novo merece existir.
 */
import type {
  ChatRole,
  ChatSource,
  ToolCallState,
  ChatToolCall as ChatToolCallData,
} from '@shared/primitives/chat-protocol';
// Importa E reexporta: `export … from` reexporta sem trazer o nome ao escopo,
// e este arquivo usa os três logo abaixo.
export type { ChatRole, ChatSource, ToolCallState };

/**
 * A chamada de ferramenta, com o espaço de interface desta stack.
 *
 * A forma dos DADOS é compartilhada; o que fica aqui é o que não pode ser: o
 * tipo do espaço que quem consome preenche. No protocolo ele não cabe, porque
 * lá não há DOM — e é justamente essa ausência que faz o módulo servir às cinco.
 */
export interface ChatToolCall extends ChatToolCallData {
  /**
   * Controles de autorização, quando a chamada espera por uma pessoa.
   *
   * É um ESPAÇO, e não uma política: o componente desenha o que recebe e não
   * decide o que aprovar significa. Ver a nota sobre aprovação no cabeçalho do
   * `chat-thread.css`.
   */
  approval?: HTMLElement[];
}

export interface ChatMessageOptions {
  /**
   * Endereço da mensagem.
   *
   * Opcional porque uma conversa parada não precisa dele. Obrigatório na
   * prática para quem faz streaming: mensagem sem id não pode ser atualizada,
   * e `update` a ignora.
   */
  id?: string;
  role: ChatRole;
  /** O conteúdo, em Markdown. Tratado como não confiável. */
  content: string;
  author?: string;
  /** Já formatada por quem consome: o componente não escolhe formato de hora. */
  time?: string;
  avatar?: HTMLElement;
  /** Ligue enquanto o texto ainda chega. Desligar é o que dispara o anúncio. */
  streaming?: boolean;
  toolCalls?: ChatToolCall[];
  reasoning?: string;
  sources?: ChatSource[];
  /** Botões de ação. Aparecem no hover E no foco. */
  actions?: HTMLElement[];
}

/** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
export interface ChatThreadLabels {
  /** Nome acessível do botão de ir ao fim. `{count}` vira o número. */
  jumpToEnd: string;
  reasoning: string;
  sources: string;
  toolState: Record<ToolCallState, string>;
}

export interface ChatThreadOptions {
  messages: ChatMessageOptions[];
  labels: ChatThreadLabels;
  /**
   * Falha da EXECUÇÃO, e não de uma ferramenta.
   *
   * São coisas diferentes e a distinção importa: ferramenta que falhou é um
   * passo que deu errado dentro de uma resposta que continua de pé; erro de
   * execução é a resposta que não vai vir. Um mora na mensagem, o outro na
   * conversa.
   */
  error?: string;
  /**
   * Altura da janela da conversa, na escada do sistema.
   *
   * Sem ela não há transbordo, e sem transbordo a ancoragem no fim não
   * acontece. Quem precisar de uma altura fora da escada declara
   * `--box-height` na raiz.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

export type ChatThreadElement = HTMLDivElement & {
  /** Acrescenta uma mensagem e aplica a decisão de rolagem. */
  append: (message: ChatMessageOptions) => void;
  /**
   * Atualiza a mensagem daquele id. Devolve `false` se não houver nenhuma.
   *
   * É por aqui que o streaming pousa: o trecho novo chega como
   * `{ content: acumulado }`, e o fim como `{ streaming: false }`.
   */
  update: (id: string, patch: Partial<ChatMessageOptions>) => boolean;
  /** Vai ao fim e zera a contagem, como o botão faz. */
  jumpToEnd: () => void;
  /** Declara — ou limpa, com `null` — a falha da execução. */
  setError: (text: string | null) => void;
};

/** Ícone de seta que gira com o estado do colapsável. */
function createChevron(className: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', cn('nds-icon', className));
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.appendChild(path);
  return svg;
}

/**
 * Colapsável de chamada de ferramenta ou de raciocínio.
 *
 * `<details>` nativo: o conteúdo continua encontrável pela busca do navegador
 * com a caixa fechada, e uma thread com dezenas deles não paga JavaScript por
 * mensagem.
 */
function createDisclosure(
  kind: 'tool-call' | 'reasoning',
  summaryText: string,
  body: string,
): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = `nds-chat-${kind}`;

  const summary = document.createElement('summary');
  summary.className = `nds-chat-${kind}-summary`;
  summary.appendChild(createChevron(`nds-chat-${kind}-icon`));
  const label = document.createElement('span');
  label.textContent = summaryText;
  summary.appendChild(label);
  details.appendChild(summary);

  const content = document.createElement('div');
  content.className = `nds-chat-${kind}-body`;
  content.textContent = body;
  details.appendChild(content);

  return details;
}

function createToolCall(call: ChatToolCall, labels: ChatThreadLabels): HTMLDetailsElement {
  const disclosure = createDisclosure(
    'tool-call',
    `${call.name} · ${labels.toolState[call.state]}`,
    call.detail ?? '',
  );
  // O estado vai no atributo E no texto do resumo: cor sozinha não descreve
  // estado para quem não a percebe.
  disclosure.dataset.state = call.state;
  if (call.id) disclosure.dataset.callId = call.id;

  // A chamada que espera por uma pessoa nasce ABERTA: pedir autorização dentro
  // de uma caixa fechada é pedir sem mostrar.
  if (call.state === 'pending') disclosure.open = true;

  if (call.approval?.length) {
    const actions = document.createElement('div');
    actions.className = 'nds-chat-tool-call-approval';
    actions.append(...call.approval);
    disclosure.querySelector('.nds-chat-tool-call-body')?.appendChild(actions);
  }

  return disclosure;
}

function createSources(sources: ChatSource[], title: string): HTMLElement {
  const wrapper = document.createElement('div');

  const heading = document.createElement('p');
  heading.className = 'nds-chat-message-header';
  heading.textContent = title;
  wrapper.appendChild(heading);

  // `<ol>`: a numeração é do CONTEÚDO — é por ela que o texto se refere à
  // fonte —, então vem da lista, e não de um `::before` decorativo.
  const list = document.createElement('ol');
  list.className = 'nds-chat-sources';

  sources.forEach((source, i) => {
    const item = document.createElement('li');
    // A fonte vem de quem gerou a resposta, e endereço vindo dali é ENTRADA,
    // não constante: `javascript:` num `href` executa. Sem protocolo seguro a
    // fonte continua legível e deixa de ser clicável — a mesma decisão do
    // Markdown, que descarta o endereço e preserva o texto.
    const seguro = isSafeUrl(source.url);
    const link = document.createElement(seguro ? 'a' : 'span');
    link.className = 'nds-chat-source';
    if (link instanceof HTMLAnchorElement) {
      link.href = source.url;
      link.rel = 'noreferrer';
    } else {
      link.dataset.unsafe = '';
    }

    const index = document.createElement('span');
    index.className = 'nds-chat-source-index';
    index.textContent = String(i + 1);
    link.append(index, document.createTextNode(source.title));

    item.appendChild(link);
    list.appendChild(item);
  });

  wrapper.appendChild(list);
  return wrapper;
}

/** Uma mensagem da conversa. */
export function createChatMessage(
  options: ChatMessageOptions,
  labels: ChatThreadLabels,
): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'nds-chat-message';
  item.dataset.role = options.role;
  item.dataset.slot = 'chat-message';
  if (options.id) item.dataset.messageId = options.id;
  // Ocupada enquanto gera, e NÃO região viva: anunciar a cada trecho tornaria a
  // conversa impossível de ouvir. Quem anuncia o resultado é o anunciador da
  // thread, uma vez, quando a mensagem termina.
  if (options.streaming) item.setAttribute('aria-busy', 'true');

  if (options.avatar) {
    const avatar = document.createElement('div');
    avatar.className = 'nds-chat-message-avatar';
    avatar.appendChild(options.avatar);
    item.appendChild(avatar);
  }

  const body = document.createElement('div');
  body.className = 'nds-chat-message-body';

  if (options.author || options.time) {
    const header = document.createElement('div');
    header.className = 'nds-chat-message-header';
    if (options.author) {
      const author = document.createElement('span');
      author.className = 'nds-chat-message-author';
      author.textContent = options.author;
      header.appendChild(author);
    }
    if (options.time) {
      const time = document.createElement('time');
      time.textContent = options.time;
      header.appendChild(time);
    }
    body.appendChild(header);
  }

  // O raciocínio vem ANTES da resposta, fechado: é o caminho, e quem lê quer o
  // destino primeiro.
  if (options.reasoning) {
    body.appendChild(createDisclosure('reasoning', labels.reasoning, options.reasoning));
  }

  // As chamadas ficam num contêiner próprio para que `update` possa trocá-las
  // sem tocar no resto da mensagem.
  const tools = document.createElement('div');
  tools.className = 'nds-chat-message-tools';
  for (const call of options.toolCalls ?? []) tools.appendChild(createToolCall(call, labels));
  body.appendChild(tools);

  const content = document.createElement('div');
  content.className = 'nds-chat-message-content';
  content.appendChild(
    createMarkdown({ content: options.content, streaming: options.streaming }),
  );
  body.appendChild(content);

  if (options.sources?.length) {
    body.appendChild(createSources(options.sources, labels.sources));
  }

  if (options.actions?.length) {
    const actions = document.createElement('div');
    actions.className = 'nds-chat-message-actions';
    actions.append(...options.actions);
    body.appendChild(actions);
  }

  item.appendChild(body);
  return item;
}

export function createChatThread(options: ChatThreadOptions): ChatThreadElement {
  const root = document.createElement('div') as ChatThreadElement;
  root.dataset.slot = 'chat-thread';
  root.className = cn('nds-chat-thread', options.class);
  if (options.size) root.dataset.size = options.size;

  const viewport = document.createElement('div');
  viewport.className = 'nds-chat-thread-viewport';
  // Região rolável alcançável por teclado (WCAG 2.1.1). Fixo, e não opção:
  // torná-lo configurável só criaria o jeito de desligar a única coisa que faz
  // a rolagem existir para quem não usa mouse.
  viewport.tabIndex = 0;

  const list = document.createElement('ol');
  list.className = 'nds-chat-thread-list';
  viewport.appendChild(list);

  /** As mensagens que declararam id, e o que se sabe delas. */
  const byId = new Map<string, { item: HTMLLIElement; options: ChatMessageOptions }>();

  const mount = (message: ChatMessageOptions) => {
    const item = createChatMessage(message, options.labels);
    list.appendChild(item);
    if (message.id) byId.set(message.id, { item, options: { ...message } });
    return item;
  };

  for (const message of options.messages) mount(message);

  const jump = document.createElement('button');
  jump.type = 'button';
  jump.className = 'nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm';
  jump.dataset.slot = 'chat-thread-jump';
  // Nasce escondido: a conversa abre no fim, e um botão que oferece ir para
  // onde já se está é ruído no percurso do Tab.
  jump.hidden = true;

  /**
   * A falha da execução.
   *
   * `role="alert"` — e isto NÃO contradiz a regra de que a conversa não é
   * região viva. Aquela regra é sobre texto em streaming, que chega em cem
   * pedaços; isto é uma frase curta, definitiva, e que quem não vê a tela
   * precisa saber na hora. Fica FORA da lista porque não é um turno da
   * conversa: ninguém disse isso.
   */
  const error = document.createElement('p');
  error.className = 'nds-chat-thread-error';
  error.dataset.slot = 'chat-thread-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  // A ÚNICA região viva de texto da thread.
  const announcer = document.createElement('div');
  announcer.className = 'nds-chat-thread-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');

  root.append(viewport, error, jump, announcer);

  // ── A decisão de rolagem ──────────────────────────────────────────────────

  let state: ThreadScrollState = initialThreadScroll;

  const paintJump = () => {
    jump.hidden = state.atBottom;
    const label = options.labels.jumpToEnd.replace('{count}', String(state.unread));
    jump.setAttribute('aria-label', label);
    jump.textContent = label;
  };

  const measure = () => ({
    scrollTop: viewport.scrollTop,
    scrollHeight: viewport.scrollHeight,
    clientHeight: viewport.clientHeight,
  });

  viewport.addEventListener('scroll', () => {
    const next = onThreadScroll(state, measure(), BOTTOM_THRESHOLD);
    if (next === state) return;
    state = next;
    paintJump();
  });

  const goToEnd = () => {
    viewport.scrollTop = viewport.scrollHeight;
    state = onJumpToEnd();
    paintJump();
  };

  jump.addEventListener('click', goToEnd);

  /**
   * Manter o fim colado enquanto se está nele.
   *
   * O estado inicial DIZ que a conversa está no fim, e é o que o botão lê —
   * mas até aqui ninguém tinha levado a rolagem lá. A raiz é devolvida solta:
   * no momento em que ela é montada, `scrollHeight` ainda é zero, então rolar
   * na construção não rola nada. O resultado aparecia na tela: a conversa
   * abria no PRIMEIRO turno, o evento de rolagem corrigia o estado para "não
   * está no fim", e o botão de ir ao fim nascia visível oferecendo ir para
   * onde a conversa deveria ter aberto.
   *
   * O observador de tamanho resolve os dois casos com a mesma regra: o
   * primeiro layout é um crescimento de zero para a altura real, e imagem ou
   * fonte que chega depois é outro. Ele só age quando o estado diz que se está
   * no fim — quem rolou para trás não é arrastado.
   */
  const pinAoFim = () => {
    if (state.atBottom) viewport.scrollTop = viewport.scrollHeight;
  };
  new ResizeObserver(pinAoFim).observe(list);

  /** Anúncio único: a resposta pronta, uma vez. */
  const announce = (message: ChatMessageOptions) => {
    if (message.role !== 'assistant') return;
    announcer.textContent = message.content;
  };

  root.append = ((message: ChatMessageOptions) => {
    // A ORDEM importa, e é o contrato que a função pura não pode impor sozinha:
    // decidir ANTES de inserir. Depois que a mensagem entra, o `scrollHeight`
    // já mudou e a mesma conta responderia "não está no fim" para quem estava.
    const seguir = shouldFollow(state);
    state = onThreadMessage(state);

    mount(message);

    if (seguir) viewport.scrollTop = viewport.scrollHeight;
    paintJump();

    // Mensagem que já chega pronta é anunciada aqui; a que chega em pedaços,
    // no `update` que desliga o streaming.
    if (!message.streaming) announce(message);
  }) as ChatThreadElement['append'];

  root.update = ((id: string, patch: Partial<ChatMessageOptions>) => {
    const registro = byId.get(id);
    if (!registro) return false;

    const antes = registro.options;
    const depois = { ...antes, ...patch };
    registro.options = depois;

    // Mesma ordem do `append`: medir antes de o conteúdo crescer.
    const seguir = shouldFollow(state);

    // O caminho do STREAMING é cirúrgico de propósito. Reconstruir a mensagem
    // inteira a cada trecho tiraria o foco de dentro dela e fecharia um
    // colapsável que a pessoa tivesse aberto — ou seja, o conteúdo que chega
    // roubaria o foco, que é exatamente o que este componente promete não
    // fazer.
    const contentOnly = Object.keys(patch).every(
      (k) => k === 'content' || k === 'streaming' || k === 'toolCalls',
    );

    if (contentOnly) {
      if (patch.content !== undefined || patch.streaming !== undefined) {
        const alvo = registro.item.querySelector('.nds-chat-message-content')!;
        alvo.replaceChildren(
          createMarkdown({ content: depois.content, streaming: depois.streaming }),
        );
      }
      if (patch.toolCalls !== undefined) {
        const tools = registro.item.querySelector('.nds-chat-message-tools')!;
        tools.replaceChildren(
          ...(depois.toolCalls ?? []).map((call) => createToolCall(call, options.labels)),
        );
      }
      if (depois.streaming) registro.item.setAttribute('aria-busy', 'true');
      else registro.item.removeAttribute('aria-busy');
    } else {
      // Mudança estrutural — autor, retrato, fontes, ações. Reconstrói, e por
      // isso não é caminho de streaming: use antes ou depois dele.
      const rebuilt = createChatMessage(depois, options.labels);
      registro.item.replaceWith(rebuilt);
      registro.item = rebuilt;
    }

    if (seguir) viewport.scrollTop = viewport.scrollHeight;

    // O anúncio é da TRANSIÇÃO: estava chegando e parou de chegar. Sem isto, a
    // mensagem que nasce em streaming nunca seria anunciada — e era esse o
    // buraco da primeira versão, que só tinha `append`.
    if (antes.streaming && !depois.streaming) announce(depois);

    return true;
  }) as ChatThreadElement['update'];

  root.jumpToEnd = goToEnd;

  root.setError = ((text: string | null) => {
    error.textContent = text ?? '';
    error.hidden = text === null;
  }) as ChatThreadElement['setError'];

  if (options.error !== undefined) root.setError(options.error);

  paintJump();
  return root;
}
