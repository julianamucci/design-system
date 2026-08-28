// ─── MediaPlayer — Estados ───────────────────────────────────────────────────
//
// Os três estados que a barra PINTA de forma diferente. Cada story fecha no
// estado que nomeia, porque o Chromatic fotografa o fim da play — uma story
// chamada `Playing` que termina pausada fotografaria a outra coisa.
//
// Todas usam áudio: o estado é da REPRODUÇÃO, não do formato, e o WAV de memória
// tem duração finita — que é o que permite chegar ao fim em menos de um segundo
// em vez de esperar um vídeo inteiro.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn } from 'storybook/test';
import { MediaPlayerComponent, type MediaPlayerHostElement } from './media-player';
import { DEMO_SECONDS, MEDIA_PLAYER_LABELS, silentWav } from './media-player.fixtures';
import { clockText, firstControl, until, seekValueTextPattern } from './media-player.play-helpers';
import { mediaPlayerSourceWith } from './media-player.source';

/**
 * Espiões de escopo de MÓDULO.
 *
 * Criado dentro do `render`, um espião é inalcançável pela play e deixa a aba
 * Actions vazia. Aqui as stories precisam afirmar QUEM foi chamado no fim da
 * mídia, e é isto que torna a distinção entre pausa e fim verificável.
 */
const played = fn();
const paused = fn();
const finished = fn();

const meta: Meta = {
  title: 'UI/MediaPlayer/States',
  decorators: [moduleMetadata({ imports: [MediaPlayerComponent] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: mediaPlayerSourceWith({ kind: 'audio' }) } },
  },
};

export default meta;
type Story = StoryObj;

/** Como o player nasce: parado, no zero, sem duração conhecida ainda. */
export const Idle: Story = {
  render: () => ({
    props: { labels: MEDIA_PLAYER_LABELS, src: silentWav(DEMO_SECONDS) },
    template: '<nds-media-player kind="audio" [src]="src" [labels]="labels" />',
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.media));

    await step('O botão oferece tocar, e a posição está no início', async () => {
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.play }),
      ).toBeInTheDocument();
      const slider = canvas.getByRole('slider', {
        name: MEDIA_PLAYER_LABELS.seek,
      }) as HTMLInputElement;
      await expect(slider.value).toBe('0');
    });

    await step('Duração desconhecida vira travessão, e nunca `NaN`', async () => {
      // `preload: 'metadata'` já pode ter resolvido a duração quando a play
      // roda — o que se afirma é que o relógio é LEGÍVEL nos dois casos, e
      // jamais `NaN:aN`.
      await expect(clockText(root)).not.toContain('NaN');
      await expect(clockText(root)).toMatch(/^(--:--|\d+:\d{2}) \/ (--:--|\d+:\d{2})$/);
    });
  },
};

/** Tocando: o botão passa a oferecer pausa, e a posição anda. */
export const Playing: Story = {
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      // Cinco segundos: tempo de a story fechar TOCANDO, que é o estado que ela
      // nomeia e o que o Chromatic vai fotografar.
      src: silentWav(5),
      played,
      paused,
    },
    template: `
      <nds-media-player
        kind="audio"
        [src]="src"
        [labels]="labels"
        (played)="played()"
        (paused)="paused($event)"
      />
    `,
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.media));
    const media = root.media!;
    media.muted = true;
    played.mockClear();

    await step('A reprodução começa, e o começo é `playing`', async () => {
      // Precondição própria: parte do zero e parada, venha de onde vier — o
      // painel Interactions reexecuta a play no mesmo DOM.
      if (!media.paused) media.pause();
      media.currentTime = 0;
      await until(() => firstControl(root).getAttribute('aria-label') === MEDIA_PLAYER_LABELS.play);

      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      // A espera é pelo CALLBACK, e não por `!paused && currentTime > 0`: os
      // dois quase sempre chegam juntos, e quando não chegam a asserção corre
      // antes do evento. Medido — reprovou uma vez em duas rodadas idênticas.
      const started = await until(() => played.mock.calls.length > 0, 5000);
      await expect(started).toBe(true);
    });

    await step('A barra pinta o estado: o botão agora oferece pausa', async () => {
      await until(() => firstControl(root).getAttribute('aria-label') === MEDIA_PLAYER_LABELS.pause);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.pause }),
      ).toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.play })).toBeNull();
    });

    await step('A posição anda junto com o relógio', async () => {
      const slider = canvas.getByRole('slider', {
        name: MEDIA_PLAYER_LABELS.seek,
      }) as HTMLInputElement;
      const moved = await until(() => Number(slider.value) > 0, 5000);
      await expect(moved).toBe(true);
      await expect(slider.getAttribute('aria-valuetext')).toMatch(seekValueTextPattern(MEDIA_PLAYER_LABELS.seekValueText));
    });

    // Fecha TOCANDO — é o estado que a story nomeia.
  },
};

/** Terminada: `pause` chega ANTES de `ended`, e só o discriminador os separa. */
export const Ended: Story = {
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      src: silentWav(0.4),
      paused,
      finished,
    },
    template: `
      <nds-media-player
        kind="audio"
        [src]="src"
        [labels]="labels"
        (paused)="paused($event)"
        (finished)="finished()"
      />
    `,
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.media));
    const media = root.media!;
    media.muted = true;

    await step('A mídia chega ao fim', async () => {
      paused.mockClear();
      finished.mockClear();
      media.currentTime = 0;
      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      const done = await until(() => media.ended, 8000);
      await expect(done).toBe(true);
    });

    await step('MEDIDO: `pause` dispara no FIM, e só `ended` os separa', async () => {
      // A sequência medida num WAV de 0,4s foi `play > playing > pause > ended`,
      // com `pause` ANTES do fim. Quem contar `pause` sem olhar `ended` conta
      // toda reprodução completa como uma pausa — e o número continua plausível,
      // que é o que torna o erro caro.
      //
      // A espera é pela contagem do PRÓPRIO espião: `media.ended` já é verdade
      // acima, mas a emissão passa pelo evento, que é assíncrono.
      await until(() => finished.mock.calls.length > 0, 5000);
      await expect(paused).toHaveBeenCalledWith(expect.objectContaining({ ended: true }));
      await expect(finished).toHaveBeenCalled();
    });

    await step('E a barra volta a oferecer tocar, não pausar', async () => {
      await until(() => firstControl(root).getAttribute('aria-label') === MEDIA_PLAYER_LABELS.play);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.play }),
      ).toBeInTheDocument();
    });
  },
};
