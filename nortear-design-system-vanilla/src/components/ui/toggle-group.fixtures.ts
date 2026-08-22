import { userEvent } from 'storybook/test';

/**
 * Fixtures do ToggleGroup — o ícone Lucide em SVG e a injeção nos itens.
 *
 * O módulo existe porque num `*.stories.ts` todo export nomeado vira story: a
 * função exportada de um deles apareceria como uma aba fantasma na barra
 * lateral. Sem lugar para morar, as duas funções foram copiadas nos quatro
 * arquivos de story.
 *
 * Não variava nada entre as cópias — só os comentários, que estavam repartidos
 * entre elas e vêm mesclados aqui.
 *
 * O `buildLucideSvg` do Toggle é OUTRA função com o mesmo nome: lá o ícone nasce
 * sem classe, porque a medida vem de `.nds-toggle > svg`. Aqui a classe padrão é
 * `nds-icon-sm`. Cada slug tem o seu fixtures.
 */

/** Um nó do array que a lucide exporta: `[tag, atributos]`. */
export type LucideIconNode = [string, Record<string, string>];

/** Converte um ícone da lucide em `<svg>`, sem interpolar string em markup. */
export function buildLucideSvg(icon: unknown, className = 'nds-icon-sm'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);
  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

/**
 * Põe um ícone em cada item do grupo, na ordem. A fábrica `createToggle` usa
 * `textContent` quando `children` é string, então o SVG entra por DOM API depois
 * de o grupo estar criado — nunca por interpolação de markup.
 */
export function injectIcons(group: HTMLElement, icons: unknown[]): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(icons[i]));
    btn.appendChild(wrap);
  });
}

/**
 * Leva um item do grupo ao estado desejado, clicando só quando ele ainda não
 * está lá.
 *
 * Reexecutar a play no painel Interactions parte do estado que a rodada
 * anterior deixou; um clique cego inverteria o resultado a cada rodada. Estava
 * copiada nas composições e nas variantes, idêntica nas duas.
 *
 * Não confirma o estado depois do clique: quem chama assere o que interessa à
 * sua story — em grupo de escolha única o clique num item DESLIGA outro, e uma
 * asserção embutida aqui mediria o item errado.
 */
export async function definir(button: HTMLElement, ligado: boolean): Promise<void> {
  if ((button.getAttribute('aria-pressed') === 'true') !== ligado) {
    await userEvent.click(button);
  }
}
