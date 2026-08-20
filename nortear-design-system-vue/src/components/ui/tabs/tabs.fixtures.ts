import { expect, userEvent, waitFor } from 'storybook/test';

/**
 * Andaime de interação do Tabs — um helper, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente. As duas cópias eram idênticas, comentário
 * incluído.
 */

/**
 * Ativa uma aba de forma idempotente: só clica quando ela ainda não está ativa.
 *
 * O painel Interactions reexecuta a play no mesmo DOM — clique cego inverteria
 * o estado a cada rodada.
 */
export async function ativar(aba: HTMLElement): Promise<void> {
  if (aba.getAttribute('aria-selected') !== 'true') await userEvent.click(aba);
  await waitFor(() => expect(aba).toHaveAttribute('aria-selected', 'true'));
}
