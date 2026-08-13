<script lang="ts">
  import { Checkbox } from './index';
  import { Label } from '@/components/ui/label';

  interface Props {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    ariaInvalid?: boolean;
    withLabel?: boolean;
    withDescription?: boolean;
    labelText?: string;
    descriptionText?: string;
    id?: string;
    name?: string;
    value?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    disabled = false,
    ariaInvalid = false,
    withLabel = false,
    withDescription = false,
    labelText = 'Aceito os termos e condições',
    descriptionText = 'Ao marcar esta opção, você concorda com os termos de uso.',
    id = 'checkbox-story',
    name = undefined,
    value = undefined,
    onCheckedChange = undefined,
  }: Props = $props();
</script>

{#if withDescription}
  <div class="nds-cluster" data-spacing="sm" data-disabled={disabled ? 'true' : undefined}>
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      {name}
      {value}
      {onCheckedChange}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-description"
      class="nds-mt-0-5"
    />
    <div class="nds-stack" data-spacing="xs">
      <Label id="{id}-label" for={id}>
        {labelText}
      </Label>
      <p id="{id}-description" class="nds-text-body">{descriptionText}</p>
    </div>
  </div>
{:else if withLabel}
  <div class="nds-cluster" data-spacing="sm" data-disabled={disabled ? 'true' : undefined}>
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      {name}
      {value}
      {onCheckedChange}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
    />
    <Label id="{id}-label" for={id}>
      {labelText}
    </Label>
  </div>
{:else}
  <Checkbox
    {id}
    bind:checked
    bind:indeterminate
    {disabled}
    {name}
    {value}
    {onCheckedChange}
    aria-invalid={ariaInvalid || undefined}
    aria-label={labelText}
  />
{/if}
