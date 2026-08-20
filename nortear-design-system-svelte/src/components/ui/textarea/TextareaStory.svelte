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
    /** Mensagem de erro. Renderiza o <p> e liga o aria-describedby a ELE. */
    errorText?: string;
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
    errorText = '',
    counterAriaLabelTemplate = '{count} de {max} caracteres usados',
    resize = 'y',
    minHeight = 'nds-min-h-30',
    class: className = '',
    ...rest
  }: Props = $props();

  // Vocabulário `.nds-*`: as formas sem prefixo (`resize-y`, `resize-none`)
  // não existem em CSS nenhum do projeto — eram string inerte no atributo, e
  // as stories afirmavam a presença delas como se fosse comportamento.
  const resizeClass = $derived(
    resize === 'none' ? 'nds-resize-none' : resize === 'both' ? 'nds-resize' : 'nds-resize-y'
  );

  const errorId = $derived(`${id}-error`);

  const counterAriaLabel = $derived(
    counterAriaLabelTemplate
      .replace('{count}', String((value ?? '').length))
      .replace('{max}', String(maxLength ?? 0))
  );
</script>

<div class="nds-stack nds-w-cap-md" data-spacing="sm">
  <Label for={id}>{labelText}</Label>
  <Textarea
    {id}
    {placeholder}
    {disabled}
    {readonly}
    aria-invalid={ariaInvalid}
    aria-describedby={errorText ? errorId : undefined}
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
  {#if errorText}
    <p id={errorId} class="nds-text-caption nds-text-destructive">{errorText}</p>
  {/if}
</div>
