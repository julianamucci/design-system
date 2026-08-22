<script lang="ts">
  import { PaneGroup, Pane, Handle } from './index';
  import { cn } from '@/lib/utils.js';

  interface Props {
    /** `simple` é um grupo de dois painéis; `nested` põe um grupo dentro do segundo. */
    variant?: 'simples' | 'nested';
    direction?: 'horizontal' | 'vertical';
    withHandle?: boolean;
    disabled?: boolean;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    labelA?: string;
    labelB?: string;
    innerTop?: string;
    innerBottom?: string;
    ariaLabel?: string;
    innerAriaLabel?: string;
    height?: string;
    class?: string;
  }

  let {
    variant = 'simples',
    direction = 'horizontal',
    withHandle = false,
    disabled = false,
    defaultSize = 30,
    minSize = 20,
    maxSize = 100,
    labelA = 'Sidebar',
    labelB = 'Conteúdo principal',
    innerTop = 'Editor',
    innerBottom = 'Console',
    ariaLabel = 'Redimensionar painéis — use setas para ajustar',
    innerAriaLabel = 'Redimensionar editor e console — use setas',
    height = '240px',
    class: className = '',
  }: Props = $props();
</script>

<!--
  A composição da classe passa por `cn(...)`, e não por interpolação dentro do
  atributo: a forma interpolada fazia o auditor ler a própria expressão como
  nome de classe (`legacy_class_in_story`) e deixava um espaço solto quando a
  prop vinha vazia.
-->
<div
  class={cn('nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden', className)}
  style="height: {height};"
>
  <PaneGroup {direction} style="height: 100%">
    <Pane defaultSize={defaultSize} minSize={minSize} maxSize={maxSize} class="nds-cluster nds-bg-muted-40" data-align="center" data-justify="center">
      <span class="nds-text-body nds-text-muted-foreground">{labelA}</span>
    </Pane>

    <Handle {withHandle} {disabled} aria-label={ariaLabel} />

    <Pane defaultSize={100 - defaultSize} minSize={minSize}>
      {#if variant === 'nested'}
        <PaneGroup direction={direction === 'horizontal' ? 'vertical' : 'horizontal'} style="height: 100%">
          <Pane defaultSize={60} minSize={20} class="nds-cluster" data-align="center" data-justify="center">
            <span class="nds-text-body">{innerTop}</span>
          </Pane>
          <Handle {withHandle} aria-label={innerAriaLabel} />
          <Pane defaultSize={40} minSize={20} class="nds-cluster nds-bg-muted-40" data-align="center" data-justify="center">
            <span class="nds-text-body nds-text-muted-foreground">{innerBottom}</span>
          </Pane>
        </PaneGroup>
      {:else}
        <div class="nds-cluster nds-h-full" data-align="center" data-justify="center">
          <span class="nds-text-body">{labelB}</span>
        </div>
      {/if}
    </Pane>
  </PaneGroup>
</div>
