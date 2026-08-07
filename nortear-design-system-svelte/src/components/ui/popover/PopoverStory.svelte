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
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    defaultOpen = false,
    open = $bindable(defaultOpen),
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
              class="nds-grid" data-spacing="sm" style="padding-top: 0.25rem"
              onsubmit={(e) => {
                e.preventDefault();
                onAction?.();
              }}
            >
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">{nameLabel}</span>
                <input
                  type="text"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="Maria Silva"
                />
              </label>
              <label class="nds-grid nds-text-body" data-spacing="xs">
                <span class="nds-text-foreground">{emailLabel}</span>
                <input
                  type="email"
                  class="nds-bg-background nds-border-default nds-border-default nds-text-body" style="border-radius: var(--radius-input); height: var(--height-default); padding-inline: 0.75rem" 
                  value="maria@exemplo.com"
                />
              </label>
              <div class="nds-cluster" data-justify="end" style="padding-top: 0.25rem">
                <Button type="submit" size="sm">{submitLabel}</Button>
              </div>
            </form>
          {:else if variant === 'withTitle'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="nds-cluster" data-justify="end" data-spacing="sm" style="padding-top: 0.25rem">
              <PopoverClose>
                {#snippet child({ props })}
                  <Button variant="outline" size="sm" {...props} onclick={onCancel}>{cancelLabel}</Button>
                {/snippet}
              </PopoverClose>
              <Button size="sm" onclick={onAction}>{saveLabel}</Button>
            </div>
          {:else}
            <p class="nds-text-body">{description}</p>
          {/if}
        </PopoverContent>
      </Popover>
  {/key}
</div>
