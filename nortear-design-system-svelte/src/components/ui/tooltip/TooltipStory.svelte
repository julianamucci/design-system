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

<div class="nds-p-8" style="contain: layout;">
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
              <!-- `.nds-kbd` + `data-slot="kbd"`: a classe é a do design system
                   (as anteriores — `text-background`, altura e corpo cravados em
                   style inline — saíram da folha na migração e não pintavam
                   nada), e o `data-slot` é o que faz
                   `.nds-tooltip-content:has([data-slot="kbd"])` encurtar o
                   respiro à direita do balão. -->
              <kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>
              <kbd data-slot="kbd" class="nds-kbd">S</kbd>
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
