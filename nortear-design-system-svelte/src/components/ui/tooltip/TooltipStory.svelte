<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';
  import Save from '@lucide/svelte/icons/save';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Share2 from '@lucide/svelte/icons/share-2';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant = 'default' | 'withShortcut' | 'longText';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    delayDuration?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    ariaLabel?: string;
    contentText?: string;
    variant?: Variant;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'top',
    align = 'center',
    sideOffset = 4,
    delayDuration = 0,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = 'Salvar',
    ariaLabel = 'Salvar',
    contentText = 'Salvar (Ctrl+S)',
    variant = 'default',
  }: Props = $props();
</script>

<div style="contain: layout; padding: 2.5rem 1rem;">
  <TooltipProvider {delayDuration}>
    {#key `${side}-${align}-${sideOffset}-${defaultOpen}-${variant}-${delayDuration}`}
        <Tooltip bind:open>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={ariaLabel} {...props}>
                {#if variant === 'longText'}
                  <Share2 aria-hidden="true" class="nds-size-4" />
                {:else if triggerLabel.toLowerCase().includes('excluir') || triggerLabel.toLowerCase().includes('delete') || triggerLabel.toLowerCase().includes('eliminar')}
                  <Trash2 aria-hidden="true" class="nds-size-4" />
                {:else}
                  <Save aria-hidden="true" class="nds-size-4" />
                {/if}
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent {side} {align} {sideOffset}>
            {#if variant === 'withShortcut'}
              <span>{contentText.replace(/\s*\([^)]*\)\s*$/, '')}</span>
              <kbd data-slot="kbd" class="nds-cluster nds-bg-background-15 text-background nds-rounded nds-px-1 nds-font-medium" data-align="center" style="margin-left: 0.25rem; height: 1rem; font-size: 10px">Ctrl</kbd>
              <kbd data-slot="kbd" class="nds-cluster nds-bg-background-15 text-background nds-rounded nds-px-1 nds-font-medium" data-align="center" style="height: 1rem; font-size: 10px">S</kbd>
            {:else if variant === 'longText'}
              {contentText}
            {:else}
              {contentText}
            {/if}
          </TooltipContent>
        </Tooltip>
    {/key}
  </TooltipProvider>
</div>
