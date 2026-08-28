// ─── MediaPlayer — Estados ───────────────────────────────────────────────────
//
// Os três estados que a barra PINTA de forma diferente. Cada story fecha no
// estado que nomeia, porque o Chromatic fotografa o fim da play — uma story
// chamada `Playing` que termina pausada fotografaria a outra coisa.
//
// Todas usam áudio: o estado é da REPRODUÇÃO, não do formato, e o WAV de
// memória tem duração finita — que é o que permite chegar ao fim em menos de
// um segundo em vez de esperar um vídeo inteiro.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import { MediaPlayer } from './media-player';
import {
  MediaPlayerCanvas,
  mediaPlayerHandle,
  mediaPlayerLabels,
  silentWav,
  DEMO_SECONDS,
} from './media-player.fixtures';
import { clockText, firstControl, until, seekValueTextPattern } from './media-player.play-helpers';
import { mediaPlayerSourceWith } from './media-player.source';

/**
 * Espiões de escopo de MÓDULO.
 *
 * Criado dentro do `render`, um espião é inalcançável pela play e deixa a aba
 * Actions vazia. Aqui as stories precisam afirmar QUEM foi chamado no fim da
 * mídia, e é isto que torna a distinção entre pausa e fim verificável.
 */
const onPlay = fn();
const onPause = fn();
const onEnded = fn();

/** As três durações, resolvidas uma vez: o mesmo texto a cada desenho. */
const IDLE_SOURCE = silentWav(DEMO_SECONDS);
// Cinco segundos: tempo de a story fechar TOCANDO, que é o estado que ela nomeia
// e o que o Chromatic vai fotografar.
const PLAYING_SOURCE = silentWav(5);
const ENDED_SOURCE = silentWav(0.4);

const meta = {
  title: 'UI/MediaPlayer/States',
  component: MediaPlayer,
  tags: ['display'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: mediaPlayerSourceWith({ kind: 'audio' }) } },
  },
  // `labels` é prop OBRIGATÓRIA e por isso está nos args; quem a resolve na tela
  // é o canvas, que lê o idioma corrente.
  args: { labels: mediaPlayerLabels() },
} satisfies Meta<typeof MediaPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Como o player nasce: parado, no zero, sem duração conhecida ainda. */
export const Idle: Story = {
  render: () => <MediaPlayerCanvas kind="audio" src={IDLE_SOURCE} />,

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = mediaPlayerHandle(canvasElement).root!;
    const L = mediaPlayerLabels();

    await step('O botão oferece tocar, e a posição está no início', async () => {
      await expect(canvas.getByRole('button', { name: L.play })).toBeInTheDocument();
      const slider = canvas.getByRole('slider', { name: L.seek }) as HTMLInputElement;
      await expect(slider.value).toBe('0');
    });

    await step('Duração desconhecida vira travessão, e nunca `NaN`', async () => {
      // `preload="metadata"` já pode ter resolvido a duração quando a play
      // roda — o que se afirma é que o relógio é LEGÍVEL nos dois casos, e
      // jamais `NaN:aN`.
      await expect(clockText(root)).not.toContain('NaN');
      await expect(clockText(root)).toMatch(/^(--:--|\d+:\d{2}) \/ (--:--|\d+:\d{2})$/);
    });
  },
};

/** Tocando: o botão passa a oferecer pausa, e a posição anda. */
export const Playing: Story = {
  render: () => (
    <MediaPlayerCanvas
      kind="audio"
      src={PLAYING_SOURCE}
      onPlay={onPlay}
      onPause={onPause}
    />
  ),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const handle = mediaPlayerHandle(canvasElement);
    const root = handle.root!;
    const media = handle.media!;
    const L = mediaPlayerLabels();
    media.muted = true;
    onPlay.mockClear();

    await step('A reprodução começa, e o começo é `playing`', async () => {
      // Precondição própria: parte do zero e parada, venha de onde vier — o
      // painel Interactions reexecuta a play no mesmo DOM.
      if (!media.paused) media.pause();
      media.currentTime = 0;
      await until(() => firstControl(root).getAttribute('aria-label') === L.play);

      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      // A espera é pelo CALLBACK, e não por `!paused && currentTime > 0`: os
      // dois quase sempre chegam juntos, e quando não chegam a asserção corre
      // antes do evento. Medido — reprovou uma vez em duas rodadas idênticas.
      const started = await until(() => onPlay.mock.calls.length > 0, 5000);
      await expect(started).toBe(true);
    });

    await step('A barra pinta o estado: o botão agora oferece pausa', async () => {
      await until(() => firstControl(root).getAttribute('aria-label') === L.pause);
      await expect(canvas.getByRole('button', { name: L.pause })).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: L.play })).toBeNull();
    });

    await step('A posição anda junto com o relógio', async () => {
      const slider = canvas.getByRole('slider', { name: L.seek }) as HTMLInputElement;
      const moved = await until(() => Number(slider.value) > 0, 5000);
      await expect(moved).toBe(true);
      await expect(slider.getAttribute('aria-valuetext')).toMatch(seekValueTextPattern(L.seekValueText));
    });

    // Fecha TOCANDO — é o estado que a story nomeia.
  },
};

/** Terminada: `pause` chega ANTES de `ended`, e só o discriminador os separa. */
export const Ended: Story = {
  render: () => (
    <MediaPlayerCanvas
      kind="audio"
      src={ENDED_SOURCE}
      onPause={onPause}
      onEnded={onEnded}
    />
  ),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const handle = mediaPlayerHandle(canvasElement);
    const root = handle.root!;
    const media = handle.media!;
    const L = mediaPlayerLabels();
    media.muted = true;

    await step('A mídia chega ao fim', async () => {
      onPause.mockClear();
      onEnded.mockClear();
      media.currentTime = 0;
      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      const finished = await until(() => media.ended, 8000);
      await expect(finished).toBe(true);
    });

    await step('MEDIDO: `pause` dispara no FIM, e só `ended` os separa', async () => {
      // A sequência medida num WAV de 0,4s foi `play > playing > pause > ended`,
      // com `pause` ANTES do fim. Quem contar `pause` sem olhar `ended` conta
      // toda reprodução completa como uma pausa — e o número continua
      // plausível, que é o que torna o erro caro.
      //
      // A espera é pela contagem do próprio espião: `media.ended` já é verdade
      // quando o laço acima devolve, e os dois callbacks chegam pelos eventos
      // que vêm depois.
      await expect(await until(() => onEnded.mock.calls.length > 0, 5000)).toBe(true);
      await expect(onPause).toHaveBeenCalledWith(expect.objectContaining({ ended: true }));
      await expect(onEnded).toHaveBeenCalled();
    });

    await step('E a barra volta a oferecer tocar, não pausar', async () => {
      await until(() => firstControl(root).getAttribute('aria-label') === L.play);
      await expect(canvas.getByRole('button', { name: L.play })).toBeInTheDocument();
    });
  },
};
