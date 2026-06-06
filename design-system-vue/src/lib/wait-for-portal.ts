import { within, waitFor } from "storybook/test";

export async function waitForPortal(
  role: "tooltip" | "dialog" | "listbox" | "menu" | "menuitem" | "option",
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const body = within(document.body);

  return await waitFor(
    async () => {
      const el = name
        ? await body.findByRole(role, { name }, { timeout: 200 })
        : await body.findByRole(role, undefined, { timeout: 200 });
      // Reka-ui uses data-state for animation lifecycle. "closed" means fade-out in
      // progress; only treat that as "still animating". Don't gate on opacity — some
      // variants animate via transform only and opacity stays at "1".
      if (el.getAttribute("data-state") === "closed") {
        throw new Error(`Portal ${role} data-state=closed`);
      }
      // Visibility hidden = still mounting
      const styles = window.getComputedStyle(el);
      if (styles.visibility === "hidden") {
        throw new Error(`Portal ${role} visibility=hidden`);
      }
      return el;
    },
    { timeout, interval: 50 },
  );
}

export async function waitForPortalGone(
  role: "tooltip" | "dialog" | "listbox" | "menu",
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
