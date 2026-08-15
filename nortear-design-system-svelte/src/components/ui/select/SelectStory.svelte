<script lang="ts">
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectGroupHeading,
    SelectSeparator,
  } from './index';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';

  type Variant = 'default' | 'withGroups' | 'withIcon';
  type Size = 'default' | 'sm';

  interface Option {
    value: string;
    label: string;
  }

  interface Group {
    label: string;
    options: Option[];
  }

  interface Props {
    value?: string;
    disabled?: boolean;
    name?: string;
    size?: Size;
    placeholder?: string;
    ariaLabel?: string;
    ariaInvalid?: boolean;
    variant?: Variant;
    triggerClass?: string;
    options?: Option[];
    groups?: Group[];
    onValueChange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    disabled = false,
    name = undefined,
    size = 'default',
    placeholder = 'Selecione...',
    ariaLabel = 'Selecionar estado',
    ariaInvalid = false,
    variant = 'default',
    // Vazio de propósito: `w-56` era classe do framework utilitário que saiu do
    // projeto — não existe em folha nenhuma e não largava o campo. A largura do
    // gatilho é `fit-content` por padrão, igual às outras stacks.
    triggerClass = '',
    options = [
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
      { value: 'mg', label: 'Minas Gerais' },
      { value: 'es', label: 'Espírito Santo' },
    ],
    groups = [
      {
        label: 'Sudeste',
        options: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais' },
          { value: 'es', label: 'Espírito Santo' },
        ],
      },
      {
        label: 'Sul',
        options: [
          { value: 'rs', label: 'Rio Grande do Sul' },
          { value: 'sc', label: 'Santa Catarina' },
          { value: 'pr', label: 'Paraná' },
        ],
      },
    ],
    onValueChange,
  }: Props = $props();

  const selectedLabel = $derived.by(() => {
    if (!value) return '';
    if (variant === 'withGroups') {
      for (const g of groups) {
        const found = g.options.find((o) => o.value === value);
        if (found) return found.label;
      }
      return '';
    }
    return options.find((o) => o.value === value)?.label ?? '';
  });
</script>

<div style="contain: layout">
  <Select
    type="single"
    bind:value
    {disabled}
    {name}
    {onValueChange}
  >
    <SelectTrigger
      {size}
      class={triggerClass}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
    >
      {#if selectedLabel}
        <span>{selectedLabel}</span>
      {:else}
        <span class="nds-text-muted-foreground">{placeholder}</span>
      {/if}
    </SelectTrigger>
    <SelectContent>
      {#if variant === 'withGroups'}
        {#each groups as group, i (group.label)}
          <SelectGroup>
            <SelectGroupHeading>{group.label}</SelectGroupHeading>
            {#each group.options as opt (opt.value)}
              <SelectItem value={opt.value} label={opt.label} />
            {/each}
          </SelectGroup>
          {#if i < groups.length - 1}
            <SelectSeparator />
          {/if}
        {/each}
      {:else if variant === 'withIcon'}
        {#each options as opt (opt.value)}
          <SelectItem value={opt.value} label={opt.label}>
            <MapPinIcon class="nds-size-4 nds-text-muted-foreground" />
            <span>{opt.label}</span>
          </SelectItem>
        {/each}
      {:else}
        {#each options as opt (opt.value)}
          <SelectItem value={opt.value} label={opt.label} />
        {/each}
      {/if}
    </SelectContent>
  </Select>
</div>
