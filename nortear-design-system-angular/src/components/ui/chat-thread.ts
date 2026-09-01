import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NdsMarkdown } from './markdown';
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
// estática reconhecer a validação onde ela acontece. O template chama
// `isSafeUrl(source.url)` pelo nome, ligado direto ao símbolo importado.
import { isSafeUrl } from '@shared/primitives/markdown-ast';
import { LABELS_CHAT_THREAD_DEFAULT } from '@shared/primitives/chat-thread-labels';

// ─── ChatThread ──────────────────────────────────────────────────────────────
//
// A superfície da conversa. Estrutura e cores em
// docs/shared/styles/nds/chat-thread.css, que também guarda as três decisões de
// acessibilidade que valem mais que o desenho.
//
// O conteúdo de cada mensagem é delegado ao Markdown — que não interpreta HTML,
// o que importa aqui mais do que em qualquer outro lugar: num chat o texto vem
// de um modelo.
//
// A decisão de rolagem vem de @shared/primitives/chat-scroll, compartilhada
// pelas cinco stacks: sem ela, cada uma escreveria o próprio `if` e a
// divergência só apareceria com a conversa em movimento.
//
// A API DIVERGE do Vanilla, e é assim que tem de ser. Lá a raiz expõe `append` e
// `update(id, patch)`; aqui a LISTA é a API — quem faz streaming troca o array,
// normalmente por `signal.update`. Divergência de API de framework se REGISTRA,
// não se "alinha".
//
// O `id` é o que sustenta a mesma promessa dos dois lados: no Vanilla ele
// endereça o remendo cirúrgico; aqui ele é o `track` do `@for`, e é o track que
// faz o Angular remendar a mensagem que cresce em vez de remontá-la. Remontar
// tiraria o foco de dentro dela e fecharia um colapsável que a pessoa tivesse
// aberto — que é exatamente o que este componente promete não fazer.
//
// OS SLOTS SÃO `TemplateRef`, e essa é a outra divergência de instrumento. No
// React `avatar`, `actions` e `approval` são `ReactNode`; aqui são templates
// que quem consome declara com `<ng-template>` e o componente instancia por
// `ngTemplateOutlet`. Montar DOM à mão perderia detecção de mudança e os inputs
// dos componentes projetados — é a mesma escolha que os containers de seção da
// documentação já fazem para os previews.

/**
 * O vocabulário vem de `chat-protocol.ts`, e não daqui.
 *
 * Era a mesma união escrita nas cinco stacks. Importa E reexporta porque
 * `export … from` não traz o nome ao escopo, e este arquivo usa os três; o
 * nome público da stack não muda. O motivo de `pending` existir separado de
 * `running` — um espera por uma PESSOA, o outro pela máquina — está escrito
 * lá, uma vez, junto com o critério que decide se um estado novo existe.
 */
import type {
  ChatRole,
  ChatSource,
  ToolCallState,
  ChatToolCall as ChatToolCallData,
} from '@shared/primitives/chat-protocol';

export type { ChatRole, ChatSource, ToolCallState };

/** Altura da janela da conversa, na escada do sistema. */
export type ChatThreadSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * A chamada de ferramenta, com o espaço de interface desta stack.
 *
 * A forma dos DADOS é compartilhada; o que fica aqui é o que não pode ser — o
 * tipo do espaço que quem consome preenche. No protocolo ele não cabe, porque
 * lá não há framework, e é essa ausência que faz o módulo servir às cinco.
 */
export interface ChatToolCall extends ChatToolCallData {
  /**
   * Controles de autorização, quando a chamada espera por uma pessoa.
   *
   * É um ESPAÇO, e não uma política: o componente desenha o que recebe e não
   * decide o que aprovar significa. Ver a nota sobre aprovação no cabeçalho do
   * `chat-thread.css`.
   */
  approval?: TemplateRef<unknown>;
}

export interface ChatMessage {
  /**
   * Endereço da mensagem. É ele que entra como `track`.
   *
   * Opcional porque uma conversa parada não precisa dele. Obrigatório na
   * prática para quem faz streaming: sem endereço, o Angular não tem como saber
   * que a mensagem que cresceu é a mesma de antes.
   */
  id?: string;
  role: ChatRole;
  /** O conteúdo, em Markdown. Tratado como não confiável. */
  content: string;
  author?: string;
  /** Já formatada por quem consome: o componente não escolhe formato de hora. */
  time?: string;
  avatar?: TemplateRef<unknown>;
  /** Ligue enquanto o texto ainda chega. Desligar é o que dispara o anúncio. */
  streaming?: boolean;
  toolCalls?: ChatToolCall[];
  reasoning?: string;
  sources?: ChatSource[];
  /** Ações do turno. Aparecem no hover E no foco. */
  actions?: TemplateRef<unknown>;
}

/** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
export interface ChatThreadLabels {
  /** Nome acessível do botão de ir ao fim. `{count}` vira o número. */
  jumpToEnd: string;
  reasoning: string;
  sources: string;
  toolState: Record<ToolCallState, string>;
}

@Component({
  selector: 'nds-chat-thread',
  standalone: true,
  imports: [NgTemplateOutlet, NdsMarkdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-chat-thread',
    '[attr.data-slot]': '"chat-thread"',
    '[attr.data-size]': 'size() ?? null',
  },
  template: `
    <!-- Região rolável alcançável por teclado (WCAG 2.1.1) E NOMEADA, que é a
         outra metade da regra 6 da §8: o foco sozinho fazia uma parada de
         teclado que o leitor de tela não sabia anunciar. Papel e nome andam
         juntos — \`aria-label\` em elemento sem papel é atributo proibido, e o
         axe acusa \`aria-prohibited-attr\`.

         \`role="group"\` e não \`region\`: \`region\` com nome vira marco de página, e
         a docs page mostra várias conversas — seriam vários marcos homônimos,
         que é o que torna a lista de regiões do leitor inútil.

         E não \`log\` nem \`feed\`, que é a tentação óbvia numa conversa: os dois
         trazem semântica viva embutida e passariam a anunciar CADA trecho que
         chega durante o streaming. Quem anuncia aqui é
         \`.nds-chat-thread-announcer\`, uma vez, quando a resposta termina.
         \`group\` nomeia sem falar e sem tocar na semântica de lista do \`<ol>\`
         que mora dentro. -->
    <div
      #viewport
      class="nds-chat-thread-viewport"
      tabindex="0"
      role="group"
      [attr.aria-label]="regionLabel()"
      (scroll)="onScroll()"
    >
      <ol #list class="nds-chat-thread-list">
        <!-- O track é o \`id\`: é ele que faz a mensagem que cresce ser REMENDADA,
             e não remontada. Remontar tiraria o foco de dentro dela e fecharia
             um colapsável aberto. -->
        @for (message of messages(); track message.id ?? $index) {
          <li
            class="nds-chat-message"
            data-slot="chat-message"
            [attr.data-role]="message.role"
            [attr.data-message-id]="message.id ?? null"
            [attr.aria-busy]="message.streaming ? 'true' : null"
          >
            @if (message.avatar; as avatar) {
              <div class="nds-chat-message-avatar">
                <ng-container *ngTemplateOutlet="avatar" />
              </div>
            }

            <div class="nds-chat-message-body">
              @if (message.author || message.time) {
                <div class="nds-chat-message-header">
                  @if (message.author) {
                    <span class="nds-chat-message-author">{{ message.author }}</span>
                  }
                  @if (message.time) {
                    <time>{{ message.time }}</time>
                  }
                </div>
              }

              <!-- O raciocínio vem ANTES da resposta, fechado: é o caminho, e
                   quem lê quer o destino primeiro.

                   \`<details>\` nativo: o conteúdo continua encontrável pela busca
                   do navegador com a caixa fechada, e uma thread com dezenas
                   deles não paga JavaScript por mensagem. -->
              @if (message.reasoning) {
                <details class="nds-chat-reasoning">
                  <summary class="nds-chat-reasoning-summary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      class="nds-icon nds-chat-reasoning-icon"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                    <span>{{ labels().reasoning }}</span>
                  </summary>
                  <div class="nds-chat-reasoning-body">{{ message.reasoning }}</div>
                </details>
              }

              <!-- As chamadas ficam num contêiner próprio: é ele que as separa
                   umas das outras, e some quando não há nenhuma. -->
              <div class="nds-chat-message-tools">
                @for (call of message.toolCalls ?? []; track call.id ?? $index) {
                  <details
                    class="nds-chat-tool-call"
                    [attr.data-state]="call.state"
                    [attr.data-call-id]="call.id ?? null"
                    [open]="call.state === 'pending'"
                  >
                    <summary class="nds-chat-tool-call-summary">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        class="nds-icon nds-chat-tool-call-icon"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <!-- O estado vai no atributo E no texto do resumo: cor
                           sozinha não descreve estado para quem não a percebe. -->
                      <span>{{ call.name }} · {{ labels().toolState[call.state] }}</span>
                    </summary>
                    <div class="nds-chat-tool-call-body">
                      {{ call.detail }}
                      <!-- O espaço da autorização. Quem desenha os controles é
                           quem consome. -->
                      @if (call.approval; as approval) {
                        <div class="nds-chat-tool-call-approval">
                          <ng-container *ngTemplateOutlet="approval" />
                        </div>
                      }
                    </div>
                  </details>
                }
              </div>

              <div class="nds-chat-message-content">
                <nds-markdown [content]="message.content" [streaming]="!!message.streaming" />
              </div>

              @if (message.sources?.length) {
                <div>
                  <p class="nds-chat-message-header">{{ labels().sources }}</p>
                  <!-- \`<ol>\`: a numeração é do CONTEÚDO — é por ela que o texto
                       se refere à fonte —, então vem da lista, e não de um
                       \`::before\` decorativo. -->
                  <ol class="nds-chat-sources">
                    @for (source of message.sources; track $index) {
                      <li>
                        <!-- A fonte vem de quem gerou a resposta, e endereço
                             vindo dali é ENTRADA, não constante: \`javascript:\`
                             num \`href\` executa. Sem protocolo seguro a fonte
                             continua legível e deixa de ser clicável — a mesma
                             decisão do Markdown, que descarta o endereço e
                             preserva o texto. -->
                        @if (isSafeUrl(source.url)) {
                          <a class="nds-chat-source" [attr.href]="source.url" rel="noreferrer"
                            ><span class="nds-chat-source-index">{{ $index + 1 }}</span
                            >{{ source.title }}</a
                          >
                        } @else {
                          <span class="nds-chat-source" data-unsafe=""
                            ><span class="nds-chat-source-index">{{ $index + 1 }}</span
                            >{{ source.title }}</span
                          >
                        }
                      </li>
                    }
                  </ol>
                </div>
              }

              @if (message.actions; as actions) {
                <div class="nds-chat-message-actions">
                  <ng-container *ngTemplateOutlet="actions" />
                </div>
              }
            </div>
          </li>
        }
      </ol>
    </div>

    <!-- \`role="alert"\` — e isto NÃO contradiz a regra de que a conversa não é
         região viva. Aquela é sobre texto em streaming, que chega em cem
         pedaços; isto é uma frase curta e definitiva. Fica FORA da lista porque
         não é um turno: ninguém disse isso. -->
    <p
      class="nds-chat-thread-error"
      data-slot="chat-thread-error"
      role="alert"
      [hidden]="!error()"
    >{{ error() }}</p>

    <!-- Some do percurso do Tab quando não há para onde ir. -->
    <button
      type="button"
      class="nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm"
      data-slot="chat-thread-jump"
      [hidden]="scroll().atBottom"
      [attr.aria-label]="jumpLabel()"
      (click)="jumpToEnd()"
    >{{ jumpLabel() }}</button>

    <!-- A ÚNICA região viva de texto da thread. -->
    <div
      class="nds-chat-thread-announcer"
      aria-live="polite"
      aria-atomic="true"
    >{{ announcement() }}</div>
  `,
})
export class NdsChatThread implements AfterViewInit, OnDestroy {
  /** As mensagens, em ordem. Trocar o array é como o streaming pousa aqui. */
  readonly messages = input.required<ChatMessage[]>();
  /** O texto da interface. Sem padrão em inglês escondido. */
  readonly labels = input.required<ChatThreadLabels>();
  /**
   * Falha da EXECUÇÃO, e não de uma ferramenta.
   *
   * São coisas diferentes e a distinção importa: ferramenta que falhou é um
   * passo que deu errado dentro de uma resposta que continua de pé; erro de
   * execução é a resposta que não vai vir. Um mora na mensagem, o outro na
   * conversa.
   */
  readonly error = input<string | undefined>(undefined);
  /**
   * Altura da janela da conversa, na escada do sistema.
   *
   * Sem ela não há transbordo, e sem transbordo a ancoragem no fim não
   * acontece. Quem precisar de uma altura fora da escada declara `--box-height`
   * na raiz.
   */
  readonly size = input<ChatThreadSize | undefined>(undefined);
  /**
   * Nome acessível da área que rola, que entra na ordem de tabulação.
   *
   * Tem padrão porque o design system sabe o que a região é — uma conversa — e
   * porque quem compõe não pensa em nomear um elemento que não se vê. Dê nomes
   * DISTINTOS quando houver mais de uma conversa na mesma tela.
   */
  readonly regionLabel = input<string>(LABELS_CHAT_THREAD_DEFAULT.region);

  /**
   * A validação de endereço, no ponto em que ele encosta no DOM.
   *
   * O campo é o próprio símbolo importado, não um invólucro: um invólucro local
   * esconderia o sanitizador da análise estática, que é o que ela precisa achar.
   */
  protected readonly isSafeUrl = isSafeUrl;

  private readonly viewportRef = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly listRef = viewChild.required<ElementRef<HTMLElement>>('list');

  protected readonly scroll = signal<ThreadScrollState>(initialThreadScroll);
  protected readonly announcement = signal('');

  protected readonly jumpLabel = computed(() =>
    this.labels().jumpToEnd.replace('{count}', String(this.scroll().unread)),
  );

  /** A lista de antes, para saber quantas chegaram. `null` na primeira volta. */
  private previous: ChatMessage[] | null = null;
  /** A lista de antes do anúncio — separada, porque as duas leituras diferem. */
  private announced: ChatMessage[] | null = null;
  private observer: ResizeObserver | undefined;

  constructor() {
    /**
     * A chegada de mensagem, contada UMA a uma.
     *
     * O estado consultado é o do signal, que ainda descreve a rolagem de ANTES
     * de o conteúdo crescer: o evento de rolagem do conteúdo novo ainda não
     * ocorreu. É o mesmo contrato do Vanilla, com outro instrumento — medir
     * antes, agir depois.
     *
     * `untracked` porque o corpo LÊ e ESCREVE `scroll`: sem ele o efeito se
     * reagendaria a cada rolagem, para comparar duas listas de mesmo tamanho.
     */
    effect(() => {
      const current = this.messages();
      const before = this.previous;
      this.previous = current;
      if (before === null || current.length <= before.length) return;

      untracked(() => {
        const follow = shouldFollow(this.scroll());
        let next = this.scroll();
        for (let i = before.length; i < current.length; i++) next = onThreadMessage(next);
        if (next !== this.scroll()) this.scroll.set(next);
        if (follow) this.pinToEnd();
      });
    });

    /**
     * O anúncio é da TRANSIÇÃO: a mensagem estava chegando e parou de chegar.
     *
     * Anunciar a cada trecho tornaria a leitura impossível, e anunciar na
     * chegada não anunciaria nada — a mensagem em streaming nasce vazia.
     */
    effect(() => {
      const current = this.messages();
      const before = this.announced;
      this.announced = current;
      if (before === null) return;

      untracked(() => {
        for (const message of current) {
          if (message.role !== 'assistant') continue;
          const twin =
            message.id === undefined ? undefined : before.find((m) => m.id === message.id);
          if (twin?.streaming && !message.streaming) this.announcement.set(message.content);
          // Mensagem que já chega pronta também é anunciada, uma vez.
          if (!twin && !message.streaming && before.length < current.length) {
            this.announcement.set(message.content);
          }
        }
      });
    });
  }

  /**
   * Manter o fim colado enquanto se está nele.
   *
   * Resolve dois casos com a mesma regra: o primeiro layout é um crescimento de
   * zero para a altura real — é o que faz a conversa ABRIR no fim, e não no
   * turno mais antigo com o botão já visível — e imagem, fonte ou trecho que
   * chega depois é outro. Só age quando o estado diz que se está no fim: quem
   * rolou para trás não é arrastado.
   *
   * Aqui ele vale por dois: o `effect` do Angular não promete rodar DEPOIS do
   * refresh da vista, então quem garante que a rolagem alcança a altura nova é
   * o observador, que só é chamado quando a altura já mudou.
   */
  ngAfterViewInit(): void {
    this.observer = new ResizeObserver(() => this.pinToEnd());
    this.observer.observe(this.listRef().nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected onScroll(): void {
    const el = this.viewportRef().nativeElement;
    const next = onThreadScroll(
      this.scroll(),
      {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      },
      BOTTOM_THRESHOLD,
    );
    if (next !== this.scroll()) this.scroll.set(next);
  }

  /** Vai ao fim e zera a contagem, como o botão faz. */
  protected jumpToEnd(): void {
    const el = this.viewportRef().nativeElement;
    el.scrollTop = el.scrollHeight;
    this.scroll.set(onJumpToEnd());
  }

  private pinToEnd(): void {
    if (!this.scroll().atBottom) return;
    const el = this.viewportRef().nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
