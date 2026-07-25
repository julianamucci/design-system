<script lang="ts">
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Variant = 'default' | 'withForm' | 'withScrollContent' | 'noFooter' | 'withDestructiveAction' | 'customCloseInFooter';

  interface Props {
    open?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    showCloseButton?: boolean;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }

  let {
    open = $bindable(false),
    triggerLabel = 'Editar perfil',
    title = 'Editar perfil',
    description = 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel = 'Salvar alterações',
    cancelLabel = 'Cancelar',
    showCloseButton = true,
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

{#key `${variant}-${showCloseButton}`}
  <Dialog bind:open>
    <DialogTrigger>
      {#snippet child({ props })}
        <Button {...props}>{triggerLabel}</Button>
      {/snippet}
    </DialogTrigger>
    <DialogContent {showCloseButton}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {#if variant === 'withForm'}
        <form class="nds-grid" data-spacing="sm" onsubmit={(e) => { e.preventDefault(); onAction?.(); }}>
          <label class="nds-grid nds-text-body" data-spacing="xs">
            <span class="nds-text-foreground">Nome</span>
            <input
              type="text"
              class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
              defaultValue="Maria Silva"
            />
          </label>
          <label class="nds-grid nds-text-body" data-spacing="xs">
            <span class="nds-text-foreground">Email</span>
            <input
              type="email"
              class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
              defaultValue="maria@exemplo.com"
            />
          </label>
        </form>
      {:else if variant === 'withScrollContent'}
        <div class="max-h-[40vh] nds-overflow-y nds-text-body nds-text-muted-foreground" data-spacing="sm" style="padding-right: 0.5rem" tabindex="0" role="region" aria-label="Conteúdo rolável">
          {#each Array.from({ length: 14 }) as _, i}
            <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Dialog quando o body excede a altura disponível em viewport.</p>
          {/each}
        </div>
      {/if}

      {#if variant !== 'noFooter'}
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}
              <Button variant="outline" {...props} onclick={onCancel}>{cancelLabel}</Button>
            {/snippet}
          </DialogClose>
          <Button
            class={variant === 'withDestructiveAction' ? 'bg-destructive text-destructive-foreground nds-hover-bg-destructive-90' : ''}
            onclick={onAction}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      {/if}
    </DialogContent>
  </Dialog>
{/key}
