// ─── MediaPlayer — Playground ────────────────────────────────────────────────
//
// O Playground abre em ÁUDIO, e a escolha é deliberada: com o WAV de memória
// todo controle da barra faz alguma coisa. A duração é finita, então a barra de
// progresso e o relógio têm o que representar; a velocidade muda de verdade.
//
// A fonte de vídeo desta stack é um canvas capturado como stream ao vivo, e nela
// DUAS coisas são medidas e não contornáveis: `playbackRate` é ignorado (1.5
// escrito lê de volta 1) e a duração é infinita. Um Playground de vídeo
// entregaria dois controles que a pessoa mexe e não acontece nada — que é
// exatamente o defeito que este componente já teve uma vez, no botão de janela
// flutuante. Vídeo, tela cheia e janela flutuante estão nas Variantes e nas
// Composições, onde a fonte ao vivo vem com `rates: []` pelo motivo medido.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  MediaPlayerComponent,
  formatTime,
  type MediaPlayerHostElement,
  type MediaPlayerKind,
  type MediaPlayerLabels,
  type MediaPlayerTrack,
} from './media-player';
import {
  MEDIA_PLAYER_LABELS,
  canvasStream,
  captionTrack,
  silentWav,
} from './media-player.fixtures';
import { clockText, firstControl, until, seekValueTextPattern } from './media-player.play-helpers';
import { mediaPlayerSource } from './media-player.source';
import { NdsMediaPlayerDocs } from '@/components/docs/MediaPlayerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// As dez do contrato, e não as três que o Playground controla: a aba API
// Reference é gerada a partir de `argTypes`, então o que não aparece aqui não
// existe para quem lê a documentação.
type MediaPlayerArgs = {
  kind: MediaPlayerKind;
  rates: number[];
  labels: MediaPlayerLabels;
  src?: string;
  stream?: MediaStream;
  embed?: unknown;
  tracks?: MediaPlayerTrack[];
  played: () => void;
  paused: (info: { ended: boolean; currentTime: number }) => void;
  finished: () => void;
};

const meta: Meta<MediaPlayerArgs> = {
  title: 'UI/MediaPlayer',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [MediaPlayerComponent] })],
  parameters: {
    // `padded` e não `centered`: o player é `width: 100%`, e sob `centered` a
    // caixa encolhe até o conteúdo — a moldura deixaria de ser o que se vê.
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsMediaPlayerDocs),
      // O painel Code mostra o uso do componente, e não o template da story. A
      // transform cascateia para todas as stories deste arquivo.
      source: { transform: mediaPlayerSource },
    },
  },
  argTypes: {
    kind: {
      control: { type: 'inline-radio' },
      options: ['video', 'audio'],
      description:
        'Motor nativo a montar. Vídeo ganha tela cheia e janela flutuante; áudio não, '
        + 'porque nenhum dos dois teria o que mostrar.',
      table: { type: { summary: '"video" | "audio"' }, defaultValue: { summary: '"video"' } },
    },
    src: {
      control: false,
      description: 'Endereço da mídia. Exclusivo com `stream` e com `embed`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    stream: {
      control: false,
      description:
        'Fonte ao vivo — câmera, compartilhamento de tela, canvas. Duração infinita, '
        + 'e a velocidade de reprodução é ignorada.',
      table: { type: { summary: 'MediaStream' }, defaultValue: { summary: '—' } },
    },
    embed: {
      control: false,
      description:
        'Vídeo hospedado em provedor externo. Troca o MOTOR, não a API: no lugar do '
        + 'elemento de mídia entra um quadro de outra origem.',
      table: { type: { summary: 'EmbedSource' }, defaultValue: { summary: '—' } },
    },
    tracks: {
      control: false,
      description:
        'Faixas de legenda. Vídeo com áudio EXIGE ao menos uma — WCAG 1.2.2, nível A.',
      table: { type: { summary: 'MediaPlayerTrack[]' }, defaultValue: { summary: '[]' } },
    },
    rates: {
      control: 'object',
      description:
        'Velocidades oferecidas. Lista vazia esconde o seletor — é o que a fonte ao '
        + 'vivo pede, porque nela a velocidade não tem efeito.',
      table: {
        type: { summary: 'number[]' },
        defaultValue: { summary: '[0.5, 0.75, 1, 1.25, 1.5, 2]' },
      },
    },
    labels: {
      control: false,
      type: { name: 'object', value: {}, required: true },
      description:
        'Nome acessível do player, da barra e de cada controle. Todos são só de ícone, '
        + 'então o rótulo é o que o leitor de tela anuncia.',
      table: { type: { summary: 'MediaPlayerLabels' }, defaultValue: { summary: '—' } },
    },
    // Sem entrada aqui o renderer Angular não repassa a função em `props`, e o
    // `(played)` do template fica ligado a nada — sem erro, e sem aba Actions.
    played: {
      control: false,
      description:
        'Emitido quando a reprodução COMEÇA de fato — ligado a `playing`, não a `play`: '
        + 'entre o pedido e o primeiro quadro está o buffer.',
      table: { type: { summary: '() => void' }, defaultValue: { summary: '—' } },
    },
    paused: {
      control: false,
      description:
        'Emitido em toda parada, com `ended` para separar pausa de fim — o navegador '
        + 'dispara `pause` também quando a mídia termina.',
      table: {
        type: { summary: '(info: { ended: boolean; currentTime: number }) => void' },
        defaultValue: { summary: '—' },
      },
    },
    finished: {
      control: false,
      description: 'Emitido quando a mídia termina.',
      table: { type: { summary: '() => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    kind: 'audio',
    rates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    labels: MEDIA_PLAYER_LABELS,
    played: fn(),
    paused: fn(),
    finished: fn(),
  },
};

export default meta;
type Story = StoryObj<MediaPlayerArgs>;

export const Playground: Story = {
  render: (args) => ({
    props: {
      ...args,
      // Vídeo por canvas, áudio por WAV: os dois em memória, nada de rede. A
      // fonte é derivada AQUI, e não por control próprio, porque motor não se
      // troca em voo — quem escolhe é `kind`.
      stream: args.kind === 'video' ? canvasStream() : undefined,
      src: args.kind === 'video' ? undefined : silentWav(0.6),
      tracks: args.kind === 'video' ? [captionTrack()] : [],
    },
    template: `
      <nds-media-player
        [kind]="kind"
        [src]="src"
        [stream]="stream"
        [tracks]="tracks"
        [rates]="rates"
        [labels]="labels"
        (played)="played()"
        (paused)="paused($event)"
        (finished)="finished()"
      />
    `,
  }),

  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    // A afirmação de não-nulo é a story dizendo que SABE qual motor pediu:
    // `media` é nulo em provedor externo, e o tipo obriga a declarar isso em vez
    // de presumir.
    await until(() => Boolean(root.media));
    const media = root.media!;
    // Silenciada por padrão na suíte: a política de autoplay do navegador é
    // afrouxada por bandeira de lançamento (ver `vite.config.ts`), mas nada
    // garante que quem roda isto na mão tenha a mesma política.
    media.muted = true;

    await step('O player se anuncia, e os controles têm nome próprio', async () => {
      await expect(
        canvas.getByRole('group', { name: MEDIA_PLAYER_LABELS.player }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('group', { name: MEDIA_PLAYER_LABELS.controls }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('slider', { name: MEDIA_PLAYER_LABELS.seek }),
      ).toBeInTheDocument();
      // O elemento nativo NÃO recebe `controls`: dois conjuntos de controles na
      // mesma caixa seria a plataforma e o design system disputando a mesma
      // função.
      await expect(media.hasAttribute('controls')).toBe(false);
    });

    await step('O botão reflete o ESTADO da mídia, não o próprio clique', async () => {
      // Sem clique nenhum: quem manda é o elemento. É o que sustenta o rastreio
      // correto quando a reprodução parte de tecla de mídia, janela flutuante ou
      // da Media Session do sistema — caminhos que não tocam neste botão.
      //
      // A espera é pelo DOM, e NÃO pela propriedade do elemento: `media.pause()`
      // deixa `paused = true` de forma SÍNCRONA, enquanto o evento `pause` — que
      // é quem repinta o botão — é assíncrono. Esperar por `media.paused` sai na
      // primeira volta e a asserção corre contra o DOM antigo. Medido: o botão
      // ainda dizia "Pausar".
      const label = () => firstControl(root).getAttribute('aria-label');

      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await media.play().catch(() => {});
      await until(() => label() === MEDIA_PLAYER_LABELS.pause);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.pause }),
      ).toBeInTheDocument();

      media.pause();
      await until(() => label() === MEDIA_PLAYER_LABELS.play);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.play }),
      ).toBeInTheDocument();
    });

    await step('Início é `playing`, e a pausa carrega o discriminador', async () => {
      (args.played as ReturnType<typeof fn>).mockClear();
      (args.paused as ReturnType<typeof fn>).mockClear();

      // A precondição é estabelecida, e não herdada do passo anterior: o painel
      // Interactions reexecuta a play no MESMO DOM, e o que a rodada anterior
      // deixou inverteria o resultado desta.
      media.currentTime = 0;
      if (!media.paused) media.pause();
      await until(() => firstControl(root).getAttribute('aria-label') === MEDIA_PLAYER_LABELS.play);

      // A espera é PELO QUE SE AFIRMA, e não por um sintoma vizinho.
      //
      // A versão anterior esperava `!media.paused && currentTime > 0` e depois
      // afirmava sobre o callback de início. As duas coisas quase sempre chegam
      // juntas, e quando não chegam a asserção corre antes do evento: reprovou
      // uma vez em duas rodadas idênticas. É a mesma armadilha da propriedade
      // contra o evento — `paused` muda de forma síncrona, `pause` e `playing`
      // são assíncronos —, só que do outro lado da barra.
      const played = args.played as ReturnType<typeof fn>;
      const paused = args.paused as ReturnType<typeof fn>;

      await userEvent.click(canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.play }));
      await expect(await until(() => played.mock.calls.length > 0, 5000)).toBe(true);

      // Duas esperas, porque são DUAS coisas afirmadas. Nesta stack o repinte
      // não acontece dentro do evento: o estado é signal, e o rótulo do botão só
      // muda no ciclo de detecção seguinte. Esperar só o espião e ir direto ao
      // DOM encontra o botão ainda dizendo "Reproduzir" — medido.
      await until(
        () => firstControl(root).getAttribute('aria-label') === MEDIA_PLAYER_LABELS.pause,
      );
      await userEvent.click(canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.pause }));
      await expect(await until(() => paused.mock.calls.length > 0, 5000)).toBe(true);
      // Pausa de verdade: `ended` falso.
      await expect(args.paused).toHaveBeenCalledWith(expect.objectContaining({ ended: false }));
    });

    await step('O relógio anuncia tempo, não um número solto', async () => {
      const slider = canvas.getByRole('slider', { name: MEDIA_PLAYER_LABELS.seek });
      const valueText = slider.getAttribute('aria-valuetext') ?? '';
      // "37" não é posição para quem ouve. O texto do valor é o relógio.
      await expect(valueText).toMatch(seekValueTextPattern(MEDIA_PLAYER_LABELS.seekValueText));
      await expect(clockText(root)).toMatch(/\d+:\d{2} \/ \d+:\d{2}/);
      await expect(formatTime(83)).toBe('1:23');
      // Duração desconhecida não pode virar `NaN:aN` na tela.
      await expect(formatTime(Number.NaN)).toBe('--:--');
    });

    await step('A velocidade é um seletor nativo, e muda a reprodução', async () => {
      const rateSelect = canvas.getByRole('combobox', { name: MEDIA_PLAYER_LABELS.rate });
      // `1×`, e não `1`: o número sozinho não diz de que grandeza se fala.
      await expect(rateSelect.textContent).toContain('1×');

      await userEvent.selectOptions(rateSelect, '1.5');
      await expect(media.playbackRate).toBe(1.5);

      // E a barra segue o ELEMENTO, como no botão de tocar: mudar a taxa por
      // fora tem de repintar o seletor sem passar por ele.
      media.playbackRate = 0.5;
      await until(() => (rateSelect as HTMLSelectElement).value === '0.5');
      await expect((rateSelect as HTMLSelectElement).value).toBe('0.5');
      media.playbackRate = 1;
    });

    await step('O silêncio também é estado, e o par de rótulos o anuncia', async () => {
      // Precondição própria: chega aqui com som, venha de onde vier.
      media.muted = false;
      await until(() => Boolean(canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.mute })));

      await userEvent.click(canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.mute }));
      await until(() => media.muted);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.unmute }),
      ).toBeInTheDocument();

      await userEvent.click(canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.unmute }));
      await until(() => !media.muted);
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.mute }),
      ).toBeInTheDocument();
      media.muted = true;
    });

    await step('Áudio não oferece tela cheia nem janela flutuante', async () => {
      // Os dois são de vídeo. Num player de áudio o botão não teria o que
      // mostrar, e botão que não faz nada é ruído.
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterFullscreen }),
      ).toBeNull();
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip }),
      ).toBeNull();
    });

    await step('Os controles alcançam o mínimo de alvo de toque', async () => {
      // A medida sai do `getBoundingClientRect` do PRÓPRIO botão: é o que o axe
      // mede em `target-size`, e um `::after` no pai não conta para ele.
      for (const name of [MEDIA_PLAYER_LABELS.play, MEDIA_PLAYER_LABELS.mute]) {
        const button = canvas.queryByRole('button', { name });
        if (!button) continue;
        const box = button.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    // Devolve o player ao estado de demonstração: o Chromatic fotografa o fim.
    media.currentTime = 0;
  },
};
