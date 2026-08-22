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

/** O popup compartilhado — um só para a barra inteira. */
export const SELETOR_POPUP = '.nds-navigation-menu-popup';

/** A raiz visual do painel do item ativo, instanciada dentro do viewport. */
export const SELETOR_PAINEL = '.nds-navigation-menu-popup-content';

/** O popup aberto, ou `null`. Consulta o documento inteiro, não o canvas. */
export function popupAberto(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(SELETOR_POPUP);
}

/**
 * Espera o painel abrir E ASSENTAR.
 *
 * Três esperas em uma, e cada uma já custou um teste intermitente em algum
 * componente deste repositório:
 *
 *   · o popup entra no DOM antes de o floating-ui devolver a medida, e até lá
 *     o positioner o mantém escondido — `data-side` é o sinal público de que a
 *     medição terminou, porque o primitivo só o escreve depois de decidir o lado;
 *   · o popup entra com transição de opacidade (`data-starting-style`), e ler
 *     cor ou contraste no primeiro frame mede um elemento translúcido — é assim
 *     que nasce a violação de contraste ~1.0 do axe;
 *   · o conteúdo é instanciado pelo viewport num segundo passo, então o popup
 *     pode existir com o painel ainda vazio.
 */
export async function esperarPainel(timeout = 4000): Promise<HTMLElement> {
  return await waitFor(
    () => {
      const popup = popupAberto();
      if (!popup) throw new Error('painel: o popup ainda não montou');
      if (!popup.hasAttribute('data-side')) {
        throw new Error('painel: ainda sem data-side, o floating-ui não mediu');
      }
      if (popup.hasAttribute('data-closed')) throw new Error('painel: marcado como fechado');
      const opacidade = window.getComputedStyle(popup).opacity;
      if (opacidade !== '1' && Number.parseFloat(opacidade) < 0.9) {
        throw new Error(`painel: opacity=${opacidade}, ainda animando`);
      }
      const painel = popup.querySelector<HTMLElement>(SELETOR_PAINEL);
      if (!painel) throw new Error('painel: o viewport ainda não instanciou o conteúdo');
      return painel;
    },
    { timeout, interval: 50 },
  );
}

/** Espera o painel sumir — prova Escape, clique fora e escolha de destino. */
export async function esperarPainelSumir(timeout = 3000): Promise<void> {
  await waitFor(
    () => {
      if (popupAberto()) throw new Error('painel ainda aberto');
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
  return await esperarPainel();
}

export async function fechar(gatilho: HTMLElement): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.click(gatilho);
  await esperarPainelSumir();
}
