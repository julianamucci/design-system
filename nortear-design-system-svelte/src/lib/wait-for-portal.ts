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
export const FOCUS_RULE_GUARDA = { id: 'aria-hidden-focus', enabled: false } as const;

/**
 * Regras do axe de uma story que precisa de guarda — **use isto, nunca um array
 * cru**.
 *
 * O Storybook SUBSTITUI array ao mesclar parâmetro, em vez de concatenar. Então
 * `a11y: { config: { rules: [FOCUS_RULE_GUARDA] } }` numa story apaga o `rules`
 * global do `preview.ts`, que é onde `target-size` (WCAG 2.5.8) está ligado — o
 * axe não roda regra 2.2 por default. A story deixa de medir alvo de toque, e
 * nada acusa: o painel fica verde por medir MENOS. É a forma mais cara de
 * portão sem dentes, porque a exceção de UMA regra derruba de carona um portão
 * que fala de outra coisa.
 *
 * Medido em 2026-09-19: 83 arquivos de story nas cinco stacks declaravam array
 * cru, 16 deles nesta — e nenhum preservava a regra global.
 *
 * Uso: `a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } }`. Sem guarda
 * nenhum, não declare `rules`: o global já vale.
 *
 * **O número acima envelhece; o portão não.** Quem cobra esta forma é a regra
 * `regra_de_axe_crua` do `scripts/audit.mjs`, que reprova `rules: [` perto de
 * `a11y` em qualquer story das cinco stacks. Ela nasceu junto com esta
 * conversão, e pelo motivo que o próprio helper ilustra: quando ele foi criado,
 * o docblock dele já trazia a medição do defeito — e a conversão parou em 4
 * arquivos, com o número certo escrito ao lado.
 */
export const axeRules = (...guards: ReadonlyArray<{ id: string; enabled: boolean }>) => [
  { id: 'target-size', enabled: true },
  ...guards,
];

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
