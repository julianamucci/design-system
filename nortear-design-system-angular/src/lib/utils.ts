import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Sem helper de sanitização aqui — guideline 09: `DOMPurify.sanitize()` vai no
// próprio call site, porque Qwiet/CodeQL só reconhecem o sanitizador de taint
// quando a chamada aparece ali. Um wrapper local esconderia o sanitizador e o
// fluxo `dado → wrapper → [innerHTML]` seguiria reportado como XSS.
