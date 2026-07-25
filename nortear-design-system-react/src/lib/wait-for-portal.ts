import { within, waitFor } from "storybook/test";

/**
 * Aguarda elemento portalizado aparecer + animação concluir.
 * - Procura no document.body (não no canvas — portais escapam)
 * - Aguarda data-state="open" + role visible + opacity>0.5
 */
export async function waitForPortal(
  role:
    | "tooltip"
    | "dialog"
    | "alertdialog"
    | "listbox"
    | "menu"
    | "menuitem"
    | "option",
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const body = within(document.body);

  return await waitFor(
    async () => {
      const el = name
        ? await body.findByRole(role, { name })
        : await body.findByRole(role);
      const styles = window.getComputedStyle(el);
      const opacity = parseFloat(styles.opacity);
      if (styles.opacity !== "1" && opacity < 0.9) {
        throw new Error(`Portal ${role} opacity=${styles.opacity}, ainda animando`);
      }
      if (el.getAttribute("data-state") === "closed") {
        throw new Error(`Portal ${role} data-state=closed`);
      }
      return el;
    },
    { timeout, interval: 50 },
  );
}

/** Aguarda portal fechar (útil pra testar Escape, click outside, etc.) */
export async function waitForPortalGone(
  role: "tooltip" | "dialog" | "alertdialog" | "listbox" | "menu",
  timeout = 2000,
): Promise<void> {
  const body = within(document.body);
  await waitFor(
    async () => {
      const elements = body.queryAllByRole(role);
      if (elements.length > 0) throw new Error(`Portal ${role} ainda aberto`);
    },
    { timeout, interval: 50 },
  );
}
