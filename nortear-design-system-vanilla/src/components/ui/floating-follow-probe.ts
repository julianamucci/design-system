// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam o `autoUpdateFloating` de `@/lib/floating`: com o
// painel aberto, o gatilho anda e a página rola — o painel tem de andar junto.
//
// Mora fora dos `*.stories.ts` porque ali todo export nomeado vira story, e mora
// num módulo só porque seis componentes fazem a MESMA pergunta (tooltip,
// hover-card, dropdown-menu, popover e o submenu do menubar e do context-menu).
// Seis cópias da conta seriam seis portões que envelhecem cada um no seu ritmo.
//
// Por que `transform` e não `margin`: deslocar o gatilho é mecânica de cena, e
// `transform` é propriedade mecânica para o portão de estilo inline; `margin`
// é valor de desenho e reprovaria. Ele também não muda o TAMANHO de nada, então
// o `ResizeObserver` do acompanhamento não é acionado — quem move o painel aqui
// é SÓ o evento de rolagem, que é o que se quer provar.
//
// Por que medir `style.left` e não `getBoundingClientRect()`: os painéis entram
// com animação de escala, e a caixa medida no meio dela anda sozinha. `left` é
// a coordenada que o posicionador escreve — é exatamente o que reposicionar
// muda, e não muda por nenhum outro motivo.

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

/**
 * Desloca `shifted` 40px para a direita, dispara `scroll` na janela, espera dois
 * quadros e afirma que o painel andou os mesmos 40px (±2).
 *
 * `startAt` existe para o gatilho encostado na borda ESQUERDA do canvas: ali o
 * painel centrado já nasce travado no respiro da janela, e os primeiros pixels
 * do deslocamento são engolidos pelo travamento — o painel andaria menos que o
 * gatilho estando CERTO. Com `startAt`, a cena primeiro leva o gatilho até
 * longe da borda (o que já exige reposicionar) e só então mede os 40px.
 *
 * Restaura o `transform` e dispara de novo ANTES de afirmar, num `finally`: o
 * replay do painel Interactions tem de partir do estado original, e uma
 * asserção que reprova não pode deixar o gatilho deslocado para trás.
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
      window.dispatchEvent(new Event('scroll'));
      await nextFrames(2);
    }
    before = parseFloat(panel.style.left);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    window.dispatchEvent(new Event('scroll'));
    await nextFrames(2);
    after = parseFloat(panel.style.left);
  } finally {
    shifted.style.transform = previous;
    window.dispatchEvent(new Event('scroll'));
    await nextFrames(2);
  }

  await expect(Number.isFinite(before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = after - before;
  if (Math.abs(moved - SHIFT) > TOLERANCE) {
    throw new Error(
      `O gatilho andou ${SHIFT}px e o painel andou ${moved}px (left ${before}px → ${after}px).`,
    );
  }
  await expect(Math.abs(moved - SHIFT)).toBeLessThanOrEqual(TOLERANCE);
}
