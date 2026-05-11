<script lang="ts">
  import { Textarea } from '@/components/ui/textarea';
  import { Label } from '@/components/ui/label';

  interface Props {
    id?: string;
    labelText?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    'aria-invalid'?: 'true' | 'false';
    value?: string;
    maxLength?: number;
    showCounter?: boolean;
    helpText?: string;
    counterAriaLabelTemplate?: string;
    resize?: 'y' | 'none' | 'both';
    minHeight?: string;
    class?: string;
    [key: string]: unknown;
  }

  let {
    id = 'textarea-story',
    labelText = 'Descrição',
    placeholder = '',
    disabled = false,
    readonly = false,
    'aria-invalid': ariaInvalid,
    value = $bindable(''),
    maxLength,
    showCounter = false,
    helpText = '',
    counterAriaLabelTemplate = '{count} de {max} caracteres usados',
    resize = 'y',
    minHeight = 'min-h-[120px]',
    class: className = '',
    ...rest
  }: Props = $props();

  const resizeClass = $derived(
    resize === 'none' ? 'resize-none' : resize === 'both' ? 'resize' : 'resize-y'
  );

  const counterAriaLabel = $derived(
    counterAriaLabelTemplate
      .replace('{count}', String((value ?? '').length))
      .replace('{max}', String(maxLength ?? 0))
  );
</script>

<div class="flex flex-col gap-1.5 w-80">
  <Label for={id}>{labelText}</Label>
  <Textarea
    {id}
    {placeholder}
    {disabled}
    {readonly}
    aria-invalid={ariaInvalid}
    maxlength={maxLength}
    bind:value
    class={`${resizeClass} ${minHeight} ${className}`}
    {...rest}
  />
  {#if showCounter && maxLength}
    <div class="flex justify-between text-xs text-muted-foreground">
      <span>{helpText}</span>
      <span aria-live="polite" aria-label={counterAriaLabel}>
        {(value ?? '').length}/{maxLength}
      </span>
    </div>
  {:else if helpText}
    <p class="text-xs text-muted-foreground">{helpText}</p>
  {/if}
</div>
