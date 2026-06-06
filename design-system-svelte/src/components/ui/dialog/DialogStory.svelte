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
        <form class="grid gap-3" onsubmit={(e) => { e.preventDefault(); onAction?.(); }}>
          <label class="grid gap-1 text-sm">
            <span class="text-foreground">Nome</span>
            <input
              type="text"
              class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
              defaultValue="Maria Silva"
            />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="text-foreground">Email</span>
            <input
              type="email"
              class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
              defaultValue="maria@exemplo.com"
            />
          </label>
        </form>
      {:else if variant === 'withScrollContent'}
        <div class="max-h-[40vh] overflow-y-auto pr-2 text-sm text-muted-foreground space-y-2" tabindex="0" role="region" aria-label="Conteúdo rolável">
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
            class={variant === 'withDestructiveAction' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            onclick={onAction}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      {/if}
    </DialogContent>
  </Dialog>
{/key}
