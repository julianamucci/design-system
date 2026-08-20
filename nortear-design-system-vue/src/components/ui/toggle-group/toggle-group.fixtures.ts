import { userEvent } from 'storybook/test';

/**
 * Andaime de interação do ToggleGroup — um helper, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente. As duas cópias eram idênticas, comentário
 * incluído.
 */

/**
 * Leva um item do grupo ao estado desejado, clicando só quando ele ainda não
 * está lá.
 *
 * Reexecutar a play no painel Interactions parte do estado que a rodada
 * anterior deixou; um clique cego inverteria o resultado a cada rodada.
 *
 * Não confirma o estado depois do clique: quem chama assere o que interessa à
 * sua story — em grupo de escolha única o clique num item DESLIGA outro, e uma
 * asserção embutida aqui mediria o item errado.
 */
export async function definir(botao: HTMLElement, ligado: boolean): Promise<void> {
  if ((botao.getAttribute('aria-pressed') === 'true') !== ligado) {
    await userEvent.click(botao);
  }
}
