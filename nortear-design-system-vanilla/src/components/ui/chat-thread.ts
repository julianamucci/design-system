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

export type ChatRole = 'user' | 'assistant' | 'system';
export type ToolCallState = 'running' | 'done' | 'failed';

export interface ChatToolCall {
  name: string;
  state: ToolCallState;
  /** Detalhe da chamada — argumentos, resultado, erro. Texto simples. */
  detail?: string;
}

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessageOptions {
  role: ChatRole;
  /** O conteúdo, em Markdown. Tratado como não confiável. */
  content: string;
  author?: string;
  /** Já formatada por quem consome: o componente não escolhe formato de hora. */
  time?: string;
  avatar?: HTMLElement;
  /** Ligue enquanto o texto ainda chega. */
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
  /** Vai ao fim e zera a contagem, como o botão faz. */
  jumpToEnd: () => void;
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
    const link = document.createElement('a');
    link.className = 'nds-chat-source';
    link.href = source.url;
    link.rel = 'noreferrer';

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

  for (const call of options.toolCalls ?? []) {
    const disclosure = createDisclosure(
      'tool-call',
      `${call.name} · ${labels.toolState[call.state]}`,
      call.detail ?? '',
    );
    // O estado vai no atributo E no texto do resumo: cor sozinha não descreve
    // estado para quem não a percebe.
    disclosure.dataset.state = call.state;
    body.appendChild(disclosure);
  }

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
  for (const message of options.messages) {
    list.appendChild(createChatMessage(message, options.labels));
  }
  viewport.appendChild(list);

  const jump = document.createElement('button');
  jump.type = 'button';
  jump.className = 'nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm';
  jump.dataset.slot = 'chat-thread-jump';
  // Nasce escondido: a conversa abre no fim, e um botão que oferece ir para
  // onde já se está é ruído no percurso do Tab.
  jump.hidden = true;

  // A ÚNICA região viva da thread.
  const announcer = document.createElement('div');
  announcer.className = 'nds-chat-thread-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');

  root.append(viewport, jump, announcer);

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

  root.append = ((message: ChatMessageOptions) => {
    // A ORDEM importa, e é o contrato que a função pura não pode impor sozinha:
    // decidir ANTES de inserir. Depois que a mensagem entra, o `scrollHeight`
    // já mudou e a mesma conta responderia "não está no fim" para quem estava.
    const seguir = shouldFollow(state);
    state = onThreadMessage(state);

    list.appendChild(createChatMessage(message, options.labels));

    if (seguir) viewport.scrollTop = viewport.scrollHeight;
    paintJump();

    // Anúncio único, ao terminar. Mensagem que ainda está chegando não é
    // anunciada: o `aria-busy` dela é que diz que há algo em curso.
    if (!message.streaming && message.role === 'assistant') {
      announcer.textContent = message.content;
    }
  }) as ChatThreadElement['append'];

  root.jumpToEnd = goToEnd;

  paintJump();
  return root;
}
