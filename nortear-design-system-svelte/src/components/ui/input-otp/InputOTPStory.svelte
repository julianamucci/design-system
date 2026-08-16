<script lang="ts">
  import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Variant =
    | 'default'
    | 'sixDigits'
    | 'fourDigits'
    | 'withSeparator'
    | 'alphanumeric'
    | 'withLabel'
    | 'withHelpText'
    | 'withErrorMessage'
    | 'withResendButton';

  interface Props {
    maxLength?: number;
    disabled?: boolean;
    autoFocus?: boolean;
    defaultValue?: string;
    hasError?: boolean;
    pattern?: string;
    inputmode?: 'numeric' | 'text';
    label?: string;
    helpText?: string;
    errorMessage?: string;
    variant?: Variant;
    /** Chamado quando todas as caixas estão preenchidas. */
    onComplete?: (value: string) => void;
  }

  let {
    maxLength = 6,
    disabled = false,
    autoFocus = false,
    defaultValue = '',
    hasError = false,
    pattern = undefined,
    inputmode = 'numeric',
    label = 'Código de verificação',
    helpText = '',
    errorMessage = '',
    variant = 'default',
    onComplete = undefined,
  }: Props = $props();

  let value = $derived(defaultValue);

  // Re-create the component when key inputs change so defaultValue/maxLength/pattern can update
  const renderKey = $derived(
    `${maxLength}-${disabled}-${autoFocus}-${defaultValue}-${hasError}-${pattern ?? 'none'}-${inputmode}-${variant}`
  );

  const showSeparator = $derived(variant === 'withSeparator');
  const showLabel = $derived(
    variant === 'withLabel' ||
      variant === 'withHelpText' ||
      variant === 'withErrorMessage' ||
      variant === 'withResendButton' ||
      !!label
  );
  const showHelpText = $derived(variant === 'withHelpText' && !!helpText);
  const showErrorMessage = $derived(
    (variant === 'withErrorMessage' || hasError) && !!errorMessage
  );
  const showResendButton = $derived(variant === 'withResendButton');

  const fieldId = 'otp-story-input';
  const helpId = 'otp-story-help';
  const errorId = 'otp-story-error';
  const describedBy = $derived(
    [showHelpText ? helpId : null, showErrorMessage ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined
  );
</script>

<div class="nds-stack" data-spacing="sm" style="contain: layout">
  {#if showLabel && label}
    <label for={fieldId} class="nds-text-label">{label}</label>
  {/if}

  {#key renderKey}
    {#if showSeparator}
      <InputOTP
        inputId={fieldId}
        maxlength={maxLength}
        bind:value
        {disabled}
        autofocus={autoFocus}
        {pattern}
        {inputmode}
        autocomplete="one-time-code"
        {onComplete}
        aria-label={label}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={describedBy}
      >
        {#snippet children({ cells })}
          <InputOTPGroup>
            {#each cells.slice(0, Math.ceil(maxLength / 2)) as cell, i (i)}
              <InputOTPSlot {cell} />
            {/each}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {#each cells.slice(Math.ceil(maxLength / 2)) as cell, i (i)}
              <InputOTPSlot {cell} />
            {/each}
          </InputOTPGroup>
        {/snippet}
      </InputOTP>
    {:else}
      <InputOTP
        inputId={fieldId}
        maxlength={maxLength}
        bind:value
        {disabled}
        autofocus={autoFocus}
        {pattern}
        {inputmode}
        autocomplete="one-time-code"
        {onComplete}
        aria-label={label}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={describedBy}
      >
        {#snippet children({ cells })}
          <InputOTPGroup>
            {#each cells as cell, i (i)}
              <InputOTPSlot {cell} />
            {/each}
          </InputOTPGroup>
        {/snippet}
      </InputOTP>
    {/if}
  {/key}

  {#if showHelpText && helpText}
    <p id={helpId} class="nds-text-caption nds-text-muted-foreground">{helpText}</p>
  {/if}

  {#if showErrorMessage && errorMessage}
    <!-- Sem `role="alert"`: a mensagem já está no DOM quando a página carrega,
         e uma live region em conteúdo estático faz o leitor anunciar o erro
         sem que nada tenha acontecido. -->
    <p id={errorId} class="nds-text-caption nds-text-destructive">{errorMessage}</p>
  {/if}

  {#if showResendButton}
    <div class="nds-cluster" data-align="center" data-spacing="xs">
      <span class="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
      <Button variant="link" size="sm" type="button">Reenviar código</Button>
    </div>
  {/if}
</div>
