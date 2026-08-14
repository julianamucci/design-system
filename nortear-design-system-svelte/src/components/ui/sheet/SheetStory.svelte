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
  // Este wrapper nunca teve `defaultOpen` — as stories já passam `open`. O que
  // existia era um `{#if open !== undefined}` com os dois ramos idênticos fora
  // do `open`, e o ramo "não controlado" nunca abria. Colapsado para um só.
  let {
    open = $bindable(false),
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
            <!-- max-h-[60vh] era Tailwind morto: sem altura maxima nada rolava, e por
                 isso o axe nunca aplicava scrollable-region-focusable. Com a altura de
                 volta, a regiao rolavel precisa de acesso por teclado. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
              class="nds-overflow-y nds-px-4 nds-text-body nds-text-muted-foreground"
              data-spacing="sm"
              style="max-block-size: 60vh"
              tabindex="0"
              role="region"
              aria-label={title}
            >
              {#each Array.from({ length: 14 }) as _, i (i)}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Sheet.</p>
              {/each}
            </div>
          {/if}

          {#if variant !== 'noFooter'}
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <!--
                    O `onclick` ENCADEIA o do primitivo em vez de substituí-lo.
                    Escrito depois do `{...props}`, ele vencia o handler que o
                    `SheetClose` injeta — o botão avisava quem escuta e não
                    fechava o painel. Mesmo defeito já corrigido no dialog e no
                    drawer; esta é a terceira ocorrência do padrão.
                  -->
                  <Button
                    variant="outline"
                    {...props}
                    onclick={(event: MouseEvent) => {
                      (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                      onCancel?.();
                    }}
                  >{cancelLabel}</Button>
                {/snippet}
              </SheetClose>
              <Button
                class={variant === 'withDestructiveAction'
                  ? 'bg-destructive text-destructive-foreground nds-hover-bg-destructive-90'
                  : ''}
                onclick={onAction}
              >
                {actionLabel}
              </Button>
            </SheetFooter>
          {/if}
        </SheetContent>
      </Sheet>
  {/key}
</div>
