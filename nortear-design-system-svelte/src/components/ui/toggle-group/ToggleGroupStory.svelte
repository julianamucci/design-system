<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from './index';
  import AlignLeft from '@lucide/svelte/icons/text-align-start';
  import AlignCenter from '@lucide/svelte/icons/text-align-center';
  import AlignRight from '@lucide/svelte/icons/text-align-end';
  import AlignJustify from '@lucide/svelte/icons/text-align-justify';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import List from '@lucide/svelte/icons/list';

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
    /** Sem repassar, o `fn()` da story ficava ligado a nada e a aba Actions
     *  nascia vazia — o espião existia e nenhum clique chegava nele. */
    onValueChange?: (value: string | string[]) => void;
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
    onValueChange,
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
  onValueChange={onValueChange as never}
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
