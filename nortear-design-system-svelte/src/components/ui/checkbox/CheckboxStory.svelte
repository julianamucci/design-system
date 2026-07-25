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
  }: Props = $props();
</script>

{#if withDescription}
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-description"
      class="nds-mt-0-5"
    />
    <div class="nds-stack" data-spacing="xs">
      <Label id="{id}-label" for={id} class="nds-peer-label nds-text-body nds-font-medium" style="line-height: 1">
        {labelText}
      </Label>
      <p id="{id}-description" class="nds-text-body">{descriptionText}</p>
    </div>
  </div>
{:else if withLabel}
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
    />
    <Label id="{id}-label" for={id} class="nds-peer-label nds-text-body nds-font-medium" style="line-height: 1">
      {labelText}
    </Label>
  </div>
{:else}
  <Checkbox
    {id}
    bind:checked
    bind:indeterminate
    {disabled}
    aria-invalid={ariaInvalid || undefined}
    aria-label={labelText}
  />
{/if}
