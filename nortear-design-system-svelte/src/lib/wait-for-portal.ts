import { within, waitFor } from 'storybook/test';


/**
 * Regra do axe desligada nas stories que terminam com um overlay ABERTO.
 *
 * O `bits-ui` cerca o conteúdo do painel com âncoras de foco —
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

export async function waitForPortal(
  role: 'tooltip' | 'dialog' | 'listbox' | 'menu' | 'menuitem' | 'option',
  options: { name?: string | RegExp; timeout?: number } = {}
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const body = within(document.body);

  return await waitFor(async () => {
    const el = name
      ? await body.findByRole(role, { name })
      : await body.findByRole(role);
    const styles = window.getComputedStyle(el);
    if (styles.opacity !== '1' && parseFloat(styles.opacity) < 0.9) {
      throw new Error(`Portal ${role} opacity=${styles.opacity}, ainda animando`);
    }
    if (el.getAttribute('data-state') === 'closed') {
      throw new Error(`Portal ${role} data-state=closed`);
    }
    return el;
  }, { timeout, interval: 50 });
}

export async function waitForPortalGone(
  role: 'tooltip' | 'dialog' | 'listbox' | 'menu',
  timeout = 2000
): Promise<void> {
  const body = within(document.body);
  await waitFor(async () => {
    const elements = body.queryAllByRole(role);
    if (elements.length > 0) throw new Error(`Portal ${role} ainda aberto`);
  }, { timeout, interval: 50 });
}
