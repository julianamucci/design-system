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
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

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
        <Button variant="outline" {...props}>{triggerLabel}</Button>
      {/snippet}
    </DialogTrigger>
    <DialogContent {showCloseButton}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {#if variant === 'withForm'}
        <!--
          `<Input>` do sistema e não `<input>` cru com `style`: o cru trazia
          `height: var(--height-default)` inline, que é altura cravada em
          primitivo de texto (WCAG 1.4.4), e `defaultValue`, que no Svelte não
          é prop nenhuma — virava atributo inerte e os campos renderizavam
          VAZIOS enquanto a story dizia mostrar dados preenchidos.
        -->
        <form class="nds-grid" data-spacing="sm" onsubmit={(e) => { e.preventDefault(); onAction?.(); }}>
          <div class="nds-grid" data-spacing="xs">
            <Label for="dialog-name">Nome</Label>
            <Input id="dialog-name" value="Maria Silva" />
          </div>
          <div class="nds-grid" data-spacing="xs">
            <Label for="dialog-email">E-mail</Label>
            <Input id="dialog-email" type="email" value="maria@exemplo.com" />
          </div>
        </form>
      {:else if variant === 'withScrollContent'}
        <div
          class="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
          data-slot="dialog-body"
          data-spacing="sm"
          tabindex="0"
          role="region"
          aria-label="Conteúdo rolável"
        >
          {#each Array.from({ length: 14 }) as _, i (i)}
            <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Dialog quando o body excede a altura disponível em viewport.</p>
          {/each}
        </div>
      {/if}

      {#if variant !== 'noFooter'}
        <DialogFooter>
          <DialogClose>
            {#snippet child({ props })}
              <!--
                `onclick` DEPOIS do spread sobrescrevia o handler que o
                primitivo entrega em `props` — o que fecha o diálogo. O Cancelar
                avisava o callback e não fechava nada, e nenhuma asserção
                reparava porque ninguém verificava o fechamento por ali.
                Encadear os dois preserva o comportamento do primitivo.
              -->
              <Button
                variant="outline"
                {...props}
                onclick={(event: MouseEvent) => {
                  (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                  onCancel?.();
                }}
              >
                {cancelLabel}
              </Button>
            {/snippet}
          </DialogClose>
          <!--
            `variant="destructive"` e não classes soltas: `bg-destructive`,
            `text-destructive-foreground` e `nds-hover-bg-destructive-90` não
            existem no CSS, então a ação destrutiva renderizava no visual
            padrão e a story mostrava o contrário do que documentava.
          -->
          <Button
            variant={variant === 'withDestructiveAction' ? 'destructive' : 'default'}
            onclick={onAction}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      {/if}
    </DialogContent>
  </Dialog>
{/key}
