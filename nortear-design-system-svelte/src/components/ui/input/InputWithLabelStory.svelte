<script lang="ts">
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  interface Props {
    labelText?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    'aria-invalid'?: 'true' | 'false';
    hint?: string;
    errorMessage?: string;
    id?: string;
  }

  let {
    labelText = 'Email',
    type = 'email',
    placeholder = 'ex: joao@empresa.com',
    disabled = false,
    'aria-invalid': ariaInvalid,
    hint = '',
    errorMessage = '',
    id = 'input-field',
  }: Props = $props();

  const hintId = $derived(`${id}-hint`);
  const errorId = $derived(`${id}-error`);
  const describedBy = $derived([hint ? hintId : '', errorMessage ? errorId : ''].filter(Boolean).join(' ') || undefined);
</script>

<!-- `nds-w-xs` no lugar de `style="width: 16rem"`: inline vence a folha e tirava
     o andaime do tema, da densidade e da escala de fonte. -->
<div class="nds-stack nds-w-xs" data-spacing="xs">
  <Label for={id}>{labelText}</Label>
  <Input
    {id}
    {type}
    {placeholder}
    {disabled}
    aria-invalid={ariaInvalid}
    aria-describedby={describedBy}
  />
  {#if hint}
    <p id={hintId} class="nds-text-body">{hint}</p>
  {/if}
  {#if errorMessage}
    <p id={errorId} class="nds-text-body nds-text-destructive">{errorMessage}</p>
  {/if}
</div>
