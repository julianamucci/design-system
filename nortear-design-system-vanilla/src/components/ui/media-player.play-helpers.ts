/**
 * Auxiliares de play do MediaPlayer.
 *
 * Separados das fixtures porque a docs page importa aquelas, e arrastar o
 * runner de teste para dentro dela levaria o pacote junto.
 */

/**
 * Espera de RELÓGIO com prazo. Nunca `waitFor`.
 *
 * O `waitFor` da suíte reagenda por observador de mutação: se a condição toca o
 * DOM e a primeira tentativa falha, a própria tentativa provoca a próxima, o
 * prazo nunca chega e a aba morre sem resultado E sem falha — medido, 420s de
 * CPU sem reportar. Um laço de relógio reprova em segundos.
 *
 * Devolve a condição avaliada uma última vez, para a asserção poder falar sobre
 * ela em vez de sobre o tempo.
 */
export async function until(condition: () => boolean, deadline = 4000): Promise<boolean> {
  const end = Date.now() + deadline;
  while (Date.now() < end) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return condition();
}

/**
 * A mesma mensagem que o provedor manda, encenada.
 *
 * `source` é o que o player confere para descartar mensagem de terceiro — sem
 * ele a encenação seria indistinguível de um anúncio na página, e o player a
 * ignoraria com razão.
 */
export function messageFromFrame(frame: HTMLIFrameElement, data: unknown): void {
  window.dispatchEvent(new MessageEvent('message', { data, source: frame.contentWindow }));
}

/** O botão de tocar é o primeiro da barra — o único encontrável antes de ter nome. */
export function firstControl(root: HTMLElement): HTMLButtonElement {
  return root.querySelector(
    '[data-slot="media-player-controls"] button',
  ) as HTMLButtonElement;
}

/** O relógio da barra, como texto. */
export function clockText(root: HTMLElement): string {
  return root.querySelector('[data-slot="media-player-time"]')?.textContent ?? '';
}
