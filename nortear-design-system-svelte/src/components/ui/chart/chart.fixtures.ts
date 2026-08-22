import { expect, waitFor } from 'storybook/test';
import { designPintado } from '@shared/testing/chart-probe';

/**
 * Andaime de espera do Chart — um helper, três arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As três cópias eram idênticas, inclusive no `timeout` de 3000; só
 * `chart-variantes` trazia a linha de explicação, e ela veio junto.
 */

/**
 * Espera o desenho sair antes de qualquer medição.
 *
 * É a precondição de qualquer medida, e cada story a repõe por conta própria —
 * o painel Interactions reexecuta a play no MESMO DOM.
 */
export async function waitForDesign(raiz: HTMLElement): Promise<void> {
  await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
}
