// Fixture compartilhada pelas stories do NavigationMenu.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function esperarPainel()` dentro de um `*.stories.ts` viraria
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
export const SELETOR_PAINEL = '.nds-navigation-menu-content:not([hidden])';

/** O painel aberto dentro de um escopo, ou `null`. */
export function painelAberto(escopo: ParentNode = document.body): HTMLElement | null {
  return escopo.querySelector<HTMLElement>(SELETOR_PAINEL);
}

/** Espera o painel abrir e ficar com altura de verdade. */
export async function esperarPainel(
  escopo: ParentNode = document.body,
  timeout = 4000,
): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const painel = painelAberto(escopo);
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
export async function esperarPainelSumir(
  escopo: ParentNode = document.body,
  timeout = 3000,
): Promise<void> {
  await waitFor(
    () => {
      if (painelAberto(escopo)) throw new Error('painel ainda aberto');
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
  return await esperarPainel(escopo);
}

export async function fechar(gatilho: HTMLElement, escopo?: ParentNode): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.click(gatilho);
  await esperarPainelSumir(escopo);
}
