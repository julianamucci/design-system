/**
 * clipboard.ts — Cópia para a área de transferência, compartilhada entre as 4 stacks.
 * Importar via: import { copyText } from '@shared/primitives/clipboard'
 *
 * `navigator.clipboard` só existe em contexto seguro (https ou localhost) e pode
 * ser negado por permissão. Sem fallback, um Storybook servido por IP na rede
 * local — ou um browser de teste headless — deixa o botão copiar silenciosamente
 * inerte: clica e nada acontece, sem erro visível.
 *
 * Compartilhado porque o comportamento precisa ser idêntico nas 4 stacks; cada
 * uma reimplementando isso divergiria no primeiro caso de borda.
 */

/**
 * Copia `text`. Devolve `true` quando conseguiu.
 *
 * Tenta a Clipboard API e cai para `document.execCommand('copy')` sobre um
 * textarea temporário. O execCommand é deprecado, mas continua sendo o único
 * caminho fora de contexto seguro — e é síncrono, então funciona dentro do
 * handler de clique sem depender de permissão.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Segue para o fallback.
    }
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Fora da viewport e inerte para leitor de tela: o textarea existe por um
  // frame só, mas não deve piscar na tela nem ser anunciado.
  textarea.setAttribute('aria-hidden', 'true');
  textarea.setAttribute('tabindex', '-1');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  const previousFocus = document.activeElement as HTMLElement | null;
  document.body.appendChild(textarea);

  let copied = false;
  try {
    textarea.select();
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    textarea.remove();
    // Devolve o foco ao botão: sem isto o Tab seguinte recomeçaria do body.
    previousFocus?.focus?.();
  }

  return copied;
}
