<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant = 'default' | 'withTitle' | 'form';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    defaultOpen?: boolean;
    open?: boolean;
    modal?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    saveLabel?: string;
    cancelLabel?: string;
    nameLabel?: string;
    emailLabel?: string;
    submitLabel?: string;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    defaultOpen = false,
    open = $bindable(undefined),
    modal = false,
    triggerLabel = 'Abrir popover',
    title = 'Configurações de exibição',
    description = 'Ajuste a aparência do conteúdo da página.',
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    nameLabel = 'Nome',
    emailLabel = 'Email',
    submitLabel = 'Atualizar',
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${side}-${align}-${defaultOpen}-${modal}-${variant}`}
    {#if open !== undefined}
      <Popover bind:open {modal}>
        <PopoverTrigger>
          {#snippet child({ props })}
            <Button {...props}>{triggerLabel}</Button>
          {/snippet}
        </PopoverTrigger>
        <PopoverContent {side} {align} {sideOffset}>
          {#if variant === 'form'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <form
              class="grid gap-3 pt-1"
              onsubmit={(e) => {
                e.preventDefault();
                onAction?.();
              }}
            >
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">{nameLabel}</span>
                <input
                  type="text"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="Maria Silva"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">{emailLabel}</span>
                <input
                  type="email"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="maria@exemplo.com"
                />
              </label>
              <div class="flex justify-end pt-1">
                <Button type="submit" size="sm">{submitLabel}</Button>
              </div>
            </form>
          {:else if variant === 'withTitle'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="flex justify-end gap-2 pt-1">
              <PopoverClose>
                {#snippet child({ props })}
                  <Button variant="outline" size="sm" {...props} onclick={onCancel}>{cancelLabel}</Button>
                {/snippet}
              </PopoverClose>
              <Button size="sm" onclick={onAction}>{saveLabel}</Button>
            </div>
          {:else}
            <p class="text-sm">{description}</p>
          {/if}
        </PopoverContent>
      </Popover>
    {:else}
      <Popover {defaultOpen} {modal}>
        <PopoverTrigger>
          {#snippet child({ props })}
            <Button {...props}>{triggerLabel}</Button>
          {/snippet}
        </PopoverTrigger>
        <PopoverContent {side} {align} {sideOffset}>
          {#if variant === 'form'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <form
              class="grid gap-3 pt-1"
              onsubmit={(e) => {
                e.preventDefault();
                onAction?.();
              }}
            >
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">{nameLabel}</span>
                <input
                  type="text"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="Maria Silva"
                />
              </label>
              <label class="grid gap-1 text-sm">
                <span class="text-foreground">{emailLabel}</span>
                <input
                  type="email"
                  class="bg-background border border-input rounded-(--radius-input) px-3 h-(--height-default) text-sm"
                  value="maria@exemplo.com"
                />
              </label>
              <div class="flex justify-end pt-1">
                <Button type="submit" size="sm">{submitLabel}</Button>
              </div>
            </form>
          {:else if variant === 'withTitle'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="flex justify-end gap-2 pt-1">
              <PopoverClose>
                {#snippet child({ props })}
                  <Button variant="outline" size="sm" {...props} onclick={onCancel}>{cancelLabel}</Button>
                {/snippet}
              </PopoverClose>
              <Button size="sm" onclick={onAction}>{saveLabel}</Button>
            </div>
          {:else}
            <p class="text-sm">{description}</p>
          {/if}
        </PopoverContent>
      </Popover>
    {/if}
  {/key}
</div>
