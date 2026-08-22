/**
 * Colhedor do ScrollArea — o que só fecha por medição.
 *
 * Duas perguntas do contrato de teste (`testes.*` do conteúdo compartilhado)
 * não se respondem olhando o DOM:
 *
 *   - `accessibility.item2` — "contraste mínimo 3:1 entre o pegador e o fundo".
 *     Contraste é aritmética. O pegador é `hsl(var(--border))` e o que está
 *     atrás dele costuma ser transparente até vários níveis acima, então a cor
 *     de fundo precisa ser COMPOSTA antes de dividir — comparar nome de token
 *     não responde a pergunta.
 *   - `functional.item2` — "arrastar o pegador rola o viewport
 *     proporcionalmente". A proporção é a mesma conta que o arrasto inverte:
 *     o pegador ocupa da trilha a fração que o viewport ocupa do conteúdo, e
 *     caminha o resto da trilha enquanto o viewport caminha o resto do
 *     conteúdo. Medir os dois lados é o que prova que a conta está certa.
 *
 * Sem storybook/test aqui de propósito: o colhedor é DOM puro e as cinco stacks
 * o chamam de dentro das próprias `play`, cada uma com o seu `waitFor`.
 */

import { contraste, backgroundEffective } from './alert-probe';

/**
 * Contraste do pegador contra o que está de fato atrás dele.
 *
 * A composição começa no PAI: iniciada no próprio pegador, a primeira camada
 * opaca encontrada seria a cor dele mesmo e a razão daria 1.
 */
export function grabberContrast(grabber: HTMLElement): number {
  const frente = getComputedStyle(grabber).backgroundColor;
  const background = backgroundEffective(grabber.parentElement ?? grabber);
  return contraste(frente, background);
}

export interface BarRatio {
  /** Fração da trilha ocupada pelo pegador. */
  fracaoDoPegador: number;
  /** Fração do conteúdo visível no viewport. */
  fracaoVisivel: number;
  /** Deslocamento do pegador dentro da trilha, em px. */
  deslocamento: number;
  /** Deslocamento máximo possível do pegador, em px. */
  deslocamentoMaximo: number;
}

/**
 * Relação entre o tamanho/posição do pegador e o do conteúdo rolável.
 *
 * O eixo entra explícito porque a barra horizontal mede largura e a vertical
 * mede altura — deduzir pelo `data-orientation` esconderia o erro do dia em que
 * o atributo divergisse do desenho.
 */
export function measureRatio(
  trail: HTMLElement,
  grabber: HTMLElement,
  viewport: HTMLElement,
  eixo: 'vertical' | 'horizontal',
): BarRatio {
  const vertical = eixo === 'vertical';
  const boxTrack = trail.getBoundingClientRect();
  const boxGrabber = grabber.getBoundingClientRect();

  const sizeTrack = vertical ? boxTrack.height : boxTrack.width;
  const sizeGrabber = vertical ? boxGrabber.height : boxGrabber.width;
  const visible = vertical ? viewport.clientHeight : viewport.clientWidth;
  const total = vertical ? viewport.scrollHeight : viewport.scrollWidth;

  const startTrack = vertical ? boxTrack.top : boxTrack.left;
  const startGrabber = vertical ? boxGrabber.top : boxGrabber.left;

  return {
    fracaoDoPegador: sizeTrack > 0 ? sizeGrabber / sizeTrack : 0,
    fracaoVisivel: total > 0 ? visible / total : 0,
    deslocamento: startGrabber - startTrack,
    deslocamentoMaximo: Math.max(0, sizeTrack - sizeGrabber),
  };
}

/**
 * Eixos em que o viewport realmente transborda.
 *
 * É o que decide se existe barra: a direção da rolagem nasce do conteúdo, não
 * de uma propriedade. Mesma medição nas cinco stacks.
 */
export function transbordo(viewport: HTMLElement): { x: boolean; y: boolean } {
  return {
    x: viewport.scrollWidth > viewport.clientWidth,
    y: viewport.scrollHeight > viewport.clientHeight,
  };
}

/**
 * O CSS compartilhado declara o anel de foco do viewport?
 *
 * `:focus-visible` depende da modalidade de entrada que o navegador registrou,
 * e evento sintético não a atualiza — não dá para provocar o anel numa `play`.
 * Então a verificação vai à fonte: a regra existe na folha carregada e pinta
 * `box-shadow`. O anel é `inset` de propósito (a raiz recorta), e é por isso
 * que a propriedade medida é `box-shadow` e não `outline`.
 */
export function focusDeclaradoRing(doc: Document = document): boolean {
  const varre = (folha: CSSStyleSheet): boolean => {
    let regras: CSSRuleList;
    try {
      regras = folha.cssRules;
    } catch {
      return false; // folha de outra origem — não é do design system
    }
    for (const regra of Array.from(regras)) {
      // A folha compartilhada é montada por @import; se o empacotador não tiver
      // embutido as partes, elas continuam alcançáveis como sub-folhas.
      if (regra instanceof CSSImportRule && regra.styleSheet && varre(regra.styleSheet)) {
        return true;
      }
      if (!(regra instanceof CSSStyleRule)) continue;
      if (!regra.selectorText.includes('.nds-scroll-area-viewport:focus-visible')) continue;
      if (regra.style.boxShadow && regra.style.boxShadow !== 'none') return true;
    }
    return false;
  };

  return Array.from(doc.styleSheets).some(varre);
}
