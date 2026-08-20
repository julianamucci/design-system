import { expect, screen, userEvent, waitFor } from 'storybook/test';

/**
 * Andaimes de teste do Popover — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * `painel` e `abrir` estavam copiadas byte a byte nos quatro arquivos, com as
 * mesmas duas esperas. O que estava repartido era a EXPLICAÇÃO: só
 * `popover.stories.ts` dizia por que o painel se procura no `document` e não no
 * canvas, e só ele dizia por que a abertura é idempotente. As duas notas vieram
 * para cá.
 */

/** O painel mora em portal no body — `screen`, não `within(canvasElement)`. */
export function painel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

/** Abre só se estiver fechado — a play REEXECUTA no mesmo DOM. */
export async function abrir(gatilho: HTMLElement): Promise<void> {
  if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
  // Esperar pela VISIBILIDADE, não pela presença no DOM: o positioner nasce
  // com visibility hidden e só aparece depois que o floating-ui mede a posição.
  // Nesse intervalo o painel existe mas está fora da árvore de acessibilidade —
  // getByRole('dialog') não o acha e nada dentro dele recebe foco.
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
  // E esperar o foco assentar DENTRO do painel: a abertura o move no quadro
  // seguinte ao da medição, e mexer no foco antes disso disputaria com o
  // próprio componente — a ordem de tabulação medida sairia invertida.
  await waitFor(() => expect(painel()!.contains(document.activeElement)).toBe(true));
}
