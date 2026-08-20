// ─── InputOTP — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-input-otp-* (standalone).
// Comportamento: foco automático, paste distribuído, navegação Arrow/Backspace.
//
// Um `<input maxlength="1">` por dígito. Sem lib: o que está aqui é o que o
// design system define, e é a referência de markup e de classes das demais.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

/** Conjunto de caracteres aceitos. Decide também o teclado do dispositivo. */
export type InputOtpMode = 'numeric' | 'alphanumeric';

export type InputOTPOptions = {
  length: number;
  /**
   * Conjunto aceito; `alphanumeric` também troca o teclado para texto.
   *
   * O filtro é do componente, não do teclado: `inputmode` é só uma dica de
   * software, e num teclado físico a letra entrava num código de seis dígitos
   * sem nada recusá-la.
   */
  mode?: InputOtpMode;
  /** Índices ANTES dos quais entra um separador — `[3]` num código de 6 dá 3+3. */
  separatorAt?: number[];
  /** Texto do separador. Travessão por padrão. */
  separatorChar?: string;
  /** Valor inicial, distribuído da esquerda para a direita. */
  value?: string;
  onComplete?: (value: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Marca todos os slots com `aria-invalid` — pinta a borda de erro. */
  invalid?: boolean;
  /** Id do texto de ajuda ou de erro, aplicado a cada slot. */
  describedBy?: string;
  /** Foca o primeiro slot ao montar. */
  autoFocus?: boolean;
  /**
   * Vai no PRIMEIRO slot; os demais recebem `off`. `one-time-code` é o que
   * aciona o autofill de SMS no iOS e no Android — repetir nos seis faria o
   * navegador oferecer o mesmo código seis vezes.
   */
  autocomplete?: string;
  /** Nome acessível do CONJUNTO, anunciado ao entrar no campo. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  ariaLabel?: string;
  /** Prefixo do nome de cada slot: "Dígito 1", "Dígito 2"… */
  digitLabel?: string;
  class?: string;
};

// ─── createInputOTP ───────────────────────────────────────────────────────────

export function createInputOTP(options: InputOTPOptions): HTMLElement {
  const {
    length,
    mode = 'numeric',
    separatorAt = [],
    separatorChar = '—',
    value = '',
    onComplete,
    onValueChange,
    disabled = false,
    invalid = false,
    describedBy,
    autoFocus = false,
    autocomplete = 'one-time-code',
    digitLabel = 'Dígito',
  } = options;

  // `ariaLabel` continua aceito como apelido; o canônico vence quando vêm os dois.
  const ariaLabel = options['aria-label'] ?? options.ariaLabel ?? 'Código de verificação';

  const separatorIndices: Set<number> = new Set(separatorAt);
  const aceito = mode === 'alphanumeric' ? /^[a-zA-Z0-9]$/ : /^[0-9]$/;
  const inputMode = mode === 'alphanumeric' ? 'text' : 'numeric';

  const root = document.createElement('div');
  root.dataset.slot = 'input-otp';
  root.className = cn('nds-input-otp', options.class);
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', ariaLabel);

  const inputs: HTMLInputElement[] = [];

  function getValue(): string {
    return inputs.map((i) => i.value).join('');
  }

  function buildInput(index: number): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = inputMode;
    input.maxLength = 1;
    input.disabled = disabled;
    input.value = value[index] ?? '';
    // Só o primeiro slot pede o código do SMS ao sistema; nos demais a oferta
    // se repetiria seis vezes com o mesmo código.
    input.setAttribute('autocomplete', index === 0 ? autocomplete : 'off');
    input.setAttribute('aria-label', `${digitLabel} ${index + 1}`);
    if (invalid) input.setAttribute('aria-invalid', 'true');
    if (describedBy) input.setAttribute('aria-describedby', describedBy);
    input.className = 'nds-input-otp-slot';
    input.dataset.slot = 'input-otp-slot';

    input.addEventListener('focus', () => {
      input.select();
    });

    input.addEventListener('input', (e) => {
      const raw = (e.target as HTMLInputElement).value;
      // Só o último caractere, e só se pertencer ao conjunto aceito. O
      // navegador já aceitou os dois no DOM, então normalizar aqui é o que
      // impede o campo de ficar com o que foi recusado.
      const aceitos = [...raw].filter((c) => aceito.test(c));
      input.value = aceitos.at(-1) ?? '';

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
        e.preventDefault();
        // Apagar e voltar num toque só: parar no slot recém-esvaziado custaria
        // dois toques por dígito para refazer o código, que é sempre o que se
        // refaz.
        if (input.value) {
          input.value = '';
        } else if (index > 0) {
          inputs[index - 1].value = '';
        }
        onValueChange?.(getValue());
        if (index > 0) inputs[index - 1].focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        e.preventDefault();
        inputs[index + 1].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        inputs[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        inputs[inputs.length - 1].focus();
      } else if (e.key === 'Delete') {
        input.value = '';
        onValueChange?.(getValue());
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = [...(e.clipboardData?.getData('text') ?? '')].filter((c) => aceito.test(c));
      pasted.forEach((char, i) => {
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
      sep.className = 'nds-input-otp-separator';
      sep.dataset.slot = 'input-otp-separator';
      // `role="separator"` e não `aria-hidden`: é ele que informa ao leitor que
      // o código vem em dois blocos. Seis dígitos ditos de enfiada são mais
      // difíceis de conferir contra a mensagem do que "três, separador, três".
      sep.setAttribute('role', 'separator');
      sep.textContent = separatorChar;
      root.appendChild(sep);
    }

    const input = buildInput(i);
    inputs.push(input);
    root.appendChild(input);
  }

  if (autoFocus && !disabled) {
    // Depois do append: focar um nó fora do documento não move o foco.
    queueMicrotask(() => inputs[0]?.focus());
  }

  return root;
}
