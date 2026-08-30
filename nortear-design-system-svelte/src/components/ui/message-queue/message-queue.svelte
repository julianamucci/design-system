<script lang="ts" module>
  // ─── MessageQueue ──────────────────────────────────────────────────────────
  //
  // As mensagens escritas enquanto a anterior ainda era respondida.
  //
  // Desenho em `nds/composer.css`, no bloco da fila de envio, que também guarda
  // as cinco decisões de acessibilidade. O vocabulário — `QueuedMessage`,
  // `QueuedMessageState`, `canWithdraw` — vem de
  // `@shared/primitives/chat-protocol`.
  //
  // A PEÇA É AUTÔNOMA, e fica ACIMA do campo em vez de dentro dele. Contexto,
  // anexo e citação vivem dentro da moldura porque descrevem o que ainda está
  // sendo escrito; a fila é o oposto — é o que JÁ SAIU das mãos de quem escreve,
  // e pô-la dentro do campo a misturaria com o que ainda não saiu. Quem consome
  // empilha as duas peças, nesta ordem. Nenhum arquivo do campo sabe que ela
  // existe.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: ela não envia nada. Enviar, reordenar e decidir
  // o que acontece com o que foi retirado é de quem consome — a mesma divisão de
  // `approval` no `chat-thread` e de `onRemove` nos anexos. Uma fila que
  // enviasse sozinha traria transporte junto, e transporte envelhece por produto,
  // não por sistema.
  //
  // A FILA NÃO É REGIÃO VIVA. Cada item entrou porque a própria pessoa o
  // escreveu, e devolver em voz o que se acabou de digitar é repetir, não
  // informar. É a mesma decisão do contador de caracteres do campo e do relógio
  // do reprodutor de mídia, pelo mesmo motivo.
  //
  // DIVERGÊNCIA DE API, em relação à referência: lá a peça é uma fábrica que
  // recebe um objeto de opções e devolve o elemento — ou nada, quando não há o
  // que esperar. Aqui ela é um componente, as opções são props, o retorno chega
  // por prop de callback, e a ausência é um `{#if}` que não desenha a lista.
  // Markup, classes `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.
  import type { QueuedMessageState } from '@shared/primitives/chat-protocol';

  export interface MessageQueueLabels {
    /** Nome acessível da fila. */
    list: string;
    /** Nome do botão de retirar. `{text}` vira o texto da mensagem. */
    withdraw: string;
    /**
     * A palavra de cada estado. É ela que distingue a que já saiu — a folha só
     * a deixa mais apagada, e transparência sozinha não descreve estado
     * (WCAG 1.4.1).
     */
    state: Record<QueuedMessageState, string>;
  }
</script>

<script lang="ts">
  import { canWithdraw, type QueuedMessage } from '@shared/primitives/chat-protocol';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';

  const {
    messages,
    labels,
    onWithdraw,
    class: className,
  }: {
    /** As mensagens que esperam, na ordem em que saem. */
    messages: QueuedMessage[];
    labels: MessageQueueLabels;
    /** Alguém pediu para retirar. Retirar de verdade é de quem envia. */
    onWithdraw?: (message: QueuedMessage) => void;
    class?: string;
  } = $props();

  /**
   * O nome acessível leva o TEXTO DA MENSAGEM (decisão 4 da folha).
   *
   * Uma fila de três botões chamados "Retirar" é um botão só para quem navega
   * por audição.
   */
  function withdrawLabel(message: QueuedMessage): string {
    return labels.withdraw.replace('{text}', message.text);
  }
</script>

<!--
  Sem mensagem, NADA é desenhado — e não uma lista vazia escondida. Uma `<ol>`
  sem item é anunciada como "lista com zero itens", que promete algo que não há.
  É a mesma decisão da lista de contexto do campo, e aqui ela precisa morar na
  própria peça: ela é autônoma, e não existe um campo por perto para decidir por
  ela.
-->
{#if messages.length > 0}
  <!--
    `<ol>` e não `<ul>`: aqui a ordem É a informação. Quem espera quer saber que
    é a terceira, e uma lista não ordenada anuncia quantos itens há sem dizer em
    que lugar cada um está.
  -->
  <ol
    data-slot="composer-queue"
    class={cn('nds-composer-queue', className)}
    aria-label={labels.list}
  >
    {#each messages as message, index (message.id ?? index)}
      <li
        data-slot="composer-queue-item"
        class="nds-composer-queue-item"
        data-state={message.state}
        data-message-id={message.id}
        aria-busy={message.state === 'sending' ? 'true' : undefined}
      >
        <!--
          A posição é TEXTO no documento, e não um `::before` da folha (decisão
          1): conteúdo gerado por folha não é confiável para leitor de tela e
          some quando a folha não carrega. O número sai do índice — a ordem da
          lista é a própria fila, e um número recebido de fora poderia discordar
          dela.
        -->
        <span
          data-slot="composer-queue-position"
          class="nds-composer-queue-position">{index + 1}</span
        >

        <span
          data-slot="composer-queue-text"
          class="nds-composer-queue-text">{message.text}</span
        >

        <!--
          A palavra do estado, em etiqueta curta. É a etiqueta do próprio design
          system, de propósito: a folha da família não declara classe própria
          para ela, e inventar uma aqui deixaria o desenho fora do lugar onde as
          decisões moram. O `data-slot` é o da fila, e não o da etiqueta — quem
          procura a palavra do estado procura pela fila.
        -->
        <Badge data-slot="composer-queue-state">{labels.state[message.state]}</Badge>

        <!--
          Quem pode ser retirada sai do VOCABULÁRIO, e não de um `if` da tela
          (decisão 2 da folha). Botão que promete desfazer o que não desfaz é
          pior que botão nenhum, e cinco regras escritas à mão terminariam com
          uma delas discordando das outras quatro.
        -->
        {#if canWithdraw(message)}
          <Button
            data-slot="composer-queue-withdraw"
            variant="ghost"
            size="icon-sm"
            aria-label={withdrawLabel(message)}
            onclick={() => onWithdraw?.(message)}>×</Button
          >
        {/if}
      </li>
    {/each}
  </ol>
{/if}
