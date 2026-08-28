// ─── Media Player — story do protótipo ───────────────────────────────────────
//
// A mídia é construída em memória: um WAV de 44 bytes de cabeçalho mais
// silêncio. Nada é baixado, nada depende de rede, e a semântica de eventos do
// `HTMLMediaElement` é a mesma para áudio e vídeo.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createMediaPlayer, formatTime, type MediaPlayerRoot } from './media-player';

const LABELS = {
  player: 'Reprodutor',
  controls: 'Controles de reprodução',
  play: 'Reproduzir',
  pause: 'Pausar',
  mute: 'Silenciar',
  unmute: 'Ativar o som',
  seek: 'Posição da reprodução',
};

/** WAV PCM 8 bits, mono, 8 kHz, silencioso, com a duração pedida. */
function silentWav(seconds: number): string {
  const rate = 8000;
  const samples = Math.round(rate * seconds);
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  ascii(36, 'data');
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(binario)}`;
}

/** Espera de RELÓGIO com prazo. Nunca `waitFor`: a condição lê estado de mídia. */
async function until(cond: () => boolean, deadline = 4000): Promise<boolean> {
  const end = Date.now() + deadline;
  while (Date.now() < end) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return cond();
}

type PlayerArgs = {
  onPlay: () => void;
  onPause: (info: { ended: boolean; currentTime: number }) => void;
  onEnded: () => void;
};

const meta: Meta<PlayerArgs> = {
  title: 'Prototypes/MediaPlayer',
  parameters: { layout: 'padded' },
  argTypes: {
    onPlay: {
      control: false,
      description: 'Chamado quando a reprodução COMEÇA — ligado a `playing`, não a `play`.',
      table: { type: { summary: '() => void' } },
    },
    onPause: {
      control: false,
      description: 'Chamado em toda parada, com `ended` para separar pausa de fim.',
      table: { type: { summary: '(info: { ended: boolean; currentTime: number }) => void' } },
    },
    onEnded: {
      control: false,
      description: 'Chamado quando a mídia termina.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: { onPlay: fn(), onPause: fn(), onEnded: fn() },
};

export default meta;
type Story = StoryObj<PlayerArgs>;

export const Audio: Story = {
  render: (args) =>
    createMediaPlayer({
      kind: 'audio',
      src: silentWav(0.6),
      labels: LABELS,
      onPlay: args.onPlay,
      onPause: args.onPause,
      onEnded: args.onEnded,
    }),

  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="media-player"]') as MediaPlayerRoot;
    const media = root.media;
    const playButton = () =>
      root.querySelector('[data-slot="media-player-controls"] button') as HTMLButtonElement;
    // Silenciada por padrão na suíte: a política de autoplay do navegador é
    // afrouxada por bandeira de lançamento (ver `vite.config.ts`), mas nada
    // garante que quem roda isto na mão tenha a mesma política.
    media.muted = true;

    await step('O player se anuncia, e os controles têm nome próprio', async () => {
      await expect(canvas.getByRole('group', { name: LABELS.player })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: LABELS.controls })).toBeInTheDocument();
      await expect(canvas.getByRole('slider', { name: LABELS.seek })).toBeInTheDocument();
      // O elemento nativo NÃO recebe `controls`: dois conjuntos de controles na
      // mesma caixa seria a lib e o design system disputando a mesma função.
      await expect(media.hasAttribute('controls')).toBe(false);
    });

    await step('O botão reflete o ESTADO da mídia, não o próprio clique', async () => {
      // Sem clique nenhum: quem manda é o elemento. É o que sustenta o rastreio
      // correto quando a reprodução parte de tecla de mídia, Picture-in-Picture
      // ou da Media Session do sistema — caminhos que não tocam neste botão.
      // A espera é pelo DOM, e NÃO pela propriedade do elemento.
      //
      // `media.pause()` deixa `paused = true` de forma SÍNCRONA, enquanto o
      // evento `pause` — que é quem repinta o botão — é assíncrono. Esperar
      // por `media.paused` sai na primeira volta e a asserção corre contra o
      // DOM antigo: medido, o botão ainda dizia "Pausar".
      const rotulo = () => playButton().getAttribute('aria-label');

      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      await until(() => rotulo() === LABELS.pause);
      await expect(canvas.getByRole('button', { name: LABELS.pause })).toBeInTheDocument();

      media.pause();
      await until(() => rotulo() === LABELS.play);
      await expect(canvas.getByRole('button', { name: LABELS.play })).toBeInTheDocument();
    });

    await step('Início é `playing`, e a pausa carrega o discriminador', async () => {
      (args.onPlay as ReturnType<typeof fn>).mockClear();
      (args.onPause as ReturnType<typeof fn>).mockClear();

      media.currentTime = 0;
      await userEvent.click(canvas.getByRole('button', { name: LABELS.play }));
      await until(() => !media.paused && media.currentTime > 0);
      await expect(args.onPlay).toHaveBeenCalled();

      await userEvent.click(canvas.getByRole('button', { name: LABELS.pause }));
      await until(() => media.paused);
      // Pausa de verdade: `ended` falso.
      await expect(args.onPause).toHaveBeenCalledWith(
        expect.objectContaining({ ended: false }),
      );
    });

    await step('MEDIDO: `pause` dispara no FIM, e só `ended` os separa', async () => {
      (args.onPause as ReturnType<typeof fn>).mockClear();
      (args.onEnded as ReturnType<typeof fn>).mockClear();

      media.currentTime = 0;
      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      const acabou = await until(() => media.ended, 6000);
      await expect(acabou).toBe(true);

      // Esta é a asserção que existe por causa da sonda. A sequência medida num
      // WAV de 0,4s foi `play > playing > pause > ended`, com `pause` ANTES do
      // fim. Quem contar `pause` sem olhar `ended` conta toda reprodução
      // completa como uma pausa — e o número continua plausível, que é o que
      // torna o erro caro.
      await expect(args.onPause).toHaveBeenCalledWith(
        expect.objectContaining({ ended: true }),
      );
      await expect(args.onEnded).toHaveBeenCalled();
    });

    await step('O relógio anuncia tempo, não um número solto', async () => {
      const slider = canvas.getByRole('slider', { name: LABELS.seek });
      const texto = slider.getAttribute('aria-valuetext') ?? '';
      // "37" não é posição para quem ouve. O texto do valor é o relógio.
      await expect(texto).toMatch(/\d+:\d{2} de \d+:\d{2}/);
      await expect(formatTime(83)).toBe('1:23');
      // Duração desconhecida não pode virar `NaN:aN` na tela.
      await expect(formatTime(Number.NaN)).toBe('--:--');
    });

    await step('Os controles alcançam o mínimo de alvo de toque', async () => {
      for (const nome of [LABELS.play, LABELS.mute]) {
        const botao = canvas.queryByRole('button', { name: nome });
        if (!botao) continue;
        const caixa = botao.getBoundingClientRect();
        await expect(caixa.width).toBeGreaterThanOrEqual(24);
        await expect(caixa.height).toBeGreaterThanOrEqual(24);
      }
    });

    // Devolve o player ao estado de demonstração: o Chromatic fotografa o fim.
    media.currentTime = 0;
  },
};

export const Video: Story = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  render: (args) =>
    createMediaPlayer({
      kind: 'video',
      src: silentWav(0.6),
      labels: LABELS,
      // Uma faixa de legenda, ainda que vazia: vídeo com áudio SEM legenda
      // reprova em WCAG 1.2.2 (nível A), e a story não pode ensinar o contrário.
      tracks: [
        {
          src: 'data:text/vtt;base64,V0VCVlRUCgo=',
          srclang: 'pt-BR',
          label: 'Português',
          default: true,
        },
      ],
      onPlay: args.onPlay,
      onPause: args.onPause,
      onEnded: args.onEnded,
    }),

  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-slot="media-player"]') as MediaPlayerRoot;

    await step('É um <video>, e ele carrega a faixa de legenda', async () => {
      await expect(root.media.tagName).toBe('VIDEO');
      const track = root.media.querySelector('track');
      await expect(track).toBeInTheDocument();
      await expect(track).toHaveAttribute('kind', 'captions');
      await expect(track).toHaveAttribute('srclang', 'pt-BR');
    });

    await step('A superfície ocupa a largura e não deforma', async () => {
      const estilo = getComputedStyle(root.media);
      await expect(estilo.display).toBe('block');
      await expect(root.dataset.kind).toBe('video');
    });
  },
};
