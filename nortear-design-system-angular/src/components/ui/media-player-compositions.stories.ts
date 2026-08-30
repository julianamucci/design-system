// ─── MediaPlayer — Composições ───────────────────────────────────────────────

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn } from 'storybook/test';
import { MediaPlayerComponent, type MediaPlayerHostElement } from './media-player';
import {
  MEDIA_PLAYER_LABELS,
  YOUTUBE_VIDEO_ID,
  canvasStream,
  captionTrack,
} from './media-player.fixtures';
import { clockText, messageFromFrame, until } from './media-player.play-helpers';
import { mediaPlayerTracksSource, mediaPlayerYoutubeSource } from './media-player.source';

const firstPlay = fn();
const firstPause = fn();
const secondPause = fn();

const meta: Meta = {
  title: 'Primitives/Display/MediaPlayer/Compositions',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [MediaPlayerComponent] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Vídeo com legenda declarada.
 *
 * Vídeo com áudio SEM legenda reprova em WCAG 1.2.2 (nível A). A faixa é
 * declarada por `<track>` do próprio elemento — não é sobreposição desenhada por
 * cima: assim ela entra no menu de legendas do sistema, é lida pelas ferramentas
 * de acessibilidade e continua valendo em tela cheia.
 */
export const WithCaptions: Story = {
  parameters: {
    docs: { source: { transform: mediaPlayerTracksSource } },
  },
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      stream: canvasStream(),
      tracks: [captionTrack()],
      rates: [],
    },
    template: `
      <nds-media-player
        kind="video"
        [stream]="stream"
        [rates]="rates"
        [tracks]="tracks"
        [labels]="labels"
      />
    `,
  }),

  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.media));
    const video = root.media! as HTMLVideoElement;

    await step('A faixa é declarada no elemento, e não desenhada por cima', async () => {
      const track = video.querySelector('track');
      await expect(track).toBeInTheDocument();
      await expect(track).toHaveAttribute('kind', 'captions');
      await expect(track).toHaveAttribute('srclang', 'pt-BR');
      await expect(track).toHaveAttribute('label', 'Português');
    });

    await step('E o navegador a reconhece como faixa de texto', async () => {
      // `<track>` no DOM não basta: o que prova que a faixa É legenda para o
      // navegador é ela aparecer em `textTracks`, que é de onde saem o menu do
      // sistema e as ferramentas de acessibilidade.
      const registered = await until(() => video.textTracks.length > 0, 3000);
      await expect(registered).toBe(true);
      await expect(video.textTracks[0].kind).toBe('captions');
    });
  },
};

/**
 * Dois players na mesma página — e um NÃO manda no outro.
 *
 * A página inteira recebe `message` de qualquer origem: outro embed, uma
 * extensão, um anúncio. Sem conferir a fonte, o segundo player pausa o primeiro,
 * e uma extensão qualquer mexe na reprodução. Esta composição é onde a
 * conferência tem consequência visível, e por isso é aqui que ela é medida.
 */
export const TwoPlayers: Story = {
  parameters: {
    docs: {
      source: { transform: mediaPlayerYoutubeSource },
    },
  },
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID },
      firstPlay,
      firstPause,
      secondPause,
    },
    template: `
      <div class="nds-stack" data-spacing="md">
        <nds-media-player
          [embed]="embed"
          [labels]="labels"
          (played)="firstPlay()"
          (paused)="firstPause($event)"
        />
        <nds-media-player
          [embed]="embed"
          [labels]="labels"
          (paused)="secondPause($event)"
        />
      </div>
    `,
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const [first, second] = Array.from(
      canvasElement.querySelectorAll('[data-slot="media-player"]'),
    ) as MediaPlayerHostElement[];
    await until(() => Boolean(first.frame) && Boolean(second.frame));

    await step('São dois quadros, cada um com o seu', async () => {
      await expect(
        canvas.getAllByRole('group', { name: MEDIA_PLAYER_LABELS.player }),
      ).toHaveLength(2);
      await expect(first.frame).not.toBeNull();
      await expect(second.frame).not.toBeNull();
      await expect(first.frame).not.toBe(second.frame);
    });

    // O relógio do segundo player, como ele está ANTES de qualquer mensagem.
    // Lido, e não escrito à mão: a barra pinta o estado inicial na montagem, e
    // fixar o texto esperado aqui seria afirmar o formato em vez da ausência de
    // mudança — que é o que esta composição existe para provar.
    const secondClockBefore = clockText(second);

    await step('A mensagem do provedor move a barra DELE', async () => {
      firstPlay.mockClear();
      firstPause.mockClear();
      secondPause.mockClear();

      // As cargas são as MESMAS que o YouTube envia: `onStateChange` com estado
      // numérico. Encenar o provedor é o que permite cobrir o caminho inteiro
      // sem rede — e o dialeto está preso em `media-embed.test.ts`.
      messageFromFrame(first.frame!, JSON.stringify({ event: 'onStateChange', info: 1 }));
      await until(() => firstPlay.mock.calls.length > 0);
      await expect(firstPlay).toHaveBeenCalled();

      messageFromFrame(
        first.frame!,
        JSON.stringify({ event: 'infoDelivery', info: { currentTime: 30, duration: 120 } }),
      );
      await until(() => clockText(first).includes('0:30'));
      await expect(clockText(first)).toBe('0:30 / 2:00');
    });

    await step('E não move a do outro', async () => {
      // Este é o ponto da composição: o segundo player recebeu exatamente as
      // mesmas mensagens — elas vão para a `window` inteira — e as descartou por
      // não virem do quadro dele.
      await expect(secondPause).not.toHaveBeenCalled();
      await expect(clockText(second)).toBe(secondClockBefore);
      // E o relógio do primeiro andou de fato — sem esta metade, a asserção
      // acima passaria também num player que simplesmente ignora tudo.
      await expect(clockText(first)).not.toBe(secondClockBefore);

      messageFromFrame(first.frame!, JSON.stringify({ event: 'onStateChange', info: 2 }));
      await until(() => firstPause.mock.calls.length > 0);
      // Pausa de verdade num provedor: `ended` falso, mesma forma do motor
      // nativo. É o ponto do desenho — uma API, dois motores.
      await expect(firstPause).toHaveBeenCalledWith(expect.objectContaining({ ended: false }));
      await expect(secondPause).not.toHaveBeenCalled();
    });

    await step('Mensagem que não vem de quadro nenhum é descartada', async () => {
      firstPause.mockClear();
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'onStateChange', info: 2 }),
          source: window,
        }),
      );
      // Espera de relógio: o que se prova é que NADA aconteceu, e para isso é
      // preciso dar tempo de algo acontecer.
      await new Promise((resolve) => setTimeout(resolve, 80));
      await expect(firstPause).not.toHaveBeenCalled();
    });

    await step('O que esta suíte NÃO prova', async () => {
      // O aperto de mão real com o YouTube exige rede, e suíte que depende de
      // serviço externo falha por motivo alheio ao código — o quadro nem carrega
      // aqui. Coberto: URL, permissões, dialeto (em `media-embed.test.ts`) e o
      // caminho do evento. Não coberto: a conversa de verdade.
      await expect(first.frame!.src.startsWith('https://')).toBe(true);
    });
  },
};
