/**
 * Andaimes de demonstração do Resizable — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * O que variava entre as cópias:
 *  · `frame` tinha corpos idênticos e padrões de altura diferentes — a altura
 *    virou parâmetro, e quem precisa de outra medida passa a sua;
 *  · `panelContent` era o caso grave: mesmo nome, DUAS árvores diferentes. Uma
 *    montava um cluster centralizado com um rótulo só; a outra, uma pilha com
 *    título e linha de apoio. Vieram para cá separadas por PROPÓSITO —
 *    `panelLabelled` e `panelWithHelper`;
 *  · `firstFraction` divergia COM MOTIVO: uma media só a largura, a outra
 *    recebia o eixo. Ficou o eixo em parâmetro, com o padrão horizontal.
 */

/** Conteúdo de painel com um rótulo só, centralizado na altura cheia. */
export function panelLabelled(label: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `nds-cluster nds-w-full nds-p-4 nds-text-body nds-font-medium ${extraClass}`.trim();
  el.dataset.justify = 'center';
  el.style.height = '100%';
  const span = document.createElement('span');
  span.textContent = label;
  el.appendChild(span);
  return el;
}

/** Conteúdo de painel com título e uma linha de apoio abaixo dele. */
export function panelWithHelper(titulo: string, apoio: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-stack nds-p-4';
  el.dataset.spacing = 'xs';
  const h = document.createElement('p');
  h.className = 'nds-text-body nds-font-semibold';
  h.textContent = titulo;
  const p = document.createElement('p');
  p.className = 'nds-text-caption nds-text-muted-foreground';
  p.textContent = apoio;
  el.append(h, p);
  return el;
}

/** Invólucro de altura definida para o grupo de painéis. */
export function frame(child: HTMLElement, altura = '220px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  // ALTURA DEFINIDA, e não só `min-height`: um grupo vertical distribui a
  // ALTURA livre entre os painéis, e não existe altura livre dentro de um
  // contêiner de altura automática — os painéis colapsavam para zero. Com
  // `min-height` no invólucro, o `height: 100%` do grupo resolvia para `auto`.
  // A suíte só viu isso quando a asserção passou a medir a geometria.
  wrap.style.height = altura;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

/**
 * Fração do eixo principal que o PRIMEIRO painel ocupa na tela.
 *
 * Geometria real, e nunca `style.width`: a folha compartilhada dá
 * `flex-basis: 0` ao painel, então largura inline não decide nada. As stories
 * afirmavam `style.width === '30%'` e passavam com os painéis desenhados 50/50
 * — a asserção guardava o defeito em vez de pegá-lo.
 *
 * `horizontal` diz qual eixo medir, e o padrão é o horizontal porque as stories
 * de estados são todas horizontais e nunca precisaram dizê-lo. Quem varia o
 * eixo — a story raiz, que segue o control `direction` — passa o valor.
 */
export function firstFraction(canvasElement: HTMLElement, horizontal = true): number {
  const panels = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')];
  const measurements = panels.map((p) =>
    horizontal ? p.getBoundingClientRect().width : p.getBoundingClientRect().height,
  );
  return measurements[0] / measurements.reduce((a, b) => a + b, 0);
}
