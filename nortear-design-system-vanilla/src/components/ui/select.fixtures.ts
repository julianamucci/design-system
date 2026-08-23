// Fixtures compartilhadas pelas stories do Select.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado ali apareceria na sidebar como se fosse um exemplo.
//
// As três cópias que existiam — variantes, estados e composições — tinham corpo
// IDÊNTICO; o que divergia era o jsdoc, e cada arquivo guardava um pedaço do
// motivo. Aqui os motivos ficam juntos, uma vez só.

import { userEvent } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSelect } from './select';

/**
 * Campo com rótulo externo associado por `for`/`id`.
 *
 * O nome acessível vem do `aria-label`: `role="combobox"` não aceita nome vindo
 * do próprio conteúdo, e o conteúdo do gatilho é o valor exibido.
 */
export function withLabel(
  id: string,
  label: string,
  options: Parameters<typeof createSelect>[0],
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'nds-text-body nds-font-semibold';
  labelEl.textContent = label;

  wrap.append(labelEl, createSelect({ ...options, id, 'aria-label': label }));
  return wrap;
}

/**
 * Abre a lista partindo sempre de fechada.
 *
 * Fechar antes de clicar garante um clique REAL nesta rodada — o painel
 * Interactions reexecuta a play no mesmo DOM, e um clique cego alternaria o
 * estado em vez de estabelecê-lo.
 */
export function abridor(trigger: HTMLElement) {
  return async () => {
    if (trigger.getAttribute('aria-expanded') === 'true') {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
    }
    await userEvent.click(trigger);
    return await waitForPortal('listbox');
  };
}
