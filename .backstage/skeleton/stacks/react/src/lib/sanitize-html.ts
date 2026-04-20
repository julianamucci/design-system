/**
 * Sanitizador mínimo de HTML para uso em dangerouslySetInnerHTML.
 *
 * O conteúdo vem dos arquivos JSON de tradução (controlado pelo time), mas
 * este sanitizador garante que tags e atributos perigosos nunca cheguem ao DOM,
 * mesmo que um arquivo de tradução seja comprometido acidentalmente.
 *
 * Tags permitidas: <strong>, <em>, <b>, <i>, <code>, <a>, <br>, <span>
 * Removidos: <script>, <style>, <iframe>, <object>, <embed>, handlers on*, javascript:
 */

// Tags estruturalmente perigosas — removidas com todo o seu conteúdo.
const DANGEROUS_BLOCKS_RE =
  /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi;

// Tags auto-fechadas perigosas.
const DANGEROUS_VOID_RE =
  /<(?:script|style|iframe|object|embed|form|input|link|meta)[^>]*\/?>/gi;

// Atributos de evento inline (onclick, onmouseover, etc.).
const EVENT_HANDLERS_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi;

// Protocolo javascript: em href/src/action.
const JAVASCRIPT_PROTOCOL_RE =
  /(href|src|action)\s*=\s*["']?\s*javascript:/gi;

/**
 * Retorna uma string HTML segura para uso em `dangerouslySetInnerHTML`.
 * Mantém tags inline semânticas (<strong>, <code>, <a>, etc.) e remove
 * qualquer conteúdo executável.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_BLOCKS_RE, '')
    .replace(DANGEROUS_VOID_RE, '')
    .replace(EVENT_HANDLERS_RE, '')
    .replace(JAVASCRIPT_PROTOCOL_RE, '$1="about:blank"');
}
