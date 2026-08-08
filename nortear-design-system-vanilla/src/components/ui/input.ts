// ─── Input — Vanilla factory standalone ──────────────────────────────────────
//
// Visual: classe .nds-input (standalone).

import { cn } from '@/lib/utils';

export type InputOptions = {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  class?: string;
  id?: string;
  name?: string;
};

export function createInput(options: InputOptions = {}): HTMLInputElement {
  const { type = 'text', placeholder, disabled = false, value, id, name } = options;

  const input = document.createElement('input');
  input.type = type;
  input.dataset.slot = 'input';
  input.className = cn('nds-input', options.class);

  if (placeholder !== undefined) input.placeholder = placeholder;
  if (disabled) input.disabled = true;
  if (value !== undefined) input.value = value;
  if (id) input.id = id;
  if (name) input.name = name;

  return input;
}
