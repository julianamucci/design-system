<script lang="ts">
  /**
   * Colapsável de chamada de ferramenta ou de raciocínio.
   *
   * `<details>` nativo: o conteúdo continua encontrável pela busca do navegador
   * com a caixa fechada, e uma thread com dezenas deles não paga JavaScript por
   * mensagem.
   *
   * `open` é o valor INICIAL, e não um vínculo: depois que a pessoa abre ou
   * fecha a caixa, quem manda é o elemento. Vincular aqui faria o conteúdo que
   * chega fechar o que ela abriu.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';

  const {
    kind,
    summary,
    open = false,
    children,
    ...restProps
  }: HTMLAttributes<HTMLDetailsElement> & {
    kind: 'tool-call' | 'reasoning';
    summary: string;
    open?: boolean;
    children?: Snippet;
  } = $props();

  // As três classes montadas no script, e não interpoladas no atributo.
  //
  // Interpolação dentro do atributo publica o molde como se fosse nome de
  // classe: quem varre o projeto lê o molde, não acha folha que o defina, e o
  // portão de classe desconhecida acusa. Montada aqui, a classe chega ao
  // atributo como expressão — e o que a folha define continua sendo o nome
  // inteiro, `nds-chat-tool-call` ou `nds-chat-reasoning`.
  const rootClass = $derived(`nds-chat-${kind}`);
  const summaryClass = $derived(`nds-chat-${kind}-summary`);
  const bodyClass = $derived(`nds-chat-${kind}-body`);
</script>

<details class={rootClass} {open} {...restProps}>
  <summary class={summaryClass}>
    <!-- Ícone de seta que gira com o estado do colapsável. -->
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={cn('nds-icon', `nds-chat-${kind}-icon`)}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
    <span>{summary}</span>
  </summary>
  <div class={bodyClass}>{@render children?.()}</div>
</details>
