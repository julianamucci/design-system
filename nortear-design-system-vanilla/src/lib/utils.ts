import { type ClassValue, clsx } from 'clsx';
import DOMPurify from 'dompurify';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Cria um elemento HTML com atributos e filhos. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * Renderiza HTML string num container, sanitizando antes via `DOMPurify.sanitize`.
 *
 * O sanitizer remove <script>, <style>, <iframe>, event handlers on*, e
 * neutraliza `href/src/action="javascript:..."`. Para HTML 100% confiável
 * (string literal estática), o overhead de re-parse é desprezível.
 */
export function renderHtml(container: Element, html: string): void {
  container.innerHTML = DOMPurify.sanitize(html);
}
