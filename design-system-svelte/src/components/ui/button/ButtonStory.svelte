<script lang="ts">
  import { Button } from './index';
  import type { ButtonVariant, ButtonSize } from './index';
  import { Plus, Trash2, Pencil, ChevronRight, Download, Loader2 } from 'lucide-svelte';

  type IconKind = 'plus' | 'trash' | 'pencil' | 'chevron-right' | 'download' | 'loader' | 'none';

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    label?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    ariaLabel?: string;
    ariaBusy?: boolean;
    ariaInvalid?: boolean;
    iconStart?: IconKind;
    iconEnd?: IconKind;
    iconOnly?: IconKind;
    spinIcon?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = 'default',
    size = 'default',
    label = 'Botão',
    disabled = false,
    type = 'button',
    href,
    ariaLabel,
    ariaBusy,
    ariaInvalid,
    iconStart = 'none',
    iconEnd = 'none',
    iconOnly = 'none',
    spinIcon = false,
    onclick,
  }: Props = $props();

  const ICONS = {
    plus: Plus,
    trash: Trash2,
    pencil: Pencil,
    'chevron-right': ChevronRight,
    download: Download,
    loader: Loader2,
  } as const;

  const StartIcon = $derived(iconStart !== 'none' ? ICONS[iconStart] : null);
  const EndIcon = $derived(iconEnd !== 'none' ? ICONS[iconEnd] : null);
  const OnlyIcon = $derived(iconOnly !== 'none' ? ICONS[iconOnly] : null);
</script>

<Button
  {variant}
  {size}
  {type}
  {disabled}
  {href}
  aria-label={ariaLabel}
  aria-busy={ariaBusy ? 'true' : undefined}
  aria-invalid={ariaInvalid ? 'true' : undefined}
  {onclick}
>
  {#if OnlyIcon}
    <OnlyIcon class={spinIcon ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
  {:else}
    {#if StartIcon}
      <StartIcon class={spinIcon ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
    {/if}
    {label}
    {#if EndIcon}
      <EndIcon class="h-4 w-4" aria-hidden="true" />
    {/if}
  {/if}
</Button>
