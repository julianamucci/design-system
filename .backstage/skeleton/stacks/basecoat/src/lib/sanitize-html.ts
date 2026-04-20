/**
 * Sanitizador mínimo de HTML para uso em innerHTML.
 *
 * Tags permitidas: <strong>, <em>, <b>, <i>, <code>, <a>, <br>, <span>
 * Removidos: <script>, <style>, <iframe>, <object>, <embed>, handlers on*, javascript:
 */

const DANGEROUS_BLOCKS_RE =
  /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi;
const DANGEROUS_VOID_RE =
  /<(?:script|style|iframe|object|embed|form|input|link|meta)[^>]*\/?>/gi;
const EVENT_HANDLERS_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi;
const JAVASCRIPT_PROTOCOL_RE =
  /(href|src|action)\s*=\s*["']?\s*javascript:/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_BLOCKS_RE, '')
    .replace(DANGEROUS_VOID_RE, '')
    .replace(EVENT_HANDLERS_RE, '')
    .replace(JAVASCRIPT_PROTOCOL_RE, '$1="about:blank"');
}
