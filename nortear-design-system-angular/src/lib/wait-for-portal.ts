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
export const FOCUS_RULE_GUARDA = { id: 'aria-hidden-focus', enabled: false } as const;

/**
 * Regras do axe de uma story que precisa de guarda — **use isto, nunca um array
 * cru**.
 *
 * O Storybook SUBSTITUI array ao mesclar parâmetro, em vez de concatenar. Então
 * `a11y: { config: { rules: [FOCUS_RULE_GUARDA] } }` numa story apaga o `rules`
 * global do `.storybook/preview.ts`, que é onde `target-size` (WCAG 2.5.8) está
 * ligado — o axe não roda regra WCAG 2.2 por default, então aquela linha é a
 * única coisa que faz alvo de toque ser medido no repositório inteiro. A story
 * deixa de medir alvo de toque e nada acusa: o painel fica verde por medir
 * menos.
 *
 * É a forma silenciosa do portão que encolhe — a mesma do `source-snippets`,
 * que perdeu 28 exports quando o filtro deixou de casar com o nome. Quem
 * desliga UMA regra apaga de carona um portão que fala de outra coisa, e a
 * exceção fica maior do que quem a escreveu pretendia.
 *
 * Medido no repositório inteiro em 2026-09-19: 83 arquivos de story nas cinco
 * stacks, 22 deles neste stack, e nenhum preservava a regra global.
 *
 * @example
 * a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } }
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

/**
 * Espera um elemento portalizado aparecer e assentar.
 *
 * Overlay não mora no canvas: o portal do primitivo o anexa ao `body`, então
 * `within(canvasElement)` nunca o encontra. Além disso o painel entra com
 * `@keyframes` (fade + zoom) — afirmar sobre ele no primeiro frame lê opacidade
 * intermediária, e é assim que nasce a violação de contraste ~1.0 do axe
 * (elemento em transição, não paleta ruim).
 */
export async function waitForPortal(
  role: 'menu' | 'menuitem' | 'dialog' | 'alertdialog' | 'listbox' | 'tooltip',
  options: { name?: string | RegExp; timeout?: number } = {},
): Promise<HTMLElement> {
  const { name, timeout = 4000 } = options;
  const body = within(document.body);

  return await waitFor(
    async () => {
      const el = name ? await body.findByRole(role, { name }) : await body.findByRole(role);
      const estilo = window.getComputedStyle(el);
      const opacity = Number.parseFloat(estilo.opacity);
      if (estilo.opacity !== '1' && opacity < 0.9) {
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

/**
 * Espera o painel flutuante ASSENTAR, para quem vai MEDIR a posição dele.
 *
 * `waitForPortal` prova que o painel apareceu; isto prova que ele parou de se
 * mexer, que é outra coisa. O popup entra com `@keyframes` (fade + `translateY`
 * + `scale`) e o floating-ui escreve `left`/`top` no invólucro em passo
 * assíncrono: quem lê a caixa antes das duas coisas mede a posição de partida.
 *
 * **Não é um `waitFor`, e a diferença é o ponto.** O `waitFor` da suíte
 * reagenda por observador de mutação e fecha no primeiro quadro em que a
 * condição passa — e numa medida de vão a diferença entre dois candidatos a 1px
 * um do outro já cabe na tolerância enquanto a lib ainda posiciona, de modo que
 * a asserção passa COM o defeito plantado. Medido no vue ao escrever a mesma
 * asserção (D15 do PRD do dropdown-menu). Aqui a espera é de relógio e só LÊ:
 * primeiro as animações terminam, depois a caixa precisa repetir o mesmo valor
 * em duas leituras seguidas. Quem chama mede DIRETO depois disto.
 */
export async function waitForPousado(panel: HTMLElement, timeout = 3000): Promise<void> {
  const alvos = [panel, panel.parentElement].filter((el): el is HTMLElement => el !== null);
  await Promise.all(
    alvos.flatMap((el) =>
      el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)),
    ),
  );

  const limite = Date.now() + timeout;
  let previous = '';
  while (Date.now() < limite) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const caixa = panel.getBoundingClientRect();
    const atual = `${caixa.top}|${caixa.left}|${caixa.width}`;
    if (atual === previous && caixa.width > 0) return;
    previous = atual;
  }
  throw new Error(`o painel não assentou em ${timeout}ms: a caixa ainda muda (${previous})`);
}

/** Espera o portal sumir — para provar Escape, clique fora e seleção de item. */
export async function waitForPortalVanish(
  role: 'menu' | 'dialog' | 'alertdialog' | 'listbox' | 'tooltip',
  timeout = 2000,
): Promise<void> {
  const body = within(document.body);
  await waitFor(
    () => {
      const encontrados = body.queryAllByRole(role);
      if (encontrados.length > 0) throw new Error(`portal ${role} ainda aberto`);
    },
    { timeout, interval: 50 },
  );
}
