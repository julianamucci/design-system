import { within, waitFor } from "storybook/test";

type PortalRole =
  | "tooltip"
  | "dialog"
  | "alertdialog"
  | "listbox"
  | "menu"
  | "menuitem"
  | "option";

/**
 * Menor opacidade computada entre o elemento e seus ancestrais até o body.
 * `toBeVisible()` reprova se qualquer ancestral estiver em opacity 0, então a
 * espera precisa olhar a cadeia inteira — não só o nó portalizado.
 */
function effectiveOpacity(el: HTMLElement): number {
  let node: HTMLElement | null = el;
  let min = 1;
  while (node && node !== document.body) {
    const value = parseFloat(window.getComputedStyle(node).opacity);
    if (!Number.isNaN(value)) min = Math.min(min, value);
    node = node.parentElement;
  }
  return min;
}

/**
 * Aguarda um elemento portalizado montar E a animação de entrada concluir.
 *
 * Sem o portão de opacidade a asserção roda no quadro zero da animação, quando
 * o painel já está no DOM com `data-state="open"` mas ainda em `opacity: 0` —
 * e `toBeVisible()` reprova um elemento que ia aparecer alguns quadros depois.
 * É a mesma classe de falha que a emulação de `prefers-reduced-motion`
 * escondia no CI.
 */
export async function waitForPortal(
  role: PortalRole,
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 6000 } = options;
  const body = within(document.body);

  return await waitFor(
    async () => {
      // Em casos onde o portal Reka aparece com data-state=open mas findByRole
      // ignora por aria-hidden temporário, fallback para querySelector direto.
      let el: HTMLElement;
      try {
        el = name
          ? await body.findByRole(role, { name })
          : await body.findByRole(role);
      } catch (err) {
        const candidate = document.querySelector(
          `[role="${role}"][data-state="open"]`,
        ) as HTMLElement | null;
        if (!candidate) throw err;
        el = candidate;
      }

      if (el.getAttribute("data-state") === "closed") {
        throw new Error(`Portal ${role} com data-state=closed`);
      }

      const opacity = effectiveOpacity(el);
      if (opacity < 0.9) {
        throw new Error(`Portal ${role} em opacity=${opacity}, ainda animando`);
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
