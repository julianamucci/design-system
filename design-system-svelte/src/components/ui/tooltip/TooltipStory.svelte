<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Save, Trash2, Share2 } from 'lucide-svelte';

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

  let {
    side = 'top',
    align = 'center',
    sideOffset = 4,
    delayDuration = 0,
    defaultOpen = false,
    open = $bindable(undefined),
    triggerLabel = 'Salvar',
    ariaLabel = 'Salvar',
    contentText = 'Salvar (Ctrl+S)',
    variant = 'default',
  }: Props = $props();
</script>

<div style="contain: layout; padding: 2.5rem 1rem;">
  <TooltipProvider {delayDuration}>
    {#key `${side}-${align}-${sideOffset}-${defaultOpen}-${variant}-${delayDuration}`}
      {#if open !== undefined}
        <Tooltip bind:open>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={ariaLabel} {...props}>
                {#if variant === 'longText'}
                  <Share2 aria-hidden="true" class="size-4" />
                {:else if triggerLabel.toLowerCase().includes('excluir') || triggerLabel.toLowerCase().includes('delete') || triggerLabel.toLowerCase().includes('eliminar')}
                  <Trash2 aria-hidden="true" class="size-4" />
                {:else}
                  <Save aria-hidden="true" class="size-4" />
                {/if}
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent {side} {align} {sideOffset}>
            {#if variant === 'withShortcut'}
              <span>{contentText.replace(/\s*\([^)]*\)\s*$/, '')}</span>
              <kbd data-slot="kbd" class="bg-background/15 text-background ml-1 inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">Ctrl</kbd>
              <kbd data-slot="kbd" class="bg-background/15 text-background inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">S</kbd>
            {:else if variant === 'longText'}
              {contentText}
            {:else}
              {contentText}
            {/if}
          </TooltipContent>
        </Tooltip>
      {:else}
        <Tooltip {defaultOpen}>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon" aria-label={ariaLabel} {...props}>
                {#if variant === 'longText'}
                  <Share2 aria-hidden="true" class="size-4" />
                {:else if triggerLabel.toLowerCase().includes('excluir') || triggerLabel.toLowerCase().includes('delete') || triggerLabel.toLowerCase().includes('eliminar')}
                  <Trash2 aria-hidden="true" class="size-4" />
                {:else}
                  <Save aria-hidden="true" class="size-4" />
                {/if}
              </Button>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent {side} {align} {sideOffset}>
            {#if variant === 'withShortcut'}
              <span>{contentText.replace(/\s*\([^)]*\)\s*$/, '')}</span>
              <kbd data-slot="kbd" class="bg-background/15 text-background ml-1 inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">Ctrl</kbd>
              <kbd data-slot="kbd" class="bg-background/15 text-background inline-flex h-4 items-center rounded px-1 text-[10px] font-medium">S</kbd>
            {:else if variant === 'longText'}
              {contentText}
            {:else}
              {contentText}
            {/if}
          </TooltipContent>
        </Tooltip>
      {/if}
    {/key}
  </TooltipProvider>
</div>
