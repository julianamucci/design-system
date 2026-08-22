import { within, waitFor } from "storybook/test";


/**
 * Regra do axe desligada nas stories que terminam com um overlay ABERTO.
 *
 * O `reka-ui` cerca o conteúdo do painel com âncoras de foco —
 * `<span tabindex="0" aria-hidden="true">` de 1px, fora do fluxo — e são elas
 * que devolvem o foco ao limite certo quando o Tab entra ou sai do painel. O
 * axe lê a combinação `aria-hidden` + focável como armadilha de foco
 * (`aria-hidden-focus`), que é justamente o contrário do que essas âncoras
 * fazem: elas existem para o Tab NÃO ficar preso.
 *
 * Tirar o `aria-hidden` calaria o axe e faria o leitor de tela anunciar dois
 * elementos vazios em todo painel; tirar o `tabindex` desmontaria o mecanismo.
 * A correção é da lib — desligar a regra é o que mantém as outras valendo
 * enquanto isso. Mesma decisão já tomada no stack Angular, pelo mesmo motivo.
 */
export const REGRA_GUARDA_DE_FOCO = { id: 'aria-hidden-focus', enabled: false } as const;

/**
 * Regra do axe desligada nas stories cuja lista aberta é longa o bastante para
 * ROLAR.
 *
 * `scrollable-region-focusable` existe para o caso do Safari, que não rola uma
 * caixa sem elemento focável dentro. A própria regra **isenta o popup de um
 * combobox** — porque ali a rolagem já é comandada pelo teclado: as setas andam
 * pelas opções e a opção destacada é trazida para a vista. No `reka-ui`, porém,
 * quem carrega o `overflow` é o viewport, um nó ABAIXO do popup, e a isenção
 * não alcança um nível.
 *
 * As três saídas possíveis foram medidas e todas trocam esta violação por
 * outra (ver o comentário no `SelectContent.vue`): `tabindex` com
 * `role="presentation"` cai em `presentation-role-conflict`; sem role, cai em
 * `aria-required-children`; com `role="group"`, passa no axe mas acrescenta um
 * grupo anônimo em volta de toda lista, que o leitor de tela anuncia.
 *
 * O `overflow` é cravado em estilo inline pela lib, então nem a folha
 * compartilhada o alcança sem `!important` — e mover a rolagem para o popup
 * apagaria os botões de rolagem, que leem o scroll do viewport. A correção é da
 * lib; desligar esta regra é o que mantém as outras valendo enquanto isso.
 *
 * Use SÓ em story cuja lista realmente transborda. Lista curta que passar a
 * rolar tem de falhar, para alguém olhar.
 */
export const LIST_RULE_SCROLL = {
  id: 'scrollable-region-focusable',
  enabled: false,
} as const;

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
