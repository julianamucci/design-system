<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from './index';
  import {
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Bold, Italic, Underline,
    LayoutGrid, List,
  } from 'lucide-svelte';

  type GroupKind = 'alignment' | 'formatting' | 'view';

  interface Item {
    value: string;
    ariaLabel: string;
    icon: 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify' | 'bold' | 'italic' | 'underline' | 'grid' | 'list';
    disabled?: boolean;
  }

  interface Props {
    type?: 'single' | 'multiple';
    value?: string | string[];
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
    spacing?: number;
    ariaLabel?: string;
    kind?: GroupKind;
    items?: Item[];
  }

  let {
    type = 'single',
    value = $bindable(),
    disabled = false,
    orientation = 'horizontal',
    variant = 'default',
    size = 'default',
    spacing = 0,
    ariaLabel = 'Alinhamento do texto',
    kind = 'alignment',
    items,
  }: Props = $props();

  const iconMap = {
    alignLeft: AlignLeft,
    alignCenter: AlignCenter,
    alignRight: AlignRight,
    alignJustify: AlignJustify,
    bold: Bold,
    italic: Italic,
    underline: Underline,
    grid: LayoutGrid,
    list: List,
  } as const;

  const defaultItems: Record<GroupKind, Item[]> = {
    alignment: [
      { value: 'left', ariaLabel: 'Alinhar à esquerda', icon: 'alignLeft' },
      { value: 'center', ariaLabel: 'Centralizar', icon: 'alignCenter' },
      { value: 'right', ariaLabel: 'Alinhar à direita', icon: 'alignRight' },
    ],
    formatting: [
      { value: 'bold', ariaLabel: 'Negrito', icon: 'bold' },
      { value: 'italic', ariaLabel: 'Itálico', icon: 'italic' },
      { value: 'underline', ariaLabel: 'Sublinhado', icon: 'underline' },
    ],
    view: [
      { value: 'grid', ariaLabel: 'Grade', icon: 'grid' },
      { value: 'list', ariaLabel: 'Lista', icon: 'list' },
    ],
  };

  const resolvedItems = $derived(items ?? defaultItems[kind]);

  // Initialize value default based on type if not provided.
  $effect(() => {
    if (value === undefined) {
      value = type === 'multiple' ? [] : '';
    }
  });
</script>

<ToggleGroup
  {type}
  bind:value
  {disabled}
  {orientation}
  {variant}
  {size}
  {spacing}
  aria-label={ariaLabel}
>
  {#each resolvedItems as item (item.value)}
    <ToggleGroupItem
      value={item.value}
      disabled={item.disabled || undefined}
      aria-label={item.ariaLabel}
    >
      {@const IconCmp = iconMap[item.icon]}
      <IconCmp aria-hidden="true" />
    </ToggleGroupItem>
  {/each}
</ToggleGroup>
