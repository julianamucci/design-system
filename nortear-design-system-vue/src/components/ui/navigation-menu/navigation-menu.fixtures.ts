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

/** O painel compartilhado — um só para a barra inteira, ancorado sob a lista. */
export const SELECTOR_PANEL = '.nds-navigation-menu-viewport-panel';

/** O miolo do item ativo, instanciado dentro do painel. */
export const SELECTOR_CONTENT = '.nds-navigation-menu-viewport-content';

/** O painel aberto, ou `null`. Consulta o documento inteiro, não o canvas. */
export function panelOpen(): HTMLElement | null {
  const painel = document.body.querySelector<HTMLElement>(SELECTOR_PANEL);
  if (!painel) return null;
  return painel.querySelector(SELECTOR_CONTENT) ? painel : null;
}

/**
 * Espera o painel abrir E ASSENTAR.
 *
 * Duas esperas em uma, e cada uma já custou um teste intermitente em algum
 * componente deste repositório:
 *
 *   · o painel entra com transição de opacidade e de altura, e ler cor ou
 *     geometria no primeiro frame mede um elemento translúcido de altura zero —
 *     é assim que nasce a violação de contraste ~1.0 do axe;
 *   · o miolo é instanciado num segundo passo, então o painel pode existir
 *     ainda vazio.
 */
export async function waitForPanel(timeout = 4000): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const painel = document.body.querySelector<HTMLElement>(SELECTOR_PANEL);
      if (!painel) throw new Error('painel: ainda não montou');
      if (painel.getAttribute('data-state') === 'closed') {
        throw new Error('painel: marcado como fechado');
      }
      const estilo = window.getComputedStyle(painel);
      if (estilo.opacity !== '1' && Number.parseFloat(estilo.opacity) < 0.9) {
        throw new Error(`painel: opacity=${estilo.opacity}, ainda animando`);
      }
      const conteudo = painel.querySelector<HTMLElement>(SELECTOR_CONTENT);
      if (!conteudo) throw new Error('painel: o miolo ainda não foi instanciado');
      if (conteudo.getBoundingClientRect().height < 1) {
        throw new Error('painel: altura ainda em transição');
      }
      return conteudo;
    },
    { timeout, interval: 50 },
  );
}

/** Espera o painel sumir — prova Escape, clique fora e escolha de destino. */
export async function waitForPanelVanish(timeout = 3000): Promise<void> {
  await waitFor(
    () => {
      if (panelOpen()) throw new Error('painel ainda aberto');
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
export async function abrir(gatilho: HTMLElement): Promise<HTMLElement> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
  return await waitForPanel();
}

export async function fechar(gatilho: HTMLElement): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') return;
  // Fecha por Escape, não por segundo clique: a lib desta stack ignora o clique
  // no gatilho durante os 300 ms seguintes a uma abertura por ponteiro (é como
  // ela evita que o hover reabra o que o clique acabou de fechar). Como o
  // `userEvent.click` dispara `pointermove` antes do clique, o par abrir/fechar
  // caía sempre nessa janela e o segundo clique não chegava a lugar nenhum.
  gatilho.focus();
  await userEvent.keyboard('{Escape}');
  await waitForPanelVanish();
}
