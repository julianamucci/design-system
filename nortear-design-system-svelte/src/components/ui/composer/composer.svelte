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
  import type { WithElementRef } from '@/lib/utils.js';

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
    /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
    railStart?: Snippet;
    /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem recebe. */
    onSubmit?: (value: string) => void;
    /** Alguém pediu para interromper o que está sendo gerado. */
    onStop?: () => void;
  };
</script>

<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';

  let {
    ref = $bindable(null),
    labels,
    value = $bindable(''),
    rows = 2,
    maxLength,
    disabled = false,
    submitOn = 'enter',
    running = false,
    railStart,
    onSubmit,
    onStop,
    class: className,
    ...restProps
  }: ComposerProps = $props();

  // `$props.id()` só é aceito como inicializador de declaração no topo.
  const uid = $props.id();
  const hintId = `${uid}-hint`;

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

  function onKeydown(event: KeyboardEvent): void {
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
    <textarea
      id={uid}
      data-slot="composer-input"
      class="nds-composer-input"
      {rows}
      bind:value
      placeholder={labels.placeholder}
      aria-label={labels.input}
      aria-describedby={hintId}
      maxlength={maxLength}
      {disabled}
      onkeydown={onKeydown}
    ></textarea>
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
