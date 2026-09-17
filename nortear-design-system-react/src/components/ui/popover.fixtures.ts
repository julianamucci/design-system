import { expect, screen, userEvent, waitFor } from "storybook/test";

/**
 * Andaimes de teste do Popover — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.tsx` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * O módulo nasceu em 2026-09-16, e o que ele corrige não era repetição — era
 * DIVERGÊNCIA. Havia duas definições de `panel()` nesta stack, com contratos
 * opostos:
 *
 *   `popover.stories.tsx`              → `querySelector`, devolve `null` fechado
 *   `popover-compositions.stories.tsx` → `getByRole('dialog')`, ESTOURA fechado
 *
 * Mesmo nome, mesma leitura aparente, e comportamentos que só divergem no
 * caminho de erro — que é justamente onde uma story precisa poder reprovar. A
 * que estoura transforma "o painel fechou" numa exceção de busca em vez de uma
 * asserção com mensagem, e foi por isso que a versão do `querySelector` venceu:
 * fechado, o painel não existe, e `null` é a resposta honesta.
 *
 * É a mesma forma das outras quatro stacks, que já tinham o módulo.
 */

/** O painel mora em portal no body — `document`, não `within(canvasElement)`. */
export function panel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="popover-content"]');
}

/** Abre só se estiver fechado — a play REEXECUTA no mesmo DOM. */
export async function open(trigger: HTMLElement): Promise<HTMLElement> {
  if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
  // Esperar pela VISIBILIDADE, e não pela presença no DOM: o positioner nasce
  // escondido e só aparece depois de o floating-ui medir a posição. Nesse
  // intervalo o painel existe mas está fora da árvore de acessibilidade —
  // `getByRole('dialog')` não o acha e nada dentro dele recebe foco.
  await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
  return panel()!;
}

/** Fecha só se estiver aberto — par idempotente de `open`, e pelo mesmo motivo. */
export async function close(trigger: HTMLElement): Promise<void> {
  if (trigger.getAttribute("aria-expanded") === "true") await userEvent.click(trigger);
  await waitFor(() => expect(panel()).toBeNull());
}
