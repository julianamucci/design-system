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

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', errorMessage ? errorId : ''].filter(Boolean).join(' ') || undefined;
</script>

<div class="flex flex-col gap-1.5 w-64">
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
    <p id={hintId} class="text-sm text-muted-foreground">{hint}</p>
  {/if}
  {#if errorMessage}
    <p id={errorId} class="text-sm text-destructive">{errorMessage}</p>
  {/if}
</div>
