import { userEvent, waitFor } from 'storybook/test';

/**
 * Andaimes de demonstração do Popover — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * O que variava entre as cópias: existiam DUAS funções chamadas `wrap`, mesmo
 * nome e propósitos diferentes. Composições e variantes centralizavam UM filho
 * num `nds-cluster`; estados empilhava VÁRIOS num `nds-stack`, com espaçamento
 * e alinhamento próprios. Unificar seria forçar uma na forma da outra, então
 * vieram para cá separadas por PROPÓSITO — `centralizar` e `empilharCentrado`,
 * cada uma com a sua altura mínima de hoje no padrão. `painel()` era cópia
 * idêntica em três arquivos e veio como estava.
 */

/**
 * Moldura que centraliza um único filho.
 *
 * A altura mínima é o espaço que o painel precisa para abrir sem esbarrar na
 * borda do canvas — quem documenta um lado de abertura passa a sua. Vem como
 * CLASSE da escada, não como medida: em `style` inline ela venceria a folha e
 * sairia do tema e da densidade, e a indireção do parâmetro ainda a escondia do
 * portão que varre valor cravado.
 */
export function centralizar(child: HTMLElement, alturaMinima = 'nds-min-h-80'): HTMLElement {
  const w = document.createElement('div');
  w.style.contain = 'layout';
  w.className = `nds-cluster nds-w-full ${alturaMinima}`;
  w.dataset.justify = 'center';
  w.appendChild(child);
  return w;
}

/**
 * Pilha centralizada de vários elementos.
 *
 * Não é a moldura de `centralizar` com mais filhos: aqui os elementos ficam um
 * sobre o outro — gatilho, alvo externo, leitura de estado —, e é o `nds-stack`
 * que dá o respiro entre eles.
 */
export function empilharCentrado(children: HTMLElement[], alturaMinima = 'nds-min-h-70'): HTMLElement {
  const w = document.createElement('div');
  w.style.contain = 'layout';
  w.className = `nds-stack nds-w-full ${alturaMinima}`;
  w.dataset.spacing = 'sm';
  w.dataset.align = 'center';
  w.append(...children);
  return w;
}

/** O painel aberto — `null` quando fechado, porque fechado ele não existe no DOM. */
export function panel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

/**
 * Abre pelo gatilho, e só se ele ainda não estiver expandido.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM, sem remontar: um clique
 * cego partiria do estado que a rodada anterior deixou e fecharia o popover em
 * vez de abri-lo. Estava copiada byte a byte em três arquivos de story — mesmo
 * `timeout`, mesmo `painel()`, que os três já importavam daqui.
 */
export async function open(trigger: HTMLElement): Promise<HTMLElement> {
  if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
  await waitFor(() => {
    if (!panel()) throw new Error('popover ainda fechado');
  }, { timeout: 1500 });
  return panel()!;
}
