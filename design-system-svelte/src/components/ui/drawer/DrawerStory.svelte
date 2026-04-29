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
            <form class="grid gap-3 px-4">
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
          {:else if variant === 'withConfirmation'}
            <div class="px-4 text-sm text-muted-foreground">
              <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita posteriormente.</p>
            </div>
          {:else if variant === 'withScroll'}
            <div class="max-h-[50vh] overflow-y-auto px-4 text-sm text-muted-foreground space-y-2">
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
            <form class="grid gap-3 px-4">
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
          {:else if variant === 'withConfirmation'}
            <div class="px-4 text-sm text-muted-foreground">
              <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita posteriormente.</p>
            </div>
          {:else if variant === 'withScroll'}
            <div class="max-h-[50vh] overflow-y-auto px-4 text-sm text-muted-foreground space-y-2">
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
