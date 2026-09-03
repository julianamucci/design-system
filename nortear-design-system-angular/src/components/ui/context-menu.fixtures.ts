import { userEvent } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { closeMenu } from '@shared/testing/context-menu-area';

/**
 * Andaime de abertura do ContextMenu — um helper, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As duas cópias faziam a MESMA coisa por caminhos escritos diferente — uma
 * guardava as coordenadas numa `const` e a outra as passava inline —, o que
 * bastou para a regra marcar corpos divergentes. Divergência acidental, então:
 * ficou a forma de `context-menu.stories.ts`, que era a que carregava a
 * explicação de por que o gesto tem de ser real. Nenhuma play muda de
 * resultado; o clique cai no mesmo ponto nos dois arquivos.
 */

/**
 * Abre o menu pelo gesto real, no centro da área.
 *
 * `userEvent.pointer` com botão secundário: um `dispatchEvent('contextmenu')`
 * à mão não carrega as coordenadas do ponteiro, e é justamente delas que o
 * primitivo tira a posição do popup.
 *
 * FECHA antes de abrir, como o `gestoOpen` compartilhado das outras quatro
 * stacks: assim cada chamada é um clique de verdade NESTA rodada, e não herança
 * da anterior. O painel Interactions reexecuta a play no mesmo DOM, e sem esta
 * precondição um passo mede o estado que o passo anterior deixou. O helper
 * daqui continua existindo por causa do `waitForPortal` desta stack, que é quem
 * conhece o ciclo de vida do popup do Angular.
 */
export async function gestoOpen(area: HTMLElement): Promise<HTMLElement> {
  await closeMenu();
  const box = area.getBoundingClientRect();
  const coords = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  await userEvent.pointer({ keys: '[MouseRight]', target: area, coords });
  return await waitForPortal('menu');
}
