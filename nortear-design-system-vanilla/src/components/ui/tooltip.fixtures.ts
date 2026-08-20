/**
 * Fixtures do Tooltip — o caminho até o balão, a limpeza do portal e a moldura
 * que reserva espaço para ele abrir.
 *
 * O módulo existe porque num `*.stories.ts` todo export nomeado vira story: a
 * função exportada de um deles apareceria como uma aba fantasma na barra
 * lateral. Sem lugar para morar, `balaoDe` e `limparPortal` foram copiadas nos
 * quatro arquivos de story e `wrap` em três.
 *
 * O que variava: a altura mínima da moldura. Composições reservam 200px porque a
 * composição é maior; estados e variantes ficam em 180px. Não é acidente — virou
 * parâmetro, com 180px de padrão, e cada call site passa a sua medida.
 */

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
export function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  const alvo = id ? document.getElementById(id) : null;
  return alvo?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

/** Tira do DOM qualquer balão que tenha sobrado antes do axe varrer a página. */
export function limparPortal(): void {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
}

/**
 * Moldura da demonstração: centraliza o gatilho e reserva altura para o balão
 * abrir sem empurrar o resto da página.
 */
export function wrap(child: HTMLElement, alturaMinima = '180px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.style.minHeight = alturaMinima;
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
}
