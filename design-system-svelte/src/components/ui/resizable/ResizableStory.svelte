<script lang="ts">
  import { PaneGroup, Pane, Handle } from './index';

  type Variant = 'horizontal' | 'vertical' | 'nested' | 'withHandle';

  interface Props {
    variant?: Variant;
    direction?: 'horizontal' | 'vertical';
    withHandle?: boolean;
    leftLabel?: string;
    rightLabel?: string;
    topLabel?: string;
    bottomLabel?: string;
    sidebarLabel?: string;
    contentLabel?: string;
    ariaLabel?: string;
    height?: string;
    class?: string;
  }

  let {
    variant = 'horizontal',
    direction = 'horizontal',
    withHandle = true,
    leftLabel = 'Esquerda',
    rightLabel = 'Direita',
    topLabel = 'Topo',
    bottomLabel = 'Rodapé',
    sidebarLabel = 'Sidebar',
    contentLabel = 'Conteúdo principal',
    ariaLabel = 'Redimensionar painéis — use setas para ajustar',
    height = '240px',
    class: className = '',
  }: Props = $props();
</script>

{#if variant === 'horizontal'}
  <div class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height};">
    <PaneGroup direction="horizontal" class="" style="height: 100%">
      <Pane defaultSize={30} minSize={20} maxSize={50} class="nds-cluster bg-muted/40" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-muted-foreground">{sidebarLabel}</span>
      </Pane>
      <Handle {withHandle} aria-label={ariaLabel} aria-orientation="vertical" />
      <Pane defaultSize={70} minSize={50} maxSize={80} class="nds-cluster" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-foreground">{contentLabel}</span>
      </Pane>
    </PaneGroup>
  </div>
{:else if variant === 'vertical'}
  <div class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height};">
    <PaneGroup direction="vertical" class="" style="height: 100%">
      <Pane defaultSize={50} minSize={20} maxSize={80} class="nds-cluster bg-muted/40" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-muted-foreground">{topLabel}</span>
      </Pane>
      <Handle {withHandle} aria-label={ariaLabel} aria-orientation="horizontal" />
      <Pane defaultSize={50} minSize={20} maxSize={80} class="nds-cluster" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-foreground">{bottomLabel}</span>
      </Pane>
    </PaneGroup>
  </div>
{:else if variant === 'nested'}
  <div class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height};">
    <PaneGroup direction="horizontal" class="" style="height: 100%">
      <Pane defaultSize={30} minSize={20} maxSize={50} class="nds-cluster bg-muted/40" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-muted-foreground">{sidebarLabel}</span>
      </Pane>
      <Handle {withHandle} aria-label={ariaLabel} aria-orientation="vertical" />
      <Pane defaultSize={70} minSize={40}>
        <PaneGroup direction="vertical" class="" style="height: 100%">
          <Pane defaultSize={60} minSize={20} class="nds-cluster" data-align="center" data-justify="center">
            <span class="nds-text-body nds-text-foreground">{topLabel}</span>
          </Pane>
          <Handle {withHandle} aria-label={ariaLabel} aria-orientation="horizontal" />
          <Pane defaultSize={40} minSize={20} class="nds-cluster bg-muted/40" data-align="center" data-justify="center">
            <span class="nds-text-body nds-text-muted-foreground">{bottomLabel}</span>
          </Pane>
        </PaneGroup>
      </Pane>
    </PaneGroup>
  </div>
{:else if variant === 'withHandle'}
  <div class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden {className}" style="height: {height};">
    <PaneGroup {direction} class="" style="height: 100%">
      <Pane defaultSize={50} minSize={20} maxSize={80} class="nds-cluster bg-muted/40" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-muted-foreground">{leftLabel}</span>
      </Pane>
      <Handle withHandle aria-label={ariaLabel} />
      <Pane defaultSize={50} minSize={20} maxSize={80} class="nds-cluster" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-foreground">{rightLabel}</span>
      </Pane>
    </PaneGroup>
  </div>
{/if}
