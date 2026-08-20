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
 * Monta o menu e o abre pelo gatilho. A abertura fica no `queueMicrotask` para
 * a foto do Chromatic sair com o painel na tela; as `play` que dependem de foco
 * abrem de novo pelo clique real, que é o caminho de quem usa.
 *
 * `alturaMinima` só vai adiante para a moldura: as composições montam listas
 * mais longas (grupos com rótulo, alternadores, escolha única) e precisam de
 * mais espaço reservado que os estados e as variantes.
 */
export function montar(
  rotulo: string,
  items: DropdownMenuItemDef[],
  alturaMinima?: string,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: rotulo });
  const menu = createDropdownMenu({ trigger, items });
  queueMicrotask(() => trigger.click());
  return wrap(menu, alturaMinima);
}
