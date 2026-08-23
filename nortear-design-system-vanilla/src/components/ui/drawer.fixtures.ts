import { userEvent, within } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { drawerClearPortais } from './drawer-portal-cleanup';

/**
 * Andaime de abertura do Drawer — um helper, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As duas cópias divergiam no NOME DO GATILHO, e a divergência tinha motivo: as
 * variantes documentam as quatro direções com o mesmo rótulo "Abrir", então a
 * cópia de lá cravava o padrão no corpo e nem recebia o argumento; as
 * composições nomeiam a ação de cada cenário ("Editar perfil", "Remover
 * anexo", "Ler termos") e precisavam passá-lo. Virou parâmetro com padrão —
 * cada arquivo continua abrindo exatamente o gatilho que abria.
 */

/**
 * Abre pelo gatilho, e só se ainda estiver fechado (a play é reexecutável).
 *
 * `drawerClearPortais` vem antes do clique porque o painel vive num portal
 * no `body`: um resto da rodada anterior faria a espera casar com o painel
 * velho.
 */
export async function openPeloTrigger(
  canvasElement: HTMLElement,
  name: RegExp = /^abrir$/i,
): Promise<HTMLElement> {
  drawerClearPortais();
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(within(canvasElement).getByRole('button', { name: name }));
  }
  return await waitForPortal('dialog');
}
