/**
 * Sanitizador de HTML para uso em `innerHTML` — wrapper fino sobre o DOMPurify
 * (https://github.com/cure53/DOMPurify).
 *
 * O conteúdo vem dos arquivos JSON de tradução e das constantes de ícone SVG
 * das factories (controlados pelo time), mas este sanitizador garante que tags
 * e atributos perigosos nunca cheguem ao DOM, mesmo que uma dessas fontes seja
 * comprometida acidentalmente.
 *
 * O perfil default do DOMPurify cobre HTML + SVG + MathML: mantém tags
 * semânticas (<strong>, <code>, <a>, <table>, <svg>…) e remove <script>,
 * <iframe>, event handlers on*, URLs javascript: e demais vetores de XSS.
 */
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
