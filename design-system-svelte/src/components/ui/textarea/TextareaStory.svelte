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

<div class="nds-stack" data-spacing="xs" style="width: 20rem">
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
    <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
      <span>{helpText}</span>
      <span aria-live="polite" aria-label={counterAriaLabel}>
        {(value ?? '').length}/{maxLength}
      </span>
    </div>
  {:else if helpText}
    <p class="nds-text-caption nds-text-muted-foreground">{helpText}</p>
  {/if}
</div>
