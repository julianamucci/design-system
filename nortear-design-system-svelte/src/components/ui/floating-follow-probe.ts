// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam que um painel ABERTO continua colado ao gatilho
// quando o gatilho se move (D10). O equivalente do Vanilla é
// `nortear-design-system-vanilla/src/components/ui/floating-follow-probe.ts`, e
// esta é a mesma pergunta medida com os instrumentos desta stack. Fica fora dos
// `*.stories.ts` porque ali todo export nomeado vira story.
//
// **Duas coisas mudam em relação ao Vanilla, as duas MEDIDAS, não presumidas:**
//
//  1. **a coordenada não está no painel.** No Vanilla quem se posiciona é o
//     próprio painel, e o portão lê `panel.style.left`. Aqui o `@floating-ui`
//     que o bits-ui liga escreve `transform: translate(...)` no invólucro
//     anônimo da lib (`[data-bits-floating-content-wrapper]`, montado em
//     `use-floating-layer.svelte.js:127-140`), com o painel em FLUXO dentro
//     dele: `panel.style.left` devolveria `NaN` a cada rodada, que é asserção
//     que não pode reprovar. A medida é a caixa do painel — e ela é estável
//     porque desde a D14 esta folha não anima nada, nem na entrada nem na saída.
//  2. **a cena cutuca por `resize`, não por rolagem.** É o mesmo caminho que o
//     `withSceneAwayFromEdge` da sonda compartilhada usa, e pelo mesmo motivo:
//     em pelo menos uma das libs da casa rolar DISPENSA o cartão em vez de
//     reposicioná-lo, então uma cena que rola não mediria acompanhamento em
//     todas. O `autoUpdate` do `@floating-ui` mantém ouvinte de `resize` da
//     janela, e é esse ouvinte que some se um bump de lib desligar o
//     acompanhamento.
//
// Por que `transform` e não `margin` para deslocar o gatilho: deslocar é mecânica
// de cena, e `transform` é propriedade mecânica para o portão de estilo inline;
// `margin` é valor de desenho e reprovaria. Ele também não muda o TAMANHO de
// nada, então o `ResizeObserver` do acompanhamento não entra na conta.

import { expect } from 'storybook/test';

/** Quanto o gatilho é deslocado, em px. */
const SHIFT = 40;

/** Frouxidão para arredondamento de subpixel. */
const TOLERANCE = 2;

/** Espera `count` quadros — o acompanhamento agrupa por `requestAnimationFrame`. */
export async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

/** Coordenada que a cena observa: a borda esquerda da caixa do painel. */
function leftEdge(panel: HTMLElement): number {
  return panel.getBoundingClientRect().left;
}

/**
 * Cutuca o acompanhamento e espera o painel parar de onde estava.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 */
async function nudgeAndMeasure(panel: HTMLElement, from: number, timeout = 1000): Promise<number> {
  window.dispatchEvent(new Event('resize'));
  await nextFrames(2);
  const deadline = performance.now() + timeout;
  let current = leftEdge(panel);
  while (current === from && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 32));
    current = leftEdge(panel);
  }
  return current;
}

/**
 * Desloca `shifted` 40px para a direita e afirma que o painel andou os mesmos
 * 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Medido nesta stack sem ele, na `States/Controlled`: o gatilho andou
 * 40px e o painel andou 25, partindo de `left 0`. Com `startAt`, a cena primeiro
 * leva o gatilho para longe da borda e só então mede os 40px.
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
  let before: number;
  let after: number;

  try {
    if (startAt !== 0) {
      shifted.style.transform = `translateX(${startAt}px)`;
      await nudgeAndMeasure(panel, leftEdge(panel));
    }
    before = leftEdge(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    after = await nudgeAndMeasure(panel, before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await nudgeAndMeasure(panel, leftEdge(panel), 300);
  }

  await expect(Number.isFinite(before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = after - before;
  if (Math.abs(moved - SHIFT) > TOLERANCE) {
    throw new Error(
      `O gatilho andou ${SHIFT}px e o painel andou ${moved}px (esquerda ${before}px → ${after}px).`,
    );
  }
  await expect(Math.abs(moved - SHIFT)).toBeLessThanOrEqual(TOLERANCE);
}
