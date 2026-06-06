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
  <div class="flex gap-3">
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-description"
      class="mt-0.5"
    />
    <div class="flex flex-col gap-1">
      <Label id="{id}-label" for={id} class="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium leading-none">
        {labelText}
      </Label>
      <p id="{id}-description" class="text-sm text-muted-foreground">{descriptionText}</p>
    </div>
  </div>
{:else if withLabel}
  <div class="flex items-center gap-2">
    <Checkbox
      {id}
      bind:checked
      bind:indeterminate
      {disabled}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
    />
    <Label id="{id}-label" for={id} class="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium leading-none">
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
