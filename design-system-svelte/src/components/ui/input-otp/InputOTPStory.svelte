<script lang="ts">
  import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
  } from './index';

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
  }: Props = $props();

  let value = $state(defaultValue);

  // Re-create the component when key inputs change so defaultValue/maxLength/pattern can update
  const renderKey = $derived(
    `${maxLength}-${disabled}-${autoFocus}-${defaultValue}-${hasError}-${pattern ?? 'none'}-${inputmode}-${variant}`
  );

  $effect(() => {
    // sync value when defaultValue changes
    value = defaultValue;
  });

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

<div class="space-y-2" style="contain: layout">
  {#if showLabel && label}
    <label for={fieldId} class="text-sm font-medium block">{label}</label>
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
    <p id={helpId} class="text-xs text-muted-foreground">{helpText}</p>
  {/if}

  {#if showErrorMessage && errorMessage}
    <p id={errorId} class="text-xs text-destructive" role="alert">{errorMessage}</p>
  {/if}

  {#if showResendButton}
    <button
      type="button"
      class="text-xs text-primary underline-offset-4 hover:underline"
    >
      Reenviar código
    </button>
  {/if}
</div>
