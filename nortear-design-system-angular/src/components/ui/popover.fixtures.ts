import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';
import { popoverCloseReason } from './popover-close-reason';

/**
 * Andaimes de teste do Popover — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * `panel` e `open` estavam copiadas byte a byte nos quatro arquivos, com as
 * mesmas duas esperas. O que estava repartido era a EXPLICAÇÃO: só
 * `popover.stories.ts` dizia por que o painel se procura no `document` e não no
 * canvas, e só ele dizia por que a abertura é idempotente. As duas notas vieram
 * para cá.
 */

/** O painel mora em portal no body — `screen`, não `within(canvasElement)`. */
export function panel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

/** Abre só se estiver fechado — a play REEXECUTA no mesmo DOM. */
export async function open(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
  // Esperar pela VISIBILIDADE, não pela presença no DOM: o positioner nasce
  // com visibility hidden e só aparece depois que o floating-ui mede a posição.
  // Nesse intervalo o painel existe mas está fora da árvore de acessibilidade —
  // getByRole('dialog') não o acha e nada dentro dele recebe foco.
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
  // E esperar o foco assentar DENTRO do painel: a abertura o move no quadro
  // seguinte ao da medição, e mexer no foco antes disso disputaria com o
  // próprio componente — a ordem de tabulação medida sairia invertida.
  await waitFor(() => expect(panel()!.contains(document.activeElement)).toBe(true));
}

/**
 * Fecha pelo gatilho, e só se ele ainda estiver expandido.
 *
 * Par idempotente de `open`, e pelo mesmo motivo: a play REEXECUTA no mesmo DOM.
 * Estava só em `popover.stories.ts`, onde nasceu; veio para cá quando a segunda
 * story precisou fechar e reabrir o painel para medir uma reposição.
 */
export async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
  await waitFor(() => expect(panel()).toBeNull());
}

/**
 * Espião dos FECHAMENTOS de uma story, já no vocabulário do design system.
 *
 * Duas entradas, porque nesta stack são dois caminhos que não se cruzam:
 *
 *  · `recordOpenChange` liga no `(onOpenChange)` e recebe o que a LIB conduz —
 *    Escape, clique fora, perda de foco, a peça de fechar;
 *  · `recordConclude` é chamado pela própria story quando ela fecha por CÓDIGO.
 *    Escrever no `[(open)]` fecha o painel sem passar pelo `close()` do
 *    radix-ng, e o `onOpenChange` não nasce — é por isso que a docs page emite
 *    o `popover_close` com `api` à mão (`concluir()` no `PopoverDocs.ts`), e a
 *    story repete essa forma em vez de inventar outra.
 *
 * O que a contagem prova é o par: o fechamento por código é anunciado UMA vez,
 * como `api`. Se a ação de concluir também passasse pela lib — marcada como
 * peça de fechar, por exemplo —, chegaria um `close-button` junto e a contagem
 * reprovaria.
 */
export function closeSpy() {
  const spy = fn();
  return {
    spy,
    recordOpenChange(event: { open: boolean; reason?: string }): void {
      spy(event.open, event.open ? undefined : popoverCloseReason(event.reason));
    },
    recordConclude(): void {
      spy(false, 'api');
    },
    closeCount(): number {
      return spy.mock.calls.filter(([isOpen]) => isOpen === false).length;
    },
  };
}

/** Espera de RELÓGIO antes de contar: `waitFor` não prova que um segundo anúncio NÃO chegou. */
export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150));
}
