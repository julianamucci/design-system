// Fixtures compartilhadas pelas quatro stories do Resizable.
//
// Medir o Resizable é uma coisa só — a fatia que cada painel ocupa do grupo —,
// e mesmo assim havia QUATRO funções para isso, duas com o nome `fracoes` e
// duas com o nome `fracaoDoPrimeiro`, cada par com corpos diferentes. As
// divergências não eram de propósito, eram de FORMA, e cada uma tinha um motivo
// real:
//
//   · o EIXO. Metade das cópias media só largura, porque as stories daquele
//     arquivo são todas horizontais; a outra metade recebia o eixo por
//     parâmetro. Vira `eixo`, com padrão `'horizontal'`, que é a direção
//     padrão do próprio componente;
//   · o ALVO. Uma cópia procurava o grupo dentro do `canvasElement`, outra já
//     recebia a lista de painéis pronta — porque a story de layout ANINHADO
//     tem dois grupos e precisa apontar para um deles. Vira um alvo único que
//     aceita as duas formas.
//
// E `fracaoDoPrimeiro` passa a ser `fracoes(...)[0]`, e não uma segunda
// travessia do DOM: eram duas medidas independentes do mesmo número, livres
// para discordar.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo.

/** O grupo — o contrato de markup que as plays procuram, nunca uma classe. */
export const SEL_GRUPO = '[data-slot="resizable-pane-group"]';

/** Um painel do grupo. */
export const SEL_PAINEL = '[data-slot="resizable-panel"]';

export type Eixo = 'horizontal' | 'vertical';

/**
 * Os painéis DIRETOS de um grupo.
 *
 * `:scope >` e não busca livre: no layout aninhado os painéis do grupo de
 * dentro também casam com o seletor, e somá-los ao total faria a fatia do
 * primeiro painel encolher sozinha — a medida sairia errada sem nada de errado
 * na tela.
 */
export function paineisDiretos(grupo: Element): HTMLElement[] {
  return [...grupo.querySelectorAll<HTMLElement>(`:scope > ${SEL_PAINEL}`)];
}

/**
 * O que medir: uma lista de painéis já escolhida, o próprio grupo, ou um
 * elemento que CONTÉM o grupo (tipicamente o `canvasElement`).
 *
 * A lista explícita existe para o layout aninhado, onde há mais de um grupo na
 * tela e a story diz qual delas está sendo demonstrada.
 */
export type MeasurementTarget = HTMLElement | HTMLElement[];

function resolvePanels(alvo: MeasurementTarget): HTMLElement[] {
  if (Array.isArray(alvo)) return alvo;
  const grupo = alvo.matches(SEL_GRUPO) ? alvo : alvo.querySelector(SEL_GRUPO);
  if (!grupo) throw new Error('grupo de painéis não encontrado');
  return paineisDiretos(grupo);
}

/**
 * A fatia de cada painel, de 0 a 1, somando 1.
 *
 * Geometria REAL, via `getBoundingClientRect`: `style.width` não decide nada
 * num item de `flex-basis: 0`, e a porcentagem que a lib escreve inline é a
 * intenção, não o resultado. A asserção anterior a esta medida era
 * `canvasElement.firstElementChild` ser truthy — passava com a tela vazia, com
 * o eixo trocado e com os dois painéis do mesmo tamanho.
 */
export function fracoes(alvo: MeasurementTarget, eixo: Eixo = 'horizontal'): number[] {
  const paineis = resolvePanels(alvo);
  const medida = (p: HTMLElement) => {
    const r = p.getBoundingClientRect();
    return eixo === 'horizontal' ? r.width : r.height;
  };
  const total = paineis.reduce((a, p) => a + medida(p), 0);
  return paineis.map((p) => medida(p) / total);
}

/** A fatia do primeiro painel — o que `defaultSize` e `aria-valuenow` dizem. */
export function fracaoDoPrimeiro(alvo: MeasurementTarget, eixo: Eixo = 'horizontal'): number {
  return fracoes(alvo, eixo)[0];
}
