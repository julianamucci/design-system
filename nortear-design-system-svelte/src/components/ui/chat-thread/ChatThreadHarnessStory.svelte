<script lang="ts">
  /**
   * Andaime das stories que precisam da conversa MUDANDO.
   *
   * Aqui a lista é a API — não há método na raiz para a play chamar —, então
   * quem muda o estado é um controle na tela, e a play clica nele. O andaime
   * fica neste componente, e não no arquivo de story, por dois motivos: num
   * `*.stories.ts` todo export nomeado vira story, e um `{#snippet}` só existe
   * dentro de marcação — o botão de ação de uma mensagem não cabe num `.ts`.
   *
   * "Reiniciar" existe porque o painel Interactions REEXECUTA a play no mesmo
   * DOM, sem remontar: sem ele, a segunda rodada partiria das mensagens que a
   * primeira acrescentou e as contagens não fechariam.
   */
  import { untrack } from 'svelte';
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { ChatThread, type ChatMessage } from './index';
  import { chatThreadLabelsFor } from './chat-thread.fixtures';

  const {
    initial,
    controls = [],
    initialError,
    actionsFor,
  }: {
    initial: ChatMessage[];
    controls?: Array<{ label: string; apply: (current: ChatMessage[]) => ChatMessage[] }>;
    /** Declarado (mesmo vazio) faz aparecer o controle que limpa o erro. */
    initialError?: string;
    /** Id da mensagem que recebe as ações do turno. */
    actionsFor?: string;
  } = $props();

  // `$state.raw` porque é assim que a API se usa: quem faz streaming TROCA o
  // array. Estado profundo esconderia isso atrás de um proxy que aceita as duas
  // formas, e a demonstração deixaria de demonstrar a decisão.
  //
  // O `untrack` diz o que a leitura das props é: o ponto de PARTIDA, e não um
  // vínculo — daqui em diante quem manda é o botão na tela.
  let messages = $state.raw<ChatMessage[]>(untrack(() => initial));
  let error = $state<string | undefined>(untrack(() => initialError));

  const labels = $derived(chatThreadLabelsFor($locale));

  function reset(): void {
    messages = initial;
    error = initialError;
  }
</script>

<!--
  O snippet vem ANTES de quem o usa: a marcação abaixo o passa como a ação do
  turno, e declará-lo depois deixaria a referência apontando para o nada.
-->
{#snippet copyAction()}
  <Button variant="ghost" size="sm">Copiar</Button>
{/snippet}

<div>
  <ChatThread
    messages={actionsFor
      ? messages.map((m) => (m.id === actionsFor ? { ...m, actions: copyAction } : m))
      : messages}
    {labels}
    {error}
    size="md"
  />
  <div class="nds-cluster nds-mt-4" data-spacing="sm">
    <Button variant="outline" size="sm" onclick={reset}>Reiniciar</Button>
    {#each controls as control (control.label)}
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          messages = control.apply(messages);
        }}
      >
        {control.label}
      </Button>
    {/each}
    {#if initialError !== undefined}
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          error = undefined;
        }}
      >
        Limpar erro
      </Button>
    {/if}
  </div>
</div>
