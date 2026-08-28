/**
 * Auxiliares de play do MediaPlayer.
 *
 * Separados das fixtures porque a docs page importa aquelas, e um módulo de
 * espera de teste dentro dela levaria o andaime da suíte para o pacote da
 * página.
 */
import { ref, watch, type Ref } from 'vue';
import type { MediaPlayerApi } from './index';

/**
 * A ponte da story para a instância montada.
 *
 * A raiz expõe `media` e `frame`, e UM DOS DOIS É SEMPRE NULO — ler o elemento
 * pelo DOM esconderia justamente a diferença que as stories de provedor
 * existem para provar.
 *
 * É um OBSERVADOR, e não `onMounted`: trocar a fonte troca o motor, e motor não
 * se troca em voo — o `:key` remonta o componente, e um `onMounted` do
 * invólucro guardaria a instância morta. Quem recebe a instância é o
 * `assign`, porque cada arquivo de story guarda a sua (uma só, ou a lista de
 * duas que a composição compara).
 *
 * Mora aqui, e não copiada em cada `*.stories.ts`, porque cópia divergida não é
 * variação — é o defeito: corrigir uma delas deixa as outras erradas sem
 * nenhum sinal.
 */
export function playerBridge(
  assign: (player: MediaPlayerApi | null) => void,
): Ref<MediaPlayerApi | null> {
  const playerRef = ref<MediaPlayerApi | null>(null);
  watch(playerRef, (instance) => assign(instance), { flush: 'post' });
  return playerRef;
}

/**
 * Espera de RELÓGIO com prazo. Nunca `waitFor`.
 *
 * O `waitFor` da suíte reagenda por observador de mutação: se a condição toca o
 * DOM e a primeira tentativa falha, a própria tentativa provoca a próxima, o
 * prazo nunca chega e a aba morre sem resultado E sem falha — medido, 420s de
 * CPU sem reportar. Um laço de relógio reprova em segundos.
 *
 * O intervalo de 20ms também é o que dá ao Vue a chance de repintar: a barra é
 * controlada pelo estado, e a pintura vem no ciclo seguinte ao evento do motor.
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

/** A moldura de um player montado na story. */
export function playerRoot(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector('[data-slot="media-player"]') as HTMLElement;
}

/**
 * O padrão que o texto anunciado deve seguir, derivado do MOLDE do conteúdo.
 *
 * Cravar a frase no teste faz a asserção concordar com o idioma de quem a
 * escreveu: ela passa sem olhar o molde, e reprova por motivo errado em
 * qualquer outro idioma. Derivada, reprova pelo que importa — substituição
 * que não aconteceu, rótulo ausente, frase de volta ao código.
 */
export function seekValueTextPattern(template: string): RegExp {
  const clock = String.raw`\d+:\d{2}`;
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const body = escaped
    .replace(String.raw`\{current\}`, clock)
    .replace(String.raw`\{duration\}`, clock);
  return new RegExp(`^${body}$`);
}
