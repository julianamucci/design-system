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
    onValueChange?: (value: string) => void;
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
    onValueChange = undefined,
  }: Props = $props();

  // O layout sai do próprio `.nds-radio-group`: empilhado por padrão, em linha
  // quando `aria-orientation="horizontal"`. As classes que estavam aqui
  // (`flex flex-wrap gap-6` / `grid gap-2 w-72`) eram do framework utilitário
  // que saiu do projeto — não existiam mais no CSS, e a variante horizontal
  // renderizava empilhada enquanto o teste só conferia o atributo ARIA.
</script>

<RadioGroup
  bind:value
  {disabled}
  {orientation}
  {name}
  {onValueChange}
  aria-label={ariaLabel}
  aria-orientation={orientation}
  aria-invalid={ariaInvalid || undefined}
  class={className}
>
  {#each options as opt (opt.value)}
    {@const id = `${idPrefix}-${opt.value}`}
    {#if withDescription}
      <div class="nds-cluster" data-align="start" data-spacing="sm">
        <RadioGroupItem
          value={opt.value}
          {id}
          disabled={opt.disabled || undefined}
          aria-describedby={opt.description ? `${id}-desc` : undefined}
          class="nds-mt-1"
        />
        <div class="nds-stack" data-spacing="xs">
          <Label for={id}>{opt.label}</Label>
          {#if opt.description}
            <p id="{id}-desc" class="nds-text-caption nds-text-muted-foreground">{opt.description}</p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="nds-cluster" data-spacing="sm">
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
