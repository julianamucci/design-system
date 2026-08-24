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

{#snippet buttons()}
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
{/snippet}

<!--
As duas formas do grupo são uma união DISCRIMINADA: em `multiple` o valor é uma
lista, em `single` é um texto. Passar `type` como união e `value` como união
obrigava a calar o compilador — e um `as never` no `onValueChange` fazia o
espião da aba Actions perder o próprio tipo. Ramificar estreita `type` para o
literal em cada lado, e aí o valor e o callback casam sozinhos.

`bind:` sai junto: o par valor + callback é exatamente o que ele expande, e
escrito assim o repasse ao espião da story fica explícito.
-->
{#if type === 'multiple'}
  <ToggleGroup
    type="multiple"
    value={Array.isArray(value) ? value : []}
    onValueChange={(novo) => {
      value = novo;
      onValueChange?.(novo);
    }}
    {disabled}
    {orientation}
    {variant}
    {size}
    aria-label={ariaLabel}
  >
    {@render buttons()}
  </ToggleGroup>
{:else}
  <ToggleGroup
    type="single"
    value={typeof value === 'string' ? value : ''}
    onValueChange={(novo) => {
      value = novo;
      onValueChange?.(novo);
    }}
    {disabled}
    {orientation}
    {variant}
    {size}
    aria-label={ariaLabel}
  >
    {@render buttons()}
  </ToggleGroup>
{/if}
