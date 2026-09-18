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
//  1. **a cena não pode rolar a janela.** A `reka-ui` DISPENSA o cartão quando um
//     ancestral rolável do gatilho rola — `HoverCardContentImpl.js:150-153`
//     escuta `scroll` em `window` na fase de captura e chama `onDismiss()` se o
//     alvo do evento contém o gatilho. Rolar aqui não provaria acompanhamento:
//     fecharia o cartão. (E um `new Event('scroll')` disparado em `window` ainda
//     por cima explodiria dentro do ouvinte da lib, porque `window.contains` não
//     existe.) A cena move o GATILHO e cutuca o `autoUpdate` do `@floating-ui`
//     pelo caminho que a lib mantém e que nada dispensa: o `resize` da janela.
//     É esse ouvinte que some se um bump de lib desligar o acompanhamento.
//  2. **a coordenada não está no painel.** Quem recebe posição é o invólucro
//     anônimo que a lib monta em volta (`transform: translate(...)` vindo do
//     `floatingStyles`), e o painel não tem `left` nenhum para ler. A medida é a
//     caixa do painel — e ela é estável porque desde a D14 nada anima aqui, nem
//     na entrada nem na saída.
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
function bordaEsquerda(panel: HTMLElement): number {
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
async function moverEMedir(panel: HTMLElement, antes: number, timeout = 1000): Promise<number> {
  window.dispatchEvent(new Event('resize'));
  await nextFrames(2);
  const fim = performance.now() + timeout;
  let atual = bordaEsquerda(panel);
  while (atual === antes && performance.now() < fim) {
    await new Promise<void>((resolve) => setTimeout(resolve, 32));
    atual = bordaEsquerda(panel);
  }
  return atual;
}

/**
 * Desloca `shifted` 40px para a direita e afirma que o painel andou os mesmos
 * 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Com `startAt`, a cena primeiro leva o gatilho para longe da borda e só
 * então mede os 40px.
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
      await moverEMedir(panel, bordaEsquerda(panel));
    }
    before = bordaEsquerda(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    after = await moverEMedir(panel, before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await moverEMedir(panel, bordaEsquerda(panel), 300);
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
