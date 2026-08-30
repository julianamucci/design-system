<script lang="ts" module>
  // ─── ChatThread ────────────────────────────────────────────────────────────
  //
  // A superfície da conversa. Estrutura e cores em `nds/chat-thread.css`, que
  // também guarda as três decisões de acessibilidade que valem mais que o
  // desenho.
  //
  // O conteúdo de cada mensagem é delegado ao Markdown — que não interpreta
  // HTML, o que importa aqui mais do que em qualquer outro lugar: num chat o
  // texto vem de um modelo.
  //
  // A decisão de rolagem vem de `@shared/primitives/chat-scroll`, compartilhada
  // pelas cinco stacks: sem ela, cada uma escreveria o próprio `if` e a
  // divergência só apareceria com a conversa em movimento.
  //
  // A API DIVERGE do primitivo de referência, e é assim que tem de ser. Lá a
  // raiz expõe `append` e `update(id, patch)`; aqui a LISTA é a API — quem faz
  // streaming troca o array. O `id` continua sendo o que sustenta a mesma
  // promessa: ele entra como CHAVE do bloco `{#each}`, e é a chave que faz o
  // compilador remendar a mensagem que cresce em vez de remontá-la. Remontar
  // tiraria o foco de dentro dela e fecharia um colapsável aberto, que é
  // exatamente o que o caminho cirúrgico do primitivo de referência evita à
  // mão.
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { WithElementRef } from '@/lib/utils.js';

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

  /**
   * A chamada de ferramenta, com o espaço de interface desta stack.
   *
   * A forma dos DADOS é compartilhada; o que fica aqui é o que não pode ser —
   * o tipo do espaço que quem consome preenche. No protocolo ele não cabe,
   * porque lá não há framework, e é essa ausência que faz o módulo servir às
   * cinco.
   */
  export interface ChatToolCall extends ChatToolCallData {
    /**
     * Controles de autorização, quando a chamada espera por uma pessoa.
     *
     * É um ESPAÇO, e não uma política: o componente desenha o que recebe e não
     * decide o que aprovar significa.
     */
    approval?: Snippet;
  }

  export interface ChatMessage {
    /** Endereço da mensagem. É ele que entra como chave do `{#each}`. */
    id?: string;
    role: ChatRole;
    /** O conteúdo, em Markdown. Tratado como não confiável. */
    content: string;
    author?: string;
    /** Já formatada por quem consome: o componente não escolhe formato de hora. */
    time?: string;
    avatar?: Snippet;
    /** Ligue enquanto o texto ainda chega. Desligar é o que dispara o anúncio. */
    streaming?: boolean;
    toolCalls?: ChatToolCall[];
    reasoning?: string;
    sources?: ChatSource[];
    /** Ações do turno. Aparecem no hover E no foco. */
    actions?: Snippet;
  }

  /** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
  export interface ChatThreadLabels {
    /** Nome acessível do botão de ir ao fim. `{count}` vira o número. */
    jumpToEnd: string;
    reasoning: string;
    sources: string;
    toolState: Record<ToolCallState, string>;
  }

  export type ChatThreadProps = WithElementRef<
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    HTMLDivElement
  > & {
    messages: ChatMessage[];
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
  };
</script>

<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { cn } from '@/lib/utils.js';
  import ChatMessageItem from './chat-message.svelte';
  import {
    BOTTOM_THRESHOLD,
    initialThreadScroll,
    onJumpToEnd,
    onThreadMessage,
    onThreadScroll,
    shouldFollow,
    type ThreadScrollState,
  } from '@shared/primitives/chat-scroll';

  let {
    ref = $bindable(null),
    messages,
    labels,
    error,
    size,
    class: className,
    ...restProps
  }: ChatThreadProps = $props();

  let viewportEl = $state<HTMLDivElement | null>(null);
  let listEl = $state<HTMLOListElement | null>(null);

  // `$state.raw` porque o estado é SUBSTITUÍDO, nunca remendado: quem decide é
  // a máquina pura, que devolve o mesmo objeto quando nada mudou. Um estado
  // profundo transformaria essa igualdade em detalhe de proxy.
  let scroll = $state.raw<ThreadScrollState>(initialThreadScroll);
  let announcement = $state('');

  const jumpLabel = $derived(labels.jumpToEnd.replace('{count}', String(scroll.unread)));

  function measure() {
    const el = viewportEl;
    return el
      ? { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
      : null;
  }

  function toEnd(): void {
    if (viewportEl) viewportEl.scrollTop = viewportEl.scrollHeight;
  }

  function handleScroll(): void {
    const metrics = measure();
    if (metrics) scroll = onThreadScroll(scroll, metrics, BOTTOM_THRESHOLD);
  }

  function goToEnd(): void {
    toEnd();
    scroll = onJumpToEnd();
  }

  /**
   * Manter o fim colado enquanto se está nele.
   *
   * Resolve dois casos com a mesma regra: o primeiro layout é um crescimento de
   * zero para a altura real — é o que faz a conversa ABRIR no fim, e não no
   * turno mais antigo com o botão já visível — e imagem ou fonte que chega
   * depois é o outro. Só age quando o estado diz que se está no fim: quem rolou
   * para trás não é arrastado.
   *
   * O `scroll` lido dentro do observador é leitura FORA do contexto reativo do
   * efeito — o retorno de chamada roda depois —, então o efeito não se
   * reinscreve a cada rolagem.
   */
  $effect(() => {
    const el = listEl;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (scroll.atBottom) toEnd();
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  /**
   * A chegada de mensagem, contada UMA a uma.
   *
   * `$effect.pre` porque a leitura tem de acontecer ANTES de o conteúdo
   * crescer: é o contrato explícito de `chat-scroll` — medir, inserir, e só
   * então rolar se o estado disser para seguir. Depois que a mensagem entra, o
   * `scrollHeight` já mudou e a mesma conta responderia "não está no fim" para
   * quem estava.
   *
   * O rolar sai num `tick()` justamente por isso: aqui a marcação ainda é a de
   * antes, e rolar agora levaria ao fim ANTIGO.
   */
  // O `untrack` diz o que a leitura é: a contagem de PARTIDA, e não um vínculo.
  // Sem ele o compilador avisa que só o valor inicial está sendo capturado — e
  // é exatamente isso que se quer aqui.
  let previousCount = untrack(() => messages.length);
  $effect.pre(() => {
    const count = messages.length;
    untrack(() => {
      const before = previousCount;
      previousCount = count;
      if (count <= before) return;

      const follow = shouldFollow(scroll);
      let next = scroll;
      for (let i = before; i < count; i++) next = onThreadMessage(next);
      scroll = next;

      if (follow) void tick().then(toEnd);
    });
  });

  /**
   * O anúncio é da TRANSIÇÃO: a mensagem estava chegando e parou de chegar.
   *
   * Anunciar a cada trecho tornaria a leitura impossível, e anunciar na chegada
   * não anunciaria nada — a mensagem nasce vazia.
   *
   * A cópia dos campos é o que faz o efeito DEPENDER deles: quem faz streaming
   * pode trocar o array inteiro ou remendar a mensagem no lugar, e o anúncio
   * não pode depender de qual dos dois.
   */
  type Announced = { id?: string; role: ChatRole; content: string; streaming?: boolean };
  let previousAnnounced: Announced[] = untrack(() =>
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      streaming: m.streaming,
    })),
  );
  $effect(() => {
    const snapshot: Announced[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      streaming: m.streaming,
    }));
    untrack(() => {
      const before = previousAnnounced;
      previousAnnounced = snapshot;
      for (const message of snapshot) {
        if (message.role !== 'assistant') continue;
        const same = before.find((m) => m.id != null && m.id === message.id);
        if (same?.streaming && !message.streaming) announcement = message.content;
        // Mensagem que já chega pronta também é anunciada, uma vez.
        if (!same && !message.streaming && before.length < snapshot.length) {
          announcement = message.content;
        }
      }
    });
  });
</script>

<div
  bind:this={ref}
  data-slot="chat-thread"
  class={cn('nds-chat-thread', className)}
  data-size={size}
  {...restProps}
>
  <!--
    Região rolável alcançável por teclado (WCAG 2.1.1). Fixo, e não prop:
    torná-lo configurável só criaria o jeito de desligar a única coisa que faz a
    rolagem existir para quem não usa mouse.

    E NÃO é região viva: nada de `role="log"` aqui, que traria `aria-live`
    embutido e anunciaria cada trecho do texto que ainda chega.
  -->
  <div
    bind:this={viewportEl}
    class="nds-chat-thread-viewport"
    tabindex="0"
    onscroll={handleScroll}
  >
    <ol bind:this={listEl} class="nds-chat-thread-list">
      <!--
        A chave é o id: é ela que faz a mensagem que cresce ser remendada, e não
        remontada. Remontar tiraria o foco de dentro dela e fecharia um
        colapsável que a pessoa tivesse aberto.
      -->
      {#each messages as message, i (message.id ?? i)}
        <ChatMessageItem {message} {labels} />
      {/each}
    </ol>
  </div>

  <!--
    `role="alert"` — e isto NÃO contradiz a regra de que a conversa não é região
    viva. Aquela é sobre texto em streaming, que chega em cem pedaços; isto é
    uma frase curta e definitiva. Fica FORA da lista porque não é um turno da
    conversa: ninguém disse isso.
  -->
  <p class="nds-chat-thread-error" data-slot="chat-thread-error" role="alert" hidden={!error}>
    {error ?? ''}
  </p>

  <!-- Some do percurso do Tab quando não há para onde ir. -->
  <button
    type="button"
    class="nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm"
    data-slot="chat-thread-jump"
    hidden={scroll.atBottom}
    aria-label={jumpLabel}
    onclick={goToEnd}
  >
    {jumpLabel}
  </button>

  <!-- A ÚNICA região viva de texto da thread. -->
  <div class="nds-chat-thread-announcer" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>
