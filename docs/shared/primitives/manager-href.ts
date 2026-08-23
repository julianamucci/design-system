/**
 * URL do MANAGER do Storybook, montada de dentro do iframe.
 *
 * As docs pages rodam dentro de `iframe.html`. Um href relativo como
 * `?path=/docs/ui-tabs--docs` resolve contra a localização do IFRAME, não do
 * manager, e vira `localhost:6006/iframe.html?path=/docs/ui-tabs--docs`. Com
 * `target="_top"` a janela inteira navega para lá, o Storybook redireciona para
 * `iframe.html?id=…&viewMode=docs`, e a pessoa cai numa docs page **sem barra
 * lateral, sem toolbar e sem tema** — a página crua do iframe.
 *
 * O link parece funcionar: abre o componente certo. O que se perde é a moldura,
 * e com ela a navegação, o seletor de tema e o de idioma.
 *
 * A base sai do próprio `pathname`, cortando o último segmento:
 *
 *     /iframe.html      →  /          →  /?path=/docs/ui-tabs--docs
 *     /sub/iframe.html  →  /sub/      →  /sub/?path=/docs/ui-tabs--docs
 *
 * Derivar em vez de cravar `/` é o que mantém o link correto quando o
 * Storybook estático é servido sob um subcaminho — hoje não é, mas cravar a
 * raiz transformaria isso numa quebra silenciosa no dia em que for.
 */
export function managerHref(path: string): string {
  // Só normaliza query solta. Caminho absoluto ou URL completa passa direto:
  // quem escreveu já disse onde quer chegar.
  if (!path.startsWith('?')) return path;
  if (typeof window === 'undefined') return path;
  const base = window.location.pathname.replace(/[^/]*$/, '');
  return `${base}${path}`;
}
