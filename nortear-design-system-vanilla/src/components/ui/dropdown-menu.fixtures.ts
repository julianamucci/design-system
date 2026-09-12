import { userEvent, waitFor, within } from 'storybook/test';
import { createDropdownMenu, type DropdownMenuItemDef } from './dropdown-menu';
import { createButton } from './button';

// Andaime de montagem compartilhado pelas stories do DropdownMenu.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// `wrap` estava copiada em três arquivos e `montar` em dois. O que variava era
// só a ALTURA da moldura — 220px nas composições, 180px nos estados e nas
// variantes —, e ela passa a entrar por parâmetro. `montar` repassa a medida
// porque cada cópia chamava o `wrap` local do próprio arquivo: sem o repasse, a
// moldura das composições encolheria.

/**
 * A moldura da story.
 *
 * O painel vive num portal e nasce aberto na maioria das stories; a moldura é o
 * que reserva a altura dele no canvas, para a foto do Chromatic não sair com o
 * menu passando por cima do que vem embaixo.
 *
 * A medida fica em `style` porque não há utilitário nessas alturas — a escala
 * do `nds` salta de 120px para 200px, e as duas medidas caem no meio. Ela entra
 * por variável, nunca cravada aqui dentro.
 */
export function wrap(child: HTMLElement, alturaMinima = '180px'): HTMLElement {
  const wrapper = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design: segura o reflow dentro
  // da moldura sem sair do tema nem da escala.
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(child);
  return wrapper;
}

/**
 * Clica o gatilho na próxima microtarefa — mas SÓ se ele estiver no documento.
 *
 * O runner avalia o `render()` de uma story MAIS DE UMA VEZ e descarta as
 * árvores que não chegam ao canvas. Um `queueMicrotask(() => trigger.click())`
 * cru abre o painel da árvore DESCARTADA também: ela portala um painel no
 * `body` e rouba o foco do painel vivo; quando a varredura de graça do
 * `tornarDestruivel` recolhe a instância órfã, o painel sai levando o foco
 * junto, e a asserção "aberto, o foco está no painel" reprova com
 * `activeElement === BODY`.
 *
 * Medido em 2026-09-12 no `dialog-states`, onde o defeito apareceu: passava
 * antes por acidente, porque o desmonte antigo devolvia o foco ao
 * `previousFocus` — que na instância órfã era justamente o botão do painel
 * vivo. Consertar o desmonte tirou a restituição acidental.
 *
 * `isConnected` é decisivo: a árvore descartada nunca entra no documento, e a
 * viva já está nele quando a microtarefa roda — o renderer anexa o que o
 * `render()` devolve na MESMA tarefa. A árvore viva, portanto, abre como antes.
 *
 * Gêmea da de `dialog.fixtures.ts` e da de `sheet.fixtures.ts` de propósito:
 * fixture de um componente não é importada por outro.
 */
export function clicarQuandoMontado(trigger: HTMLElement | null | undefined): void {
  if (!trigger) return;
  queueMicrotask(() => {
    if (trigger.isConnected) trigger.click();
  });
}

/**
 * Monta o menu e o abre pelo gatilho. A abertura fica numa microtarefa para a
 * foto do Chromatic sair com o painel na tela; as `play` que dependem de foco
 * abrem de novo pelo clique real, que é o caminho de quem usa.
 *
 * `alturaMinima` só vai adiante para a moldura: as composições montam listas
 * mais longas (grupos com rótulo, alternadores, escolha única) e precisam de
 * mais espaço reservado que os estados e as variantes.
 */
export function montar(
  label: string,
  items: DropdownMenuItemDef[],
  alturaMinima?: string,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: label });
  const menu = createDropdownMenu({ trigger, items });
  clicarQuandoMontado(trigger);
  return wrap(menu, alturaMinima);
}

/**
 * Fecha o menu pelo Escape e espera ele sair do DOM.
 *
 * Vai no fim das plays que deixam o menu aberto: o painel vive num portal no
 * `body` e sobreviveria à story seguinte. Estava copiada nas composições e nas
 * variantes, idêntica nas duas.
 */
export async function endClose(): Promise<void> {
  const body = within(document.body);
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
  });
}
