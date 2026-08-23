/**
 * Fixtures do Toggle — o ícone Lucide em SVG e o agrupador das fileiras.
 *
 * O módulo existe porque num `*.stories.ts` todo export nomeado vira story: a
 * função exportada de um deles apareceria como uma aba fantasma na barra
 * lateral. Sem lugar para morar, `buildLucideSvg` foi copiada nos quatro
 * arquivos e `cluster` em dois.
 *
 * O que variava: só `toggle.stories` tinha o parâmetro `className`; as outras
 * três paravam no ícone sem classe. Divergência acidental — a assinatura aqui é
 * o superconjunto, e omitir `className` devolve exatamente o que as três
 * montavam. `cluster` era idêntico nas duas cópias.
 *
 * O `buildLucideSvg` do ToggleGroup é OUTRA função com o mesmo nome: lá a classe
 * padrão é `nds-icon-sm`. Cada slug tem o seu fixtures.
 */

/** Um nó do array que a lucide exporta: `[tag, atributos]`. */
export type LucideIconNode = [string, Record<string, string>];

/** Converte um ícone da lucide em `<svg>`, sem interpolar string em markup. */
export function buildLucideSvg(icon: unknown, className?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  // O ícone reforça o rótulo, nunca o substitui: quem compõe dá o nome
  // acessível no `aria-label` do botão ou no texto visível.
  svg.setAttribute('aria-hidden', 'true');
  // Sem classe por padrão: a medida do ícone já vive em `.nds-toggle > svg`, e
  // uma classe aqui competiria com ela.
  if (className) svg.setAttribute('class', className);
  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

/** Fileira de toggles lado a lado — o agrupador é o `nds-cluster` do design system. */
export function cluster(...children: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster';
  wrap.dataset.spacing = 'sm';
  wrap.append(...children);
  return wrap;
}
