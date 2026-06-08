import { within, waitFor } from "storybook/test";

export async function waitForPortal(
  role: "tooltip" | "dialog" | "listbox" | "menu" | "menuitem" | "option",
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 6000 } = options;
  const body = within(document.body);

  // Find the element with extended timeout to allow portal mount + open animation.
  // Em casos onde o portal Reka aparece com data-state=open mas findByRole ignora
  // por aria-hidden temporário, fallback para querySelector direto.
  let el: HTMLElement;
  try {
    el = name
      ? await body.findByRole(role, { name }, { timeout })
      : await body.findByRole(role, undefined, { timeout });
  } catch (err) {
    const candidate = document.querySelector(
      `[role="${role}"][data-state="open"]`,
    ) as HTMLElement | null;
    if (candidate) {
      el = candidate;
    } else {
      throw err;
    }
  }

  // If the element exists but is mid-close animation, wait briefly for a re-open
  // or settle. Failures here fall through so callers see the original element.
  if (el.getAttribute("data-state") === "closed") {
    try {
      await waitFor(
        () => {
          if (el.getAttribute("data-state") === "closed") {
            throw new Error("still closing");
          }
        },
        { timeout: 500, interval: 50 },
      );
    } catch {
      /* tolerate — element exists, caller can still assert */
    }
  }

  return el;
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
