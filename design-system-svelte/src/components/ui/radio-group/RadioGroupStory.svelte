<script lang="ts">
  import { RadioGroup, RadioGroupItem } from './index';
  import { Label } from '@/components/ui/label';

  interface Option {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }

  interface Props {
    value?: string;
    disabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
    name?: string;
    ariaInvalid?: boolean;
    ariaLabel?: string;
    options?: Option[];
    withDescription?: boolean;
    idPrefix?: string;
    class?: string;
  }

  let {
    value = $bindable(''),
    disabled = false,
    orientation = 'vertical',
    name = undefined,
    ariaInvalid = false,
    ariaLabel = 'Forma de pagamento',
    options = [
      { value: 'cartao', label: 'Cartão de crédito' },
      { value: 'pix', label: 'Pix' },
      { value: 'boleto', label: 'Boleto bancário' },
    ],
    withDescription = false,
    idPrefix = 'rg-story',
    class: className = '',
  }: Props = $props();

  const containerClass = $derived(
    orientation === 'horizontal'
      ? `flex flex-wrap gap-6 ${className}`
      : `grid gap-2 w-72 ${className}`,
  );
</script>

<RadioGroup
  bind:value
  {disabled}
  {orientation}
  {name}
  aria-label={ariaLabel}
  aria-orientation={orientation}
  aria-invalid={ariaInvalid || undefined}
  class={containerClass}
>
  {#each options as opt (opt.value)}
    {@const id = `${idPrefix}-${opt.value}`}
    {#if withDescription}
      <div class="flex items-start gap-2">
        <RadioGroupItem
          value={opt.value}
          {id}
          disabled={opt.disabled || undefined}
          aria-describedby={opt.description ? `${id}-desc` : undefined}
          class="mt-1"
        />
        <div class="flex flex-col gap-0.5">
          <Label for={id}>{opt.label}</Label>
          {#if opt.description}
            <p id="{id}-desc" class="text-xs text-muted-foreground">{opt.description}</p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex items-center gap-2">
        <RadioGroupItem
          value={opt.value}
          {id}
          disabled={opt.disabled || undefined}
        />
        <Label for={id}>{opt.label}</Label>
      </div>
    {/if}
  {/each}
</RadioGroup>
