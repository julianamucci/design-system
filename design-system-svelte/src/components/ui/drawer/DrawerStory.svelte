<script lang="ts">
  import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Direction = 'bottom' | 'top' | 'left' | 'right';
  type Variant = 'default' | 'withForm' | 'withConfirmation' | 'withScroll';

  interface Props {
    direction?: Direction;
    defaultOpen?: boolean;
    open?: boolean;
    dismissible?: boolean;
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
    direction = 'bottom',
    defaultOpen = false,
    open = $bindable(undefined),
    dismissible = true,
    triggerLabel = 'Abrir drawer',
    title = 'Editar perfil',
    description = 'Atualize seus dados pessoais e foto.',
    actionLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${direction}-${defaultOpen}-${dismissible}-${variant}`}
    {#if open !== undefined}
      <Drawer bind:open {direction} {dismissible}>
        <DrawerTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          {#if variant === 'withForm'}
            <form class="nds-grid nds-px-4" data-spacing="sm">
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
          {:else if variant === 'withConfirmation'}
            <div class="nds-px-4 nds-text-body nds-text-muted-foreground">
              <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita posteriormente.</p>
            </div>
          {:else if variant === 'withScroll'}
            <div class="max-h-[50vh] nds-overflow-y nds-px-4 nds-text-body nds-text-muted-foreground" data-spacing="sm">
              {#each Array.from({ length: 12 }) as _, i}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar scroll interno do Drawer.</p>
              {/each}
            </div>
          {/if}

          <DrawerFooter>
            <Button onclick={onAction}>{actionLabel}</Button>
            <DrawerClose>
              {#snippet child({ props })}
                <Button variant="outline" {...props} onclick={onCancel}>{cancelLabel}</Button>
              {/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    {:else}
      <Drawer {direction} {defaultOpen} {dismissible}>
        <DrawerTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          {#if variant === 'withForm'}
            <form class="nds-grid nds-px-4" data-spacing="sm">
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
          {:else if variant === 'withConfirmation'}
            <div class="nds-px-4 nds-text-body nds-text-muted-foreground">
              <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita posteriormente.</p>
            </div>
          {:else if variant === 'withScroll'}
            <div class="max-h-[50vh] nds-overflow-y nds-px-4 nds-text-body nds-text-muted-foreground" data-spacing="sm">
              {#each Array.from({ length: 12 }) as _, i}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar scroll interno do Drawer.</p>
              {/each}
            </div>
          {/if}

          <DrawerFooter>
            <Button onclick={onAction}>{actionLabel}</Button>
            <DrawerClose>
              {#snippet child({ props })}
                <Button variant="outline" {...props} onclick={onCancel}>{cancelLabel}</Button>
              {/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    {/if}
  {/key}
</div>
