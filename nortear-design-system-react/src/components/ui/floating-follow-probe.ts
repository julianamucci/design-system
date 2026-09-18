// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam que um painel ABERTO continua colado ao gatilho
// quando o gatilho se move (D10). O equivalente do Vanilla é
// `nortear-design-system-vanilla/src/components/ui/floating-follow-probe.ts`, e
// esta é a mesma pergunta medida com os instrumentos desta stack. Fica fora dos
// `*.stories.tsx` porque ali todo export nomeado vira story.
//
// Nesta stack quem acompanha é o `autoUpdate` do `@floating-ui`, ligado pelo
// base-ui por `whileElementsMounted` enquanto o painel está montado
// (`internals/useAnchorPositioning.js:316`). Sem asserção nenhuma, um bump de
// lib que o desligasse fecharia a suíte VERDE.
//
// **Duas coisas mudam em relação ao Vanilla, as duas MEDIDAS, não presumidas:**
//
//  1. **a cena cutuca por `scroll`, e pode.** O `autoUpdate` escuta `scroll` em
//     cada ancestral rolável e na JANELA (`getOverflowAncestors` devolve `win`
//     quando o ancestral rolável é o `body`), e o base-ui NÃO dispensa o cartão
//     por rolagem — ao contrário da `reka-ui`, que por isso obriga o vue a
//     cutucar por `resize`.
//  2. **a coordenada não está no painel.** Quem recebe posição é o
//     `.nds-hover-card-positioner`, e o base-ui escreve ali o `transform` do
//     `floatingStyles` — o painel não tem `left` nenhum para ler, ao contrário
//     do Vanilla. A medida é a caixa do painel, e ela é estável porque desde a
//     D14 nada anima aqui, nem na entrada nem na saída.
//
// Por que `transform` e não `margin` para deslocar o gatilho: deslocar é mecânica
// de cena, e `transform` é propriedade mecânica para o portão de estilo inline;
// `margin` é valor de desenho e reprovaria. Ele também não muda o TAMANHO de
// nada, então o `ResizeObserver` do acompanhamento não entra na conta — quem
// move o painel aqui é só a rolagem, que é o que se quer provar.

import { expect } from "storybook/test";

/** Quanto o gatilho é deslocado, em px. */
const SHIFT = 40;

/** Frouxidão para arredondamento de subpixel. */
const TOLERANCE = 2;

/** Espera `count` quadros — o acompanhamento agrupa por `requestAnimationFrame`. */
export async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/**
 * Lê a coordenada do painel até ela PARAR de mudar, ou até o prazo acabar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 */
async function settledLeft(panel: HTMLElement, timeout = 1000): Promise<number> {
  const deadline = performance.now() + timeout;
  let last = panel.getBoundingClientRect().left;
  let stable = 0;
  while (performance.now() < deadline && stable < 3) {
    await nextFrames(1);
    const current = panel.getBoundingClientRect().left;
    stable = Math.abs(current - last) < 0.5 ? stable + 1 : 0;
    last = current;
  }
  return last;
}

/**
 * Desloca `shifted` 40px para a direita, dispara `scroll` na janela e afirma que
 * o painel andou os mesmos 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Medido nesta stack: sem `startAt`, o gatilho andava 40px e o painel
 * 20px (esquerda 5px → 25px), porque os primeiros 20 eram o destravamento.
 *
 * Restaura o `transform` num `finally`, ANTES de afirmar: o replay do painel
 * Interactions tem de partir do estado original, e uma asserção que reprova não
 * pode deixar o gatilho deslocado para trás.
 */
export async function checkPanelFollowsTrigger(
  panel: HTMLElement,
  shifted: HTMLElement,
  { startAt = 0 }: { startAt?: number } = {},
): Promise<void> {
  const previous = shifted.style.transform;
  // Campos de um objeto, e não duas variáveis: atribuição dentro de `try` com
  // leitura depois do `finally` é exatamente o que o `no-useless-assignment`
  // reprova quando a declaração já traz um valor.
  const measurement = { before: Number.NaN, after: Number.NaN };

  try {
    if (startAt !== 0) {
      shifted.style.transform = `translateX(${startAt}px)`;
      window.dispatchEvent(new Event("scroll"));
      await nextFrames(2);
    }
    measurement.before = await settledLeft(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    window.dispatchEvent(new Event("scroll"));
    measurement.after = await settledLeft(panel);
  } finally {
    shifted.style.transform = previous;
    window.dispatchEvent(new Event("scroll"));
    await nextFrames(2);
  }

  await expect(Number.isFinite(measurement.before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = measurement.after - measurement.before;
  await expect(
    Math.abs(moved - SHIFT),
    `O gatilho andou ${SHIFT}px e o painel andou ${moved.toFixed(1)}px `
      + `(esquerda ${measurement.before.toFixed(1)}px → ${measurement.after.toFixed(1)}px).`,
  ).toBeLessThanOrEqual(TOLERANCE);
}
