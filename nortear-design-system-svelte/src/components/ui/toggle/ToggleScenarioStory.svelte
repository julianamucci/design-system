<script lang="ts" module>
  export type Cenario =
    | 'single'
    | 'variants'
    | 'sizes'
    | 'labels'
    | 'on'
    | 'focus'
    | 'disabled'
    | 'invalid'
    | 'toolbar'
    | 'filters'
    | 'controlled';
</script>

<script lang="ts">
  /**
   * Andaime dos cenários com MAIS DE UM toggle na tela.
   *
   * `ToggleStory.svelte` renderiza um toggle só e continua servindo ao
   * Playground. As comparações — duas variantes lado a lado, a escada de
   * tamanhos, a toolbar, a lista de filtros — precisam de vários, e é a
   * comparação que sustenta a asserção: um `data-variant` correto com CSS
   * ausente só se denuncia contra o vizinho.
   *
   * Um componente por cenário daria dez arquivos para o mesmo desenho; aqui o
   * cenário é uma prop, como o `template` da story nas outras stacks.
   */
  import { Toggle } from './index';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  import List from '@lucide/svelte/icons/list';
  import Eye from '@lucide/svelte/icons/eye';

  interface Props {
    // Opcional com padrão: prop OBRIGATÓRIA aqui quebra a tipagem do `Meta` do
    // Storybook, que descreve o componente por um objeto de args parcial.
    cenario?: Cenario;
  }

  let { cenario = 'single' }: Props = $props();

  // Cada estado inicial mora num `$state` próprio e desce por `bind:` — com um
  // literal, o toggle mutaria uma prop que ninguém observa.
  let active = $state(true);
  let compacta = $state(true);
  let compactaFilter = $state(true);
  let disabledActive = $state(true);
  let controlled = $state(false);
</script>

{#if cenario === 'single'}
  <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
{:else if cenario === 'variants' || cenario === 'focus'}
  <div class="nds-cluster" data-spacing="sm">
    <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
    <Toggle variant="outline" aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
  </div>
{:else if cenario === 'sizes'}
  <div class="nds-cluster" data-spacing="sm">
    <Toggle variant="outline" size="sm" aria-label="Negrito pequeno">
      <Bold aria-hidden="true" />
    </Toggle>
    <Toggle variant="outline" aria-label="Negrito padrão"><Bold aria-hidden="true" /></Toggle>
    <Toggle variant="outline" size="lg" aria-label="Negrito grande">
      <Bold aria-hidden="true" />
    </Toggle>
  </div>
{:else if cenario === 'labels'}
  <div class="nds-cluster" data-spacing="sm">
    <Toggle variant="outline">
      <Eye aria-hidden="true" />
      Mostrar ocultos
    </Toggle>
    <Toggle variant="outline" bind:pressed={compacta}>
      <List aria-hidden="true" />
      Visão compacta
    </Toggle>
  </div>
{:else if cenario === 'on'}
  <div class="nds-cluster" data-spacing="sm">
    <Toggle aria-label="Negrito inativo"><Bold aria-hidden="true" /></Toggle>
    <Toggle bind:pressed={active} aria-label="Negrito ativo"><Bold aria-hidden="true" /></Toggle>
  </div>
{:else if cenario === 'disabled'}
  <div class="nds-cluster" data-spacing="sm">
    <Toggle disabled aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
    <Toggle disabled bind:pressed={disabledActive} aria-label="Itálico ativo e desabilitado">
      <Italic aria-hidden="true" />
    </Toggle>
  </div>
{:else if cenario === 'invalid'}
  <div class="nds-stack" data-spacing="xs">
    <Toggle aria-invalid="true" aria-describedby="toggle-invalid-msg" aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
    <p id="toggle-invalid-msg" class="nds-text-body nds-text-destructive">
      Selecione ao menos uma formatação.
    </p>
  </div>
{:else if cenario === 'toolbar'}
  <div
    role="group"
    aria-label="Formatação de texto"
    class="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
    data-align="center"
    data-spacing="xs"
  >
    <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
    <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
    <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
    <Toggle aria-label="Lista"><List aria-hidden="true" /></Toggle>
  </div>
{:else if cenario === 'filters'}
  <div class="nds-stack" data-spacing="sm">
    <p class="nds-text-body nds-font-semibold">Filtros de exibição</p>
    <div class="nds-cluster" data-spacing="sm">
      <Toggle variant="outline">
        <Eye aria-hidden="true" />
        Mostrar ocultos
      </Toggle>
      <Toggle variant="outline" bind:pressed={compactaFilter}>
        <List aria-hidden="true" />
        Visão compacta
      </Toggle>
    </div>
  </div>
{:else if cenario === 'controlled'}
  <div class="nds-stack" data-spacing="sm">
    <Toggle bind:pressed={controlled} aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
    <p class="nds-text-caption nds-text-muted-foreground">
      Estado atual: <code class="nds-font-mono">{String(controlled)}</code>
    </p>
  </div>
{/if}
