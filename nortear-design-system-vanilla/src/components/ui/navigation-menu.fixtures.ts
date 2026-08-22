// Fixture compartilhada pelas stories do NavigationMenu.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function waitForPanel()` dentro de um `*.stories.ts` viraria
// uma story "EsperarPainel" que não renderiza nada.
//
// Não reaproveita `waitForPortal` de `@/lib/wait-for-portal`: aquele helper
// procura por PAPEL (`menu`, `dialog`, `listbox`), e o painel daqui não tem
// papel nenhum — é navegação, uma lista de links. Procurar por `role="menu"`
// aqui só encontraria algo se o componente estivesse errado.

import { userEvent, waitFor } from 'storybook/test';

/**
 * O painel visível.
 *
 * `:not([hidden])` filtra pelo ATRIBUTO, que é o que a factory alterna. A
 * versão antiga destas stories usava `:not(.hidden)` — uma CLASSE que nunca
 * existiu no markup: o seletor casava sempre, inclusive com o painel fechado, e
 * toda espera por "o menu abriu" passava de imediato sem nada ter aberto.
 */
export const SELECTOR_PANEL = '.nds-navigation-menu-content:not([hidden])';

/** O painel aberto dentro de um escopo, ou `null`. */
export function panelOpen(escopo: ParentNode = document.body): HTMLElement | null {
  return escopo.querySelector<HTMLElement>(SELECTOR_PANEL);
}

/** Espera o painel abrir e ficar com altura de verdade. */
export async function waitForPanel(
  escopo: ParentNode = document.body,
  timeout = 4000,
): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const painel = panelOpen(escopo);
      if (!painel) throw new Error('painel: ainda fechado');
      if (painel.getBoundingClientRect().height < 1) {
        throw new Error('painel: sem altura, ainda não pintou');
      }
      return painel;
    },
    { timeout, interval: 50 },
  );
}

/** Espera o painel sumir — prova Escape, clique fora e escolha de destino. */
export async function waitForPanelVanish(
  escopo: ParentNode = document.body,
  timeout = 3000,
): Promise<void> {
  await waitFor(
    () => {
      if (panelOpen(escopo)) throw new Error('painel ainda aberto');
    },
    { timeout, interval: 50 },
  );
}

/**
 * Par idempotente de abertura e fechamento.
 *
 * Clica só quando o estado atual não é o desejado. Um clique cego seguido de
 * asserção de estado inverte o resultado no replay do painel Interactions: a
 * segunda rodada parte do estado que a primeira deixou.
 */
export async function abrir(gatilho: HTMLElement, escopo?: ParentNode): Promise<HTMLElement> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
  return await waitForPanel(escopo);
}

export async function fechar(gatilho: HTMLElement, escopo?: ParentNode): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.click(gatilho);
  await waitForPanelVanish(escopo);
}

// ─── Moldura das stories ──────────────────────────────────────────────────────
//
// Havia três cópias de `wrap` — composições, estados e variantes — com o mesmo
// corpo e padrões diferentes de altura. O corpo desce para cá; a altura fica
// onde sempre pertenceu, no call site, porque quem sabe de quanto o painel
// precisa é a story e não o helper.

/**
 * Moldura da story, com espaço reservado para o painel aberto.
 *
 * `minHeight` é da story: um painel de quatro destinos em duas colunas ocupa
 * bem mais que uma barra sem hierarquia nenhuma. Sem a reserva o canvas
 * encolhe e o painel sai da foto da regressão visual.
 */
export function wrap(child: HTMLElement, minHeight = 240): HTMLElement {
  const wrapper = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design.
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}
