<script lang="ts">
  import { Switch } from './index';
  import { Label } from '@/components/ui/label';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    ariaInvalid?: boolean;
    ariaLabel?: string;
    size?: 'default' | 'sm';
    withLabel?: boolean;
    withDescription?: boolean;
    labelText?: string;
    descriptionText?: string;
    id?: string;
    name?: string;
    /**
     * Encaminhado ao primitivo. Sem esta passagem o espião declarado em `args`
     * não alcança o componente e a aba Actions fica vazia — a play acusaria o
     * primitivo por um fio que nunca foi ligado.
     */
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    ariaInvalid = false,
    ariaLabel = 'Alternar',
    size = 'default',
    withLabel = true,
    withDescription = false,
    labelText = 'Receber notificações por email',
    descriptionText = 'Receba novidades e promoções da plataforma.',
    id = 'switch-story',
    name = undefined,
    onCheckedChange = undefined,
  }: Props = $props();
</script>

{#if withDescription}
  <!-- Largura pela utility `.nds-w-sm`, não por `style` inline: inline vence a
       folha e a medida sai do tema, da densidade e da escala. -->
  <div class="nds-cluster nds-w-sm" data-align="center" data-justify="between" data-spacing="md">
    <div class="nds-stack" data-spacing="xs">
      <Label id="{id}-label" for={id} class="nds-text-body nds-font-medium">
        {labelText}
      </Label>
      <p id="{id}-description" class="nds-text-body">{descriptionText}</p>
    </div>
    <Switch
      {id}
      bind:checked
      {disabled}
      {size}
      {name}
      {onCheckedChange}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-description"
    />
  </div>
{:else if withLabel}
  <div class="nds-cluster" data-spacing="sm">
    <Switch
      {id}
      bind:checked
      {disabled}
      {size}
      {name}
      {onCheckedChange}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
    />
    <Label id="{id}-label" for={id} class="nds-text-body nds-font-medium">
      {labelText}
    </Label>
  </div>
{:else}
  <Switch
    {id}
    bind:checked
    {disabled}
    {size}
    {name}
    {onCheckedChange}
    aria-invalid={ariaInvalid || undefined}
    aria-label={ariaLabel}
  />
{/if}
