import { expect, waitFor } from 'storybook/test';
import { desenhoPintado, exigirRaiz } from '@shared/testing/chart-probe';

/**
 * Andaime de espera do Chart — um helper, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.tsx` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As quatro cópias eram idênticas, inclusive no `timeout` de 3000 — o que
 * variava era só o comentário: três traziam uma linha e `chart-variantes`
 * carregava a explicação inteira. Ela veio junto.
 */

/**
 * Espera o desenho existir e devolve a raiz do gráfico.
 *
 * É a precondição de qualquer medida, e cada story a repõe por conta própria —
 * o painel Interactions reexecuta a play no MESMO DOM.
 *
 * A raiz sai de `exigirRaiz`, que procura pela classe do CSS compartilhado e
 * não pelo `data-slot`: é o que o design system define, e o mesmo seletor serve
 * nas cinco stacks.
 */
export async function desenhoPronto(canvasElement: HTMLElement): Promise<HTMLElement> {
  const raiz = exigirRaiz(canvasElement);
  await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
  return raiz;
}
