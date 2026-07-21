<script lang="ts">
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Side = 'top' | 'right' | 'bottom' | 'left';
  type Variant = 'default' | 'withForm' | 'withScrollContent' | 'noFooter' | 'withDestructiveAction';

  interface Props {
    open?: boolean;
    side?: Side;
    showCloseButton?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }

  let {
    open = $bindable(undefined),
    side = 'right',
    showCloseButton = true,
    triggerLabel = 'Abrir filtros',
    title = 'Filtros avançados',
    description = 'Configure os filtros para refinar os resultados.',
    actionLabel = 'Aplicar filtros',
    cancelLabel = 'Cancelar',
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${side}-${showCloseButton}-${variant}`}
    {#if open !== undefined}
      <Sheet bind:open>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent {side} {showCloseButton}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          {#if variant === 'withForm'}
            <form class="nds-grid nds-px-4" data-spacing="sm">
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">Nome</span>
                <input
                  type="text"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="Maria Silva"
                />
              </label>
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">Email</span>
                <input
                  type="email"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="maria@exemplo.com"
                />
              </label>
            </form>
          {:else if variant === 'withScrollContent'}
            <div class="max-h-[60vh] nds-overflow-y nds-px-4 nds-text-body nds-text-muted-foreground" data-spacing="sm">
              {#each Array.from({ length: 14 }) as _, i}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Sheet.</p>
              {/each}
            </div>
          {/if}

          {#if variant !== 'noFooter'}
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props} onclick={onCancel}>{cancelLabel}</Button>
                {/snippet}
              </SheetClose>
              <Button
                class={variant === 'withDestructiveAction'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''}
                onclick={onAction}
              >
                {actionLabel}
              </Button>
            </SheetFooter>
          {/if}
        </SheetContent>
      </Sheet>
    {:else}
      <Sheet>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent {side} {showCloseButton}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          {#if variant === 'withForm'}
            <form class="nds-grid nds-px-4" data-spacing="sm">
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">Nome</span>
                <input
                  type="text"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="Maria Silva"
                />
              </label>
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">Email</span>
                <input
                  type="email"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="maria@exemplo.com"
                />
              </label>
            </form>
          {:else if variant === 'withScrollContent'}
            <div class="max-h-[60vh] nds-overflow-y nds-px-4 nds-text-body nds-text-muted-foreground" data-spacing="sm">
              {#each Array.from({ length: 14 }) as _, i}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Sheet.</p>
              {/each}
            </div>
          {/if}

          {#if variant !== 'noFooter'}
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <Button variant="outline" {...props} onclick={onCancel}>{cancelLabel}</Button>
                {/snippet}
              </SheetClose>
              <Button
                class={variant === 'withDestructiveAction'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''}
                onclick={onAction}
              >
                {actionLabel}
              </Button>
            </SheetFooter>
          {/if}
        </SheetContent>
      </Sheet>
    {/if}
  {/key}
</div>
