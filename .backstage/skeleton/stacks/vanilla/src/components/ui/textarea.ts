import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextareaOptions = {
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  rows?: number;
  class?: string;
  id?: string;
  name?: string;
};

// ─── createTextarea ───────────────────────────────────────────────────────────

export function createTextarea(options: TextareaOptions = {}): HTMLTextAreaElement {
  const { placeholder, disabled = false, value, rows, id, name } = options;

  const textarea = document.createElement('textarea');
  textarea.className = cn('textarea', options.class);

  if (placeholder !== undefined) textarea.placeholder = placeholder;
  if (disabled) textarea.disabled = true;
  if (value !== undefined) textarea.value = value;
  if (rows !== undefined) textarea.rows = rows;
  if (id) textarea.id = id;
  if (name) textarea.name = name;

  return textarea;
}
