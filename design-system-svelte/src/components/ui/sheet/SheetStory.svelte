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
            <form class="grid gap-3 px-4">
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">Nome</span>
                <input
                  type="text"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="Maria Silva"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">Email</span>
                <input
                  type="email"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="maria@exemplo.com"
                />
              </label>
            </form>
          {:else if variant === 'withScrollContent'}
            <div class="max-h-[60vh] overflow-y-auto px-4 text-sm text-muted-foreground space-y-2">
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
            <form class="grid gap-3 px-4">
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">Nome</span>
                <input
                  type="text"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="Maria Silva"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">Email</span>
                <input
                  type="email"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="maria@exemplo.com"
                />
              </label>
            </form>
          {:else if variant === 'withScrollContent'}
            <div class="max-h-[60vh] overflow-y-auto px-4 text-sm text-muted-foreground space-y-2">
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
