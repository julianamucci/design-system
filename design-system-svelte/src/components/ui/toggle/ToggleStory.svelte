<script lang="ts">
  import { Toggle } from './index';
  import { Bold, Italic, Underline, List, Eye, LayoutGrid } from 'lucide-svelte';

  type IconKey = 'bold' | 'italic' | 'underline' | 'list' | 'eye' | 'layout';

  interface Props {
    pressed?: boolean;
    disabled?: boolean;
    ariaInvalid?: boolean;
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
    icon?: IconKey;
    label?: string;
    ariaLabel?: string;
    withLabel?: boolean;
  }

  let {
    pressed = $bindable(false),
    disabled = false,
    ariaInvalid = false,
    variant = 'default',
    size = 'default',
    icon = 'bold',
    label = 'Negrito',
    ariaLabel,
    withLabel = false,
  }: Props = $props();

  const iconMap = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    list: List,
    eye: Eye,
    layout: LayoutGrid,
  } as const;

  const IconCmp = $derived(iconMap[icon]);
  const computedAriaLabel = $derived(withLabel ? undefined : (ariaLabel ?? label));
</script>

<Toggle
  bind:pressed
  {variant}
  {size}
  {disabled}
  aria-label={computedAriaLabel}
  aria-invalid={ariaInvalid || undefined}
>
  <IconCmp aria-hidden="true" />
  {#if withLabel}
    <span>{label}</span>
  {/if}
</Toggle>
