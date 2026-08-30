<script lang="ts" module>
  // ─── Composer ──────────────────────────────────────────────────────────────
  //
  // A superfície de entrada da conversa. Estrutura e cores em
  // `nds/composer.css`, que também guarda as decisões de acessibilidade que
  // valem mais que o desenho.
  //
  // O QUE O COMPONENTE FAZ: recebe o que foi escrito, diz quando alguém pediu
  // para enviar, e troca o botão de enviar por um de interromper enquanto a
  // resposta é gerada.
  //
  // O QUE ELE NÃO FAZ: decidir o que enviar significa. Ele não limpa o campo
  // sozinho, não sabe se a mensagem chegou e não guarda rascunho. Emite o texto
  // e devolve o controle — a mesma divisão de `approval` no `chat-thread`, e
  // pelo mesmo motivo: o que acontece depois do envio é produto, e produto
  // envelhece por outro relógio que o sistema de design.
  //
  // A API DIVERGE do primitivo de referência, e é assim que tem de ser. Lá a
  // raiz expõe `getValue()`, `setValue()` e `setRunning()`; aqui o texto é uma
  // prop VINCULÁVEL e o estado de geração é a prop `running`. Divergência de API
  // de framework não se "alinha": registra-se. A promessa é a mesma dos dois
  // lados — quem sabe se a resposta está vindo é quem consome, e o que muda é só
  // por onde esse estado entra.
  //
  // O trilho também diverge de forma: não é lista de elementos, é um
  // `Snippet` — a forma desta stack para "marcação que quem consome fornece". O
  // conceito não muda: o trilho é um ESPAÇO, e o composer reserva o lugar sem
  // saber o que se põe nele.
  import type { Snippet } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import type { Attachment, ContextItem } from '@shared/primitives/chat-protocol';
  import type { WithElementRef } from '@/lib/utils.js';
  import type { ComposerAttachmentLabels } from './composer-attachments.svelte';
  import type { ComposerContextLabels } from './composer-context.svelte';
  import type { ComposerQuote, ComposerQuoteLabels } from './composer-quote.svelte';
  import type {
    TriggerPopoverLabels,
    TriggerSource,
  } from './composer-trigger-popover.svelte';

  /** Como se pede o envio pelo teclado. */
  export type ComposerSubmitOn =
    /** Enter envia; Shift+Enter quebra linha. Convenção de teclado físico. */
    | 'enter'
    /** Ctrl/Cmd+Enter envia; Enter quebra linha. É o certo no toque. */
    | 'modifier';

  /** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
  export interface ComposerLabels {
    /** Nome acessível do campo. */
    input: string;
    placeholder: string;
    /** Nome do botão em repouso. */
    submit: string;
    /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
    stop: string;
    /** A dica de teclado. `{key}` vira a combinação que envia. */
    hint: string;
    /** Descrição do limite. `{max}` vira o número. */
    limit: string;
  }

  export type ComposerProps = WithElementRef<
    Omit<HTMLFormAttributes, 'children'>,
    HTMLFormElement
  > & {
    /** O texto da interface. Sem padrão em inglês escondido. */
    labels: ComposerLabels;
    /**
     * O texto agora.
     *
     * É vinculável: sem ninguém do lado de fora o componente funciona sozinho, e
     * com o vínculo é por aqui que um rascunho volta. Rascunho é de quem
     * consome — o componente não guarda nada entre sessões.
     */
    value?: string;
    /** Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte. */
    rows?: number;
    /** Limite de caracteres. Sem ele não há contador: contar sem teto não informa nada. */
    maxLength?: number;
    /** Indisponibiliza o conjunto inteiro — campo, trilho e envio. */
    disabled?: boolean;
    submitOn?: ComposerSubmitOn;
    /**
     * A resposta está sendo gerada?
     *
     * É o que troca o botão de enviar pelo de interromper, e o que impede um
     * segundo envio enquanto o primeiro não terminou. Quem sabe é quem consome:
     * o componente não acompanha a rede.
     */
    running?: boolean;
    /**
     * Gatilhos do seletor — menções, comandos, e qualquer outro caractere.
     *
     * Sem eles o campo é só um campo. Com eles, digitar o caractere abre o
     * seletor, e a tecla de envio passa a ESCOLHER enquanto ele estiver aberto.
     */
    triggers?: TriggerSource[];
    /**
     * O texto do seletor.
     *
     * Obrigatório quando há gatilho, porque é texto de tela: sem ele o painel
     * abriria com a frase de nenhum resultado em branco, que é pior que não
     * abrir.
     */
    triggerLabels?: TriggerPopoverLabels;
    /**
     * Os arquivos que vão junto com a mensagem.
     *
     * O composer os DESENHA e avisa quando alguém pede para remover; subir,
     * validar e remover de verdade é de quem consome.
     */
    attachments?: Attachment[];
    /** Textos da fila de anexos. Obrigatórios quando há anexo. */
    attachmentLabels?: ComposerAttachmentLabels;
    /**
     * O que já existe e vai junto com a pergunta.
     *
     * NÃO É A MESMA COISA QUE ANEXO, ainda que se pareçam na moldura. O anexo é
     * carga — sobe, tem progresso, pode falhar. Contexto é referência: aponta
     * para o que já está lá, não sobe nada e não tem o que esperar.
     */
    context?: ContextItem[];
    /** Textos da lista de contexto. Obrigatórios quando há contexto. */
    contextLabels?: ComposerContextLabels;
    /** Alguém pediu para tirar um item do contexto. O componente não tira nada. */
    onRemoveContext?: (item: ContextItem) => void;
    /**
     * A mensagem que está sendo respondida.
     *
     * Ela DESCREVE o campo: entra em `aria-describedby` junto da dica, para
     * quem não vê a tela saber a quem responde antes de escrever.
     */
    quote?: ComposerQuote;
    /** Textos da citação. Obrigatórios quando há citação. */
    quoteLabels?: ComposerQuoteLabels;
    /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
    railStart?: Snippet;
    /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem recebe. */
    onSubmit?: (value: string) => void;
    /** Alguém pediu para interromper o que está sendo gerado. */
    onStop?: () => void;
    /** Alguém pediu para remover um anexo. O componente não remove nada. */
    onRemoveAttachment?: (attachment: Attachment) => void;
    /** Alguém pediu para tirar a citação. Tirar de verdade é de quem consome. */
    onDismissQuote?: (quote: ComposerQuote) => void;
  };
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import {
    applyTrigger,
    findTrigger,
    rankByTerm,
    type TriggerMatch,
  } from '@shared/primitives/composer-trigger';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';
  import ComposerAttachments from './composer-attachments.svelte';
  import ComposerContextList from './composer-context.svelte';
  import ComposerQuoteBlock from './composer-quote.svelte';
  import ComposerTriggerPopover, {
    type TriggerOption,
  } from './composer-trigger-popover.svelte';

  let {
    ref = $bindable(null),
    labels,
    value = $bindable(''),
    rows = 2,
    maxLength,
    disabled = false,
    submitOn = 'enter',
    running = false,
    triggers = [],
    triggerLabels,
    attachments = [],
    attachmentLabels,
    context = [],
    contextLabels,
    quote,
    quoteLabels,
    railStart,
    onSubmit,
    onStop,
    onRemoveAttachment,
    onRemoveContext,
    onDismissQuote,
    class: className,
    ...restProps
  }: ComposerProps = $props();

  /**
   * A fila só existe quando há anexo E texto para ela.
   *
   * Sem anexo ela não fica escondida: ela não existe no documento. Uma lista
   * vazia seria anunciada como "lista com zero itens", que promete algo que não
   * há.
   */
  const hasAttachments = $derived(attachments.length > 0 && attachmentLabels !== undefined);

  /**
   * A lista de contexto só existe quando há item E texto para ela.
   *
   * Mesma regra da fila, e pelo mesmo motivo: sem item ela não fica escondida,
   * ela não existe no documento. Uma lista vazia seria anunciada como "lista
   * com zero itens", que promete algo que não há.
   */
  const hasContext = $derived(context.length > 0 && contextLabels !== undefined);

  /**
   * A citação só existe quando há mensagem citada E texto para ela.
   *
   * Sem rótulo o botão que dispensa nasceria sem nome, e um "×" sem nome é o
   * defeito que a peça existe para não ter.
   */
  const hasQuote = $derived(quote !== undefined && quoteLabels !== undefined);

  // `$props.id()` só é aceito como inicializador de declaração no topo.
  const uid = $props.id();
  const hintId = `${uid}-hint`;
  const popoverId = `${uid}-trigger`;
  const quoteId = `${uid}-quote`;

  /**
   * A dica descreve o campo — `Enter envia` é comportamento, e saber disso
   * depois de apertar a tecla não serve para nada.
   *
   * Com citação, ela vem PRIMEIRO na descrição: saber a quem se responde muda o
   * que se escreve, e a dica de teclado só muda como se envia. A citação aponta
   * o próprio bloco, então o texto dela chega inteiro — inclusive o trecho que
   * a folha corta por linha.
   *
   * O CONTEXTO NÃO ENTRA AQUI, e é decisão, não esquecimento. A citação entra
   * porque saber a quem se responde muda o que se escreve; uma lista de sete
   * arquivos na descrição do campo vira ruído que se ouve a cada foco, e a cada
   * tecla que devolva o anúncio. A lista é navegável, tem nome próprio e a
   * contagem dela é anunciada ao entrar — não precisa ser repetida na descrição.
   */
  const describedBy = $derived(hasQuote ? `${quoteId} ${hintId}` : hintId);

  /**
   * O campo, para o seletor poder ler onde o cursor está.
   *
   * O gatilho depende de ONDE o cursor está, e não do que o texto contém: o
   * vínculo de texto não carrega essa informação, e é por isso que o elemento
   * importa aqui.
   */
  let inputEl = $state<HTMLTextAreaElement | null>(null);

  /** A combinação que envia, para a dica dizer a verdade em cada modo. */
  const submitKey = $derived(submitOn === 'enter' ? 'Enter' : 'Ctrl+Enter');

  const hintText = $derived.by(() => {
    const base = labels.hint.replace('{key}', submitKey);
    if (maxLength === undefined) return base;
    return `${base} · ${labels.limit.replace('{max}', String(maxLength))}`;
  });

  /** Perto do limite muda cor E peso — cor sozinha não descreve estado. */
  const nearLimit = $derived(maxLength !== undefined && value.length >= maxLength * 0.9);

  // Vazio não envia. Enquanto gera, o botão continua vivo — é ele que interrompe.
  const submitDisabled = $derived(disabled || (!running && value.trim() === ''));

  function requestSubmit(): void {
    // Só o texto sem espaços nas pontas sai, e campo com só espaços é vazio.
    const trimmed = value.trim();
    if (!trimmed || running || disabled) return;
    onSubmit?.(trimmed);
  }

  /**
   * O botão do trilho é `type="button"` — o primitivo de botão do design system
   * nasce assim, para nenhum controle dentro de um formulário enviá-lo por
   * acidente. O envio sai daqui, e o `onsubmit` da raiz continua barrando a
   * navegação que um formulário faria sozinho.
   */
  function onButtonClick(): void {
    if (running) onStop?.();
    else requestSubmit();
  }

  // ─── O seletor do caractere gatilho ────────────────────────────────────────
  //
  // Só existe quando há gatilho declarado E texto para o painel dizer. O ESTADO
  // mora aqui, e não no painel: quem lê o campo, filtra e resolve a disputa pela
  // tecla de envio é quem tem o campo. O painel recebe o que mostrar e devolve o
  // que alguém apontou.

  const hasTriggerPopover = $derived(triggers.length > 0 && triggerLabels !== undefined);

  let triggerMatch = $state<TriggerMatch | null>(null);
  let triggerOptions = $state<TriggerOption[]>([]);
  let triggerActiveIndex = $state(0);

  const triggerOpen = $derived(triggerMatch !== null);

  /**
   * O campo aponta a opção ativa só enquanto ela existe para ele.
   *
   * Um `aria-activedescendant` órfão aponta um elemento que já saiu do
   * documento, e um `aria-controls` para um painel escondido promete uma lista
   * que não há.
   */
  const triggerActiveId = $derived.by(() => {
    const option = triggerOptions[triggerActiveIndex];
    return option ? `${popoverId}-${option.id}` : undefined;
  });

  function closeTriggerPopover(): void {
    triggerMatch = null;
    triggerOptions = [];
    triggerActiveIndex = 0;
  }

  /** Relê o campo e decide se o seletor abre, filtra ou fecha. */
  function syncTriggerPopover(el: HTMLTextAreaElement): void {
    if (!hasTriggerPopover) return;
    const found = findTrigger(
      el.value,
      el.selectionStart ?? 0,
      triggers.map((source) => source.spec),
    );
    const source = found
      ? triggers.find((candidate) => candidate.spec.char === found.spec.char)
      : undefined;
    if (!found || !source) {
      closeTriggerPopover();
      return;
    }

    // O termo mudou: a opção ativa volta ao topo. Manter o índice faria a
    // escolha pular para outra pessoa a cada letra digitada.
    const previousTerm = triggerMatch?.term;
    triggerMatch = found;
    triggerOptions = rankByTerm(source.options, found.term, (option) => option.label);
    if (previousTerm !== found.term) triggerActiveIndex = 0;
    if (triggerActiveIndex >= triggerOptions.length) triggerActiveIndex = 0;
  }

  /**
   * A rolagem, o clique e a seta movem o cursor sem que o texto mude.
   *
   * O evento traz o elemento, e ler dele — em vez do vínculo — é o que torna
   * esta releitura independente da ordem em que os dois ouvintes do campo rodam.
   */
  function syncFromEvent(event: Event & { currentTarget: HTMLTextAreaElement }): void {
    syncTriggerPopover(event.currentTarget);
  }

  function onTriggerKeyup(
    event: KeyboardEvent & { currentTarget: HTMLTextAreaElement },
  ): void {
    if (!event.key.startsWith('Arrow') && event.key !== 'Home' && event.key !== 'End') return;
    syncTriggerPopover(event.currentTarget);
  }

  /** Anda pela lista. O foco não se move; o que muda é a opção apontada. */
  function moveTriggerActive(delta: number): void {
    const total = triggerOptions.length;
    if (!triggerOpen || !total) return;
    // Circular: quem está no fim e desce volta ao começo. Uma lista que para na
    // última obriga a subir de volta contando.
    triggerActiveIndex = (triggerActiveIndex + delta + total) % total;
  }

  /** Escreve a opção ativa no campo. Devolve `false` se não havia o que aplicar. */
  function applyTriggerActive(): boolean {
    const el = inputEl;
    const current = triggerMatch;
    const option = triggerOptions[triggerActiveIndex];
    if (!el || !current || !option) return false;

    const replacement = option.value ?? `${current.spec.char}${option.label}`;
    const applied = applyTrigger(
      el.value,
      current,
      el.selectionStart ?? el.value.length,
      replacement,
    );

    value = applied.text;
    closeTriggerPopover();
    // O texto chega ao campo na próxima passada do render; a posição do cursor
    // só existe depois disso.
    void tick().then(() => el.setSelectionRange(applied.caret, applied.caret));
    return true;
  }

  function onTriggerChoose(index: number): void {
    triggerActiveIndex = index;
    applyTriggerActive();
  }

  function onKeydown(event: KeyboardEvent): void {
    // COM O SELETOR ABERTO, AS TECLAS SÃO DELE.
    //
    // É a decisão que atravessa o componente inteiro: envio e escolha disputam a
    // mesma tecla, e enviar no meio de uma menção é o defeito que quem escreve
    // encontra na primeira vez que usa. As setas e o Escape também param aqui —
    // sem isso a seta moveria o cursor no texto enquanto a lista parece andar.
    if (triggerOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveTriggerActive(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveTriggerActive(-1);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTriggerPopover();
        return;
      }
      // Enter e Tab escolhem. O Tab entra porque quem escreve espera que ele
      // complete, e sem isso ele tiraria o foco do campo com a lista aberta.
      if ((event.key === 'Enter' && !event.isComposing) || event.key === 'Tab') {
        if (applyTriggerActive()) {
          event.preventDefault();
          return;
        }
      }
    }

    if (event.key !== 'Enter') return;
    // Composição de IME (acento morto, teclado de idioma com candidatos) usa
    // Enter para CONFIRMAR o caractere. Enviar aqui interromperia quem está
    // escrevendo em japonês no meio de uma palavra — e o campo é multilíngue.
    if (event.isComposing) return;
    const asked = submitOn === 'modifier' ? event.ctrlKey || event.metaKey : !event.shiftKey;
    if (!asked) return;
    // Sem o `preventDefault` a quebra de linha entra junto com o envio, e o
    // campo fica com um enter sobrando depois de limpo.
    event.preventDefault();
    requestSubmit();
  }
</script>

<form
  bind:this={ref}
  data-slot="composer"
  class={cn('nds-composer', className)}
  data-state={running ? 'running' : 'idle'}
  data-disabled={disabled ? 'true' : undefined}
  onsubmit={(event) => {
    // O composer não navega: quem decide o que fazer com o texto é quem consome.
    event.preventDefault();
    requestSubmit();
  }}
  {...restProps}
>
  <!--
    A MOLDURA É DO CONJUNTO: o campo perde borda, fundo e anel, e quem os desenha
    é `.nds-composer-field`. O anel acende no `:focus-within` dela, porque o
    trilho está dentro do mesmo formulário e um anel só em volta do texto o
    deixaria de fora do que está em foco.
  -->
  <div class="nds-composer-field">
    <!--
      A citação vem PRIMEIRO — contexto antes do que ele contextualiza. A ordem
      do documento é a ordem de leitura: quem chega pelo teclado ou por audição
      encontra a quem responde antes de encontrar o que anexou.
    -->
    {#if hasQuote && quote && quoteLabels}
      <ComposerQuoteBlock
        id={quoteId}
        {quote}
        labels={quoteLabels}
        onDismiss={onDismissQuote}
      />
    {/if}

    <!--
      O CONTEXTO VEM DEPOIS DA CITAÇÃO E ANTES DOS ANEXOS.

      A ordem do documento é a ordem de leitura: primeiro a quem se responde,
      depois o que a pergunta já leva junto, depois o que ainda está subindo.
    -->
    {#if hasContext && contextLabels}
      <ComposerContextList items={context} labels={contextLabels} onRemove={onRemoveContext} />
    {/if}

    <!--
      A fila vive DENTRO da moldura e ANTES do campo: os anexos fazem parte do
      que está sendo escrito, e uma fila fora da moldura pareceria uma lista de
      outra coisa.
    -->
    {#if hasAttachments && attachmentLabels}
      <ComposerAttachments
        {attachments}
        labels={attachmentLabels}
        onRemove={onRemoveAttachment}
      />
    {/if}

    <textarea
      id={uid}
      data-slot="composer-input"
      class="nds-composer-input"
      {rows}
      bind:value
      bind:this={inputEl}
      placeholder={labels.placeholder}
      aria-label={labels.input}
      aria-describedby={describedBy}
      aria-controls={triggerOpen ? popoverId : undefined}
      aria-activedescendant={triggerOpen ? triggerActiveId : undefined}
      maxlength={maxLength}
      {disabled}
      onkeydown={onKeydown}
      oninput={syncFromEvent}
      onclick={syncFromEvent}
      onkeyup={onTriggerKeyup}
      onblur={closeTriggerPopover}
    ></textarea>

    <!--
      O painel é ancorado no CAMPO, e abre para cima: o composer mora no pé da
      conversa, e abrir para baixo é abrir para fora da janela.
    -->
    {#if hasTriggerPopover && triggerLabels}
      <ComposerTriggerPopover
        id={popoverId}
        open={triggerOpen}
        options={triggerOptions}
        activeIndex={triggerActiveIndex}
        labels={triggerLabels}
        onChoose={onTriggerChoose}
      />
    {/if}
  </div>

  <div class="nds-composer-rail">
    <!--
      O início é o que se acrescenta à mensagem; o fim é o que se faz com ela. O
      trilho é um ESPAÇO: o composer reserva o lugar e não sabe o que se põe
      nele.
    -->
    <div class="nds-composer-rail-start">
      {@render railStart?.()}
    </div>

    <div class="nds-composer-rail-end">
      <!--
        O contador é `aria-hidden`, e isso é decisão, não esquecimento: ele muda
        a cada tecla, e um número reanunciado a cada letra torna o campo
        impossível de usar por audição. O limite chega UMA vez, pela descrição do
        campo, que é texto estático.
      -->
      {#if maxLength !== undefined}
        <span
          class="nds-composer-counter"
          aria-hidden="true"
          data-near-limit={String(nearLimit)}>{value.length}/{maxLength}</span
        >
      {/if}

      <!--
        O botão troca de NOME, e não só de forma: é o mesmo controle fazendo
        outra coisa, e o nome acessível tem de dizer qual.
      -->
      <Button
        data-slot="composer-submit"
        size="sm"
        disabled={submitDisabled}
        onclick={onButtonClick}
      >
        {running ? labels.stop : labels.submit}
      </Button>
    </div>
  </div>

  <!--
    A dica DESCREVE o campo: saber que uma tecla envia depois de tê-la apertado
    não serve para nada.
  -->
  <p id={hintId} class="nds-composer-hint">{hintText}</p>
</form>
