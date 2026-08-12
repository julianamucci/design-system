// Pedaços do Chart que o container E os builders precisam. Vive fora do
// barrel porque o barrel exporta o próprio `.vue` — importar de lá dentro do
// componente fecharia um ciclo.

import type { EChartsCoreOption } from 'echarts/core';

/**
 * Bloco `aria` comum aos builders.
 *
 * `decal.show` liga a trama por série — é o que cumpre a WCAG 1.4.1 quando a
 * cor sai de cena. `label.enabled: false` desliga a descrição gerada pela lib
 * de propósito: ela nasce em inglês e mora num elemento interno que o
 * `role="img"` do container poda da árvore de acessibilidade; quem carrega a
 * alternativa textual é o `aria-label` autoral, no idioma da página.
 */
export const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** O option descreve alguma série com dado? Decide o estado vazio. */
export function isChartOptionEmpty(option: EChartsCoreOption): boolean {
  const series = (option as { series?: unknown }).series;
  const lista = Array.isArray(series) ? series : series ? [series] : [];
  if (lista.length === 0) return true;
  return lista.every((s) => {
    const data = (s as { data?: unknown[] }).data;
    return !Array.isArray(data) || data.length === 0;
  });
}
