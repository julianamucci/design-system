import { within, waitFor } from 'storybook/test';

/**
 * Regra do axe desligada nas stories que terminam com um overlay ABERTO.
 *
 * O `@radix-ng/primitives` cerca o conteúdo portalizado com duas âncoras de
 * foco — `<span tabindex="0" aria-hidden="true">` de 1px, fora do fluxo — e é
 * elas que devolvem o foco ao limite certo quando o Tab entra ou sai do portal.
 * O axe lê a combinação `aria-hidden` + focável como armadilha de foco
 * (`aria-hidden-focus`), que é justamente o contrário do que essas âncoras
 * fazem: elas existem para o Tab NÃO ficar preso.
 *
 * Tirar o `aria-hidden` calaria o axe e faria o leitor de tela anunciar dois
 * elementos vazios em todo menu; tirar o `tabindex` desmontaria o mecanismo. A
 * correção é da lib e está reportada — desligar a regra é o que mantém as
 * outras 90 valendo enquanto isso.
 */
export const REGRA_GUARDA_DE_FOCO = { id: 'aria-hidden-focus', enabled: false } as const;

/**
 * Espera um elemento portalizado aparecer e assentar.
 *
 * Overlay não mora no canvas: o portal do primitivo o anexa ao `body`, então
 * `within(canvasElement)` nunca o encontra. Além disso o painel entra com
 * `@keyframes` (fade + zoom) — afirmar sobre ele no primeiro frame lê opacidade
 * intermediária, e é assim que nasce a violação de contraste ~1.0 do axe
 * (elemento em transição, não paleta ruim).
 */
export async function esperarPortal(
  role: 'menu' | 'menuitem' | 'dialog' | 'alertdialog' | 'listbox' | 'tooltip',
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const corpo = within(document.body);

  return await waitFor(
    async () => {
      const el = name ? await corpo.findByRole(role, { name }) : await corpo.findByRole(role);
      const estilo = window.getComputedStyle(el);
      const opacidade = Number.parseFloat(estilo.opacity);
      if (estilo.opacity !== '1' && opacidade < 0.9) {
        throw new Error(`portal ${role}: opacity=${estilo.opacity}, ainda animando`);
      }
      // `data-closed` é a marca de fechado do Radix NG (convenção do Base UI);
      // `data-state="closed"` cobre o mesmo caso nas outras libs.
      if (el.hasAttribute('data-closed') || el.getAttribute('data-state') === 'closed') {
        throw new Error(`portal ${role}: ainda marcado como fechado`);
      }
      return el;
    },
    { timeout, interval: 50 },
  );
}

/** Espera o portal sumir — para provar Escape, clique fora e seleção de item. */
export async function esperarPortalSumir(
  role: 'menu' | 'dialog' | 'alertdialog' | 'listbox' | 'tooltip',
  timeout = 2000,
): Promise<void> {
  const corpo = within(document.body);
  await waitFor(
    () => {
      const encontrados = corpo.queryAllByRole(role);
      if (encontrados.length > 0) throw new Error(`portal ${role} ainda aberto`);
    },
    { timeout, interval: 50 },
  );
}
