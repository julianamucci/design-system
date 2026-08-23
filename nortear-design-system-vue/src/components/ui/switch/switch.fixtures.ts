import { expect, userEvent, waitFor } from 'storybook/test';

/**
 * Andaime de interação do Switch — um helper, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As duas cópias eram idênticas no corpo e na assinatura, inclusive no padrão
 * `alvo = sw`. O que estava repartido era a EXPLICAÇÃO: `switch.stories.ts`
 * carregava a nota longa e `switch-composicoes.stories.ts` mandava lê-la de lá.
 */

/**
 * Leva o switch ao estado desejado, clicando SÓ quando ele ainda não está lá.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar. Um clique
 * cego alterna a partir do que a rodada anterior deixou e inverte o resultado —
 * a suíte fica verde (o vitest remonta a cada teste) e o painel falha.
 *
 * `target` existe porque nem sempre se clica no próprio switch: num par
 * rótulo ↔ controle quem recebe o clique é o rótulo, e o estado que se mede
 * continua sendo o do switch.
 */
export async function definir(
  sw: HTMLElement,
  ligado: boolean,
  target: HTMLElement = sw,
): Promise<void> {
  if ((sw.getAttribute('aria-checked') === 'true') !== ligado) await userEvent.click(target);
  await waitFor(() => expect(sw).toHaveAttribute('aria-checked', String(ligado)));
}
