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
  }: Props = $props();
</script>

{#if withDescription}
  <div class="flex items-center justify-between w-80 gap-4">
    <div class="flex flex-col gap-0.5">
      <Label id="{id}-label" for={id} class="text-sm font-medium leading-none">
        {labelText}
      </Label>
      <p id="{id}-description" class="text-sm text-muted-foreground">{descriptionText}</p>
    </div>
    <Switch
      {id}
      bind:checked
      {disabled}
      {size}
      {name}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
      aria-describedby="{id}-description"
    />
  </div>
{:else if withLabel}
  <div class="flex items-center gap-2">
    <Switch
      {id}
      bind:checked
      {disabled}
      {size}
      {name}
      aria-invalid={ariaInvalid || undefined}
      aria-labelledby="{id}-label"
    />
    <Label id="{id}-label" for={id} class="text-sm font-medium leading-none">
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
    aria-invalid={ariaInvalid || undefined}
    aria-label={ariaLabel}
  />
{/if}
