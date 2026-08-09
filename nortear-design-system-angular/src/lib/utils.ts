import { type ClassValue, clsx } from 'clsx';
import DOMPurify from 'dompurify';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Sanitiza HTML inline vindo do `translations.json` antes de um `[innerHTML]`.
 *
 * O `[innerHTML]` do Angular já passa pelo DomSanitizer, então isto é uma
 * segunda barreira — mantida porque a guideline 09 exige `DOMPurify.sanitize()`
 * visível no call site nas quatro stacks. Um wrapper que escondesse a chamada
 * viraria falso positivo permanente de XSS no SAST.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
