// Fixtures compartilhadas pelas stories da Sidebar.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um `export function makeIcon()` apareceria na sidebar do Storybook como se
// fosse um exemplo de barra lateral.
//
// As cópias tinham corpo IDÊNTICO nos dois casos; o que divergia era o jsdoc de
// `envolverEmNav`, e a versão que ficou é a que explica o motivo inteiro.

import DOMPurify from 'dompurify';

/**
 * Ícone de traçado, no desenho e na medida que a barra usa.
 *
 * O traçado passa por `DOMPurify.sanitize()` no próprio call site do
 * `innerHTML` — sem wrapper: um `sanitizeHtml()` local esconderia o sanitizador
 * do SAST e o ponto viraria falso positivo permanente de XSS.
 */
export function makeIcon(path: string): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = DOMPurify.sanitize(path);
  return svg;
}

/**
 * A barra é a navegação principal da aplicação, e navegação precisa de marco
 * nomeado: sem o `<nav aria-label>` o leitor de tela não a lista como região, e
 * quem navega por marcos não tem como chegar até ela. A fábrica não impõe o
 * elemento — quem compõe é que decide o rótulo —, então é aqui que ele entra.
 */
export function envolverEmNav(sidebar: HTMLElement, label = 'Navegação principal'): HTMLElement {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', label);
  nav.appendChild(sidebar);
  return nav;
}
