import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputOTPOptions = {
  length: number;
  /** Insert a separator after these indices (0-based). Pass a string for custom separator text, or an array of slot indices. */
  separator?: string | number[];
  onComplete?: (value: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  class?: string;
};

// ─── createInputOTP ───────────────────────────────────────────────────────────

export function createInputOTP(options: InputOTPOptions): HTMLElement {
  const { length, separator, onComplete, onValueChange, disabled = false } = options;

  const separatorIndices: Set<number> = new Set(
    Array.isArray(separator) ? separator : []
  );
  const separatorChar = typeof separator === 'string' ? separator : '—';

  const root = document.createElement('div');
  root.dataset.slot = 'input-otp';
  root.className = cn('flex items-center gap-2', options.class);
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'One-time password input');

  const inputs: HTMLInputElement[] = [];

  function getValue(): string {
    return inputs.map((i) => i.value).join('');
  }

  function buildInput(index: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.disabled = disabled;
    input.setAttribute('aria-label', `Digit ${index + 1}`);
    input.className = cn(
      'relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all text-center',
      'first:rounded-l-md first:border-l last:rounded-r-md',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    );

    input.addEventListener('focus', () => {
      input.select();
      input.classList.add('ring-1', 'ring-ring');
    });

    input.addEventListener('blur', () => {
      input.classList.remove('ring-1', 'ring-ring');
    });

    input.addEventListener('input', (e) => {
      const raw = (e.target as HTMLInputElement).value;
      // Keep only the last character
      input.value = raw.slice(-1);

      onValueChange?.(getValue());

      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }

      const val = getValue();
      if (val.length === length) {
        onComplete?.(val);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (input.value) {
          input.value = '';
          onValueChange?.(getValue());
        } else if (index > 0) {
          inputs[index - 1].focus();
          inputs[index - 1].value = '';
          onValueChange?.(getValue());
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        e.preventDefault();
        inputs[index + 1].focus();
      } else if (e.key === 'Delete') {
        input.value = '';
        onValueChange?.(getValue());
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
      pasted.split('').forEach((char, i) => {
        if (index + i < inputs.length) {
          inputs[index + i].value = char;
        }
      });
      const nextEmpty = inputs.findIndex((inp) => !inp.value);
      const focusIdx = nextEmpty === -1 ? inputs.length - 1 : nextEmpty;
      inputs[focusIdx].focus();
      onValueChange?.(getValue());
      const val = getValue();
      if (val.length === length) onComplete?.(val);
    });

    return input;
  }

  for (let i = 0; i < length; i++) {
    // Add separator before this slot if configured
    if (separatorIndices.has(i)) {
      const sep = document.createElement('div');
      sep.className = 'flex items-center justify-center text-muted-foreground select-none';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = separatorChar;
      root.appendChild(sep);
    }

    const input = buildInput(i);
    inputs.push(input);
    root.appendChild(input);
  }

  return root;
}
