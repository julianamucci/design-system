import { within, waitFor } from "storybook/test";

/**
 * Regra do axe desligada nas stories que terminam com um overlay ABERTO.
 *
 * O `@base-ui/react` cerca o conteúdo portalizado com âncoras de foco —
 * `<span tabindex="0" aria-hidden="true">` de 1px, fora do fluxo
 * (`data-base-ui-focus-guard`) — e são elas que devolvem o foco ao limite certo
 * quando o Tab entra ou sai do portal. O axe lê a combinação `aria-hidden` +
 * focável como armadilha de foco (`aria-hidden-focus`), que é justamente o
 * contrário do que essas âncoras fazem: elas existem para o Tab NÃO ficar preso.
 *
 * Tirar o `aria-hidden` calaria o axe e faria o leitor de tela anunciar dois
 * elementos vazios em todo painel; tirar o `tabindex` desmontaria o mecanismo. A
 * correção é da lib — desligar a regra é o que mantém as outras valendo
 * enquanto isso. Mesma decisão já tomada no stack Angular, pelo mesmo motivo.
 */
export const FOCUS_RULE_GUARDA = { id: "aria-hidden-focus", enabled: false } as const;

/**
 * Regra do axe desligada nas stories que terminam com um MENU ANINHADO aberto.
 *
 * Ao abrir um popup filho, o `@base-ui/react` deixa no menu pai um
 * `<span aria-owns="…">` — é ele que amarra o popup, que vive em portal, ao item
 * que o dispara. Essa associação é justamente o que faz o leitor de tela
 * anunciar a relação; o axe, porém, só olha a lista de filhos permitidos do
 * papel do pai (`aria-required-children`) e vê um `<span>` estranho ali.
 *
 * Vale para submenu dentro de `role="menu"` E para o menubar: a lib trata cada
 * menu da barra como popup filho, então o `<span>` aparece dentro do
 * `role="menubar"` sempre que QUALQUER menu está aberto — não só quando há
 * submenu. Foi essa segunda forma que reprovou sete stories de uma vez.
 *
 * Não há saída pelo nosso lado: tirar o span quebraria a associação, e fechar o
 * submenu no fim da story contrariaria `testes.visual.item3`, que descreve o
 * submenu ABERTO. A correção é da lib — desligar a regra é o que mantém as
 * outras valendo enquanto isso.
 */
export const MENU_RULE_CHILDREN = {
  id: "aria-required-children",
  enabled: false,
} as const;

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
    | "option"
    | "button",
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
