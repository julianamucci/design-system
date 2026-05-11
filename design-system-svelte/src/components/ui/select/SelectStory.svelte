<script lang="ts">
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectGroupHeading,
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
    triggerClass = 'w-56',
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
        <span class="text-muted-foreground">{placeholder}</span>
      {/if}
    </SelectTrigger>
    <SelectContent>
      {#if variant === 'withGroups'}
        {#each groups as group (group.label)}
          <SelectGroup>
            <SelectGroupHeading>{group.label}</SelectGroupHeading>
            {#each group.options as opt (opt.value)}
              <SelectItem value={opt.value} label={opt.label} />
            {/each}
          </SelectGroup>
        {/each}
      {:else if variant === 'withIcon'}
        {#each options as opt (opt.value)}
          <SelectItem value={opt.value} label={opt.label}>
            {#snippet children()}
              <MapPinIcon class="size-4 text-muted-foreground" />
              <span>{opt.label}</span>
            {/snippet}
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
