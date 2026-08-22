/**
 * select-probe.ts — medições compartilhadas pelas stories do Select.
 *
 * O colhedor existe para que as cinco stacks afirmem a MESMA coisa com o mesmo
 * código: comparação entre linhas de uma matriz só vale quando a medida é a
 * mesma. Ele busca pelo contrato `.nds-*` e por papel ARIA — nunca por classe
 * de lib nem por `data-slot`, que duas diretivas no mesmo host disputam.
 */

export interface RingMeasurement {
  /** Sombra e contorno computados com o elemento SEM foco. */
  noFocus: string;
  /** Sombra e contorno computados com o elemento focado. */
  withFocus: string;
  /** `true` quando focar muda o desenho e o resultado não é "nada". */
  mudou: boolean;
}

/**
 * Mede o anel de foco antes e depois de focar.
 *
 * `boxShadow !== 'none'` sozinho não prova nada: no estado inválido a sombra já
 * existe sem foco, e foi assim que um anel de foco invisível sobreviveu meses
 * no `toggle`. O que reprova de verdade é a MUDANÇA — e `withFocus` diferente de
 * "nada" descarta o caso em que focar apenas apaga o que havia.
 */
export function focusMeasureRing(el: HTMLElement): RingMeasurement {
  const doc = el.ownerDocument;
  (doc.activeElement as HTMLElement | null)?.blur();
  const antes = getComputedStyle(el);
  const noFocus = `${antes.boxShadow} | ${antes.outlineStyle} ${antes.outlineWidth}`;
  el.focus();
  const depois = getComputedStyle(el);
  const withFocus = `${depois.boxShadow} | ${depois.outlineStyle} ${depois.outlineWidth}`;
  return { noFocus, withFocus, mudou: noFocus !== withFocus && withFocus !== 'none | none 0px' };
}

/**
 * Rótulo que o campo fechado deve exibir para um valor.
 *
 * Os rótulos das opções só existem enquanto a lista está montada — o portal
 * desmonta o conteúdo ao fechar. Um valor que chega antes da primeira abertura
 * (valor inicial não-controlado, valor vindo do formulário) não teria rótulo, e
 * o campo mostraria o valor cru. Cada lib oferece um caminho próprio para isso;
 * a story usa esta lista como fonte única para não repetir o mapa.
 */
export const STATES = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
] as const;

/** Mapa `valor → rótulo` no formato que as libs de navegador aceitam. */
export const VALUE_STATES: Record<string, string> = Object.fromEntries(
  STATES.map((e) => [e.value, e.label]),
);
