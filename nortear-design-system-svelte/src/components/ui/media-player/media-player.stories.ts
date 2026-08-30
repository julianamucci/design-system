// ─── MediaPlayer — Playground ────────────────────────────────────────────────
//
// O Playground abre em ÁUDIO, e a escolha é deliberada: com o WAV de memória
// todo controle da barra faz alguma coisa. A duração é finita, então a barra de
// progresso e o relógio têm o que representar; a velocidade muda de verdade.
//
// A fonte de vídeo desta stack é um canvas capturado como stream ao vivo, e
// nela DUAS coisas são medidas e não contornáveis: `playbackRate` é ignorado
// (1.5 escrito lê de volta 1) e a duração é infinita. Um Playground de vídeo
// entregaria dois controles que a pessoa mexe e não acontece nada — que é
// exatamente o defeito que este componente já teve uma vez, no botão de janela
// flutuante. Vídeo, tela cheia e janela flutuante estão nas Variantes e nas
// Composições, onde a fonte ao vivo vem com `rates: []` pelo motivo medido.

import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { MediaPlayer, formatTime } from './index';
import MediaPlayerDocs from '@/components/docs/MediaPlayerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { mediaPlayerSource } from './media-player.source';
import {
  canvasStream,
  captionTrack,
  mediaPlayerLabels,
  mediaPlayerRoot,
  silentWav,
  DEMO_SECONDS,
} from './media-player.fixtures';
import { clockText, firstControl, until, seekValueTextPattern } from './media-player.play-helpers';

// O docgen está desligado nesta stack (analisar ~450 arquivos `.svelte` a cada
// build custava minutos), então `argTypes` é a ÚNICA fonte da aba API
// Reference: prop que não estiver aqui não aparece na tabela. As dez do
// contrato entram todas — as que o `render` resolve sozinho entram como
// documentação, com `control: false`.
const meta: Meta<typeof MediaPlayer> = {
  title: 'Primitives/Display/MediaPlayer',
  component: MediaPlayer,
  tags: ['autodocs', 'display'],
  parameters: {
    // `padded` e não `centered`: o player é `width: 100%`, e sob `centered` a
    // caixa encolhe até o conteúdo — a moldura deixaria de ser o que se vê.
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(MediaPlayerDocs),
      // O painel Code mostra a montagem do componente, e não o markup interno
      // da moldura. A transform cascateia para todas as stories deste arquivo.
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
      description:
        'Nome acessível do player, da barra e de cada controle. Todos são só de ícone, '
        + 'então o rótulo é o que o leitor de tela anuncia.',
      table: { type: { summary: 'MediaPlayerLabels' }, defaultValue: { summary: '—' } },
    },
    // Sem entrada aqui o callback fica fora da aba API Reference, mesmo estando
    // em args e alimentando a aba Actions.
    onplay: {
      control: false,
      description:
        'Chamado quando a reprodução COMEÇA de fato — ligado a `playing`, não a `play`: '
        + 'entre o pedido e o primeiro quadro está o buffer.',
      table: { type: { summary: '() => void' }, defaultValue: { summary: '—' } },
    },
    onpause: {
      control: false,
      description:
        'Chamado em toda parada, com `ended` para separar pausa de fim — o navegador '
        + 'dispara `pause` também quando a mídia termina.',
      table: {
        type: { summary: '(info: { ended: boolean; currentTime: number }) => void' },
        defaultValue: { summary: '—' },
      },
    },
    onended: {
      control: false,
      description: 'Chamado quando a mídia termina.',
      table: { type: { summary: '() => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    kind: 'audio',
    rates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    onplay: fn(),
    onpause: fn(),
    onended: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MediaPlayer>;

export const Playground: Story = {
  render: (args) => ({
    Component: MediaPlayer,
    props: {
      kind: args.kind,
      // Vídeo por canvas, áudio por WAV: os dois em memória, nada de rede.
      ...(args.kind === 'video'
        ? { stream: canvasStream(), tracks: [captionTrack()] }
        : { src: silentWav(DEMO_SECONDS) }),
      rates: args.rates,
      // O idioma CORRENTE, e não pt-BR: o nome que a play procura tem de ser o
      // mesmo que a barra desenha.
      labels: mediaPlayerLabels(),
      onplay: args.onplay,
      onpause: args.onpause,
      onended: args.onended,
    },
  }),

  play: async ({ canvasElement, step, args }) => {
    const L = mediaPlayerLabels();
    const canvas = within(canvasElement);
    const root = mediaPlayerRoot(canvasElement);
    // A afirmação de não-nulo é a story dizendo que SABE qual motor pediu:
    // `media` é nulo em provedor externo, e o tipo obriga a declarar isso em
    // vez de presumir.
    const media = root.media!;
    // Silenciada por padrão na suíte: a política de autoplay do navegador é
    // afrouxada por bandeira de lançamento (ver `vite.config.ts`), mas nada
    // garante que quem roda isto na mão tenha a mesma política.
    media.muted = true;

    await step('O player se anuncia, e os controles têm nome próprio', async () => {
      await expect(canvas.getByRole('group', { name: L.player })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: L.controls })).toBeInTheDocument();
      await expect(canvas.getByRole('slider', { name: L.seek })).toBeInTheDocument();
      // O elemento nativo NÃO recebe `controls`: dois conjuntos de controles na
      // mesma caixa seria a plataforma e o design system disputando a mesma
      // função.
      await expect(media.hasAttribute('controls')).toBe(false);
    });

    await step('O botão reflete o ESTADO da mídia, não o próprio clique', async () => {
      // Sem clique nenhum: quem manda é o elemento. É o que sustenta o rastreio
      // correto quando a reprodução parte de tecla de mídia, janela flutuante
      // ou da Media Session do sistema — caminhos que não tocam neste botão.
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
      await until(() => label() === L.pause);
      await expect(canvas.getByRole('button', { name: L.pause })).toBeInTheDocument();

      media.pause();
      await until(() => label() === L.play);
      await expect(canvas.getByRole('button', { name: L.play })).toBeInTheDocument();
    });

    await step('Início é `playing`, e a pausa carrega o discriminador', async () => {
      const played = args.onplay as ReturnType<typeof fn>;
      const paused = args.onpause as ReturnType<typeof fn>;
      played.mockClear();
      paused.mockClear();

      // A precondição é estabelecida, e não herdada do passo anterior: o painel
      // Interactions reexecuta a play no MESMO DOM, e o que a rodada anterior
      // deixou inverteria o resultado desta.
      media.currentTime = 0;
      if (!media.paused) media.pause();
      await until(() => firstControl(root).getAttribute('aria-label') === L.play);

      // A espera é PELO QUE SE AFIRMA, e não por um sintoma vizinho.
      //
      // Esperar `!media.paused && currentTime > 0` e depois afirmar sobre o
      // callback reprovou uma vez em duas rodadas idênticas: os dois quase
      // sempre chegam juntos, e quando não chegam a asserção corre antes do
      // evento. É a mesma armadilha da propriedade contra o evento — `paused`
      // muda de forma síncrona, `pause` e `playing` são assíncronos —, só que
      // do outro lado da barra.
      await userEvent.click(canvas.getByRole('button', { name: L.play }));
      await expect(await until(() => played.mock.calls.length > 0, 5000)).toBe(true);

      await userEvent.click(canvas.getByRole('button', { name: L.pause }));
      await expect(await until(() => paused.mock.calls.length > 0, 5000)).toBe(true);
      // Pausa de verdade: `ended` falso.
      await expect(paused).toHaveBeenCalledWith(expect.objectContaining({ ended: false }));
    });

    await step('O relógio anuncia tempo, não um número solto', async () => {
      const slider = canvas.getByRole('slider', { name: L.seek });
      // A duração precisa ser conhecida para haver posição a anunciar; a espera
      // é pelo próprio atributo que a asserção seguinte lê.
      await until(() => Boolean(slider.getAttribute('aria-valuetext')));
      // "37" não é posição para quem ouve. O texto do valor é o relógio.
      await expect(slider.getAttribute('aria-valuetext') ?? '').toMatch(seekValueTextPattern(L.seekValueText));
      await expect(clockText(root)).toMatch(/\d+:\d{2} \/ \d+:\d{2}/);
      await expect(formatTime(83)).toBe('1:23');
      // Duração desconhecida não pode virar `NaN:aN` na tela.
      await expect(formatTime(Number.NaN)).toBe('--:--');
    });

    await step('A velocidade é um seletor nativo, e muda a reprodução', async () => {
      const rateSelect = canvas.getByRole('combobox', { name: L.rate }) as HTMLSelectElement;
      // `1×`, e não `1`: o número sozinho não diz de que grandeza se fala.
      await expect(rateSelect.textContent).toContain('1×');

      await userEvent.selectOptions(rateSelect, '1.5');
      await expect(media.playbackRate).toBe(1.5);

      // E a barra segue o ELEMENTO, como no botão de tocar: mudar a taxa por
      // fora tem de repintar o seletor sem passar por ele.
      media.playbackRate = 0.5;
      await until(() => rateSelect.value === '0.5');
      await expect(rateSelect.value).toBe('0.5');
      media.playbackRate = 1;
    });

    await step('O silêncio também é estado, e o par de rótulos o anuncia', async () => {
      // Precondição própria: chega aqui com som, venha de onde vier.
      media.muted = false;
      await until(() => Boolean(canvas.queryByRole('button', { name: L.mute })));

      await userEvent.click(canvas.getByRole('button', { name: L.mute }));
      await until(() => media.muted);
      await expect(canvas.getByRole('button', { name: L.unmute })).toBeInTheDocument();

      await userEvent.click(canvas.getByRole('button', { name: L.unmute }));
      await until(() => !media.muted);
      await expect(canvas.getByRole('button', { name: L.mute })).toBeInTheDocument();
      media.muted = true;
    });

    await step('Áudio não oferece tela cheia nem janela flutuante', async () => {
      // Os dois são de vídeo. Num player de áudio o botão não teria o que
      // mostrar, e botão que não faz nada é ruído.
      await expect(canvas.queryByRole('button', { name: L.enterFullscreen })).toBeNull();
      await expect(canvas.queryByRole('button', { name: L.enterPip })).toBeNull();
    });

    await step('Os controles alcançam o mínimo de alvo de toque', async () => {
      // A medida sai do `getBoundingClientRect` do PRÓPRIO botão: é o que o axe
      // mede em `target-size`, e um `::after` no pai não conta para ele.
      for (const name of [L.play, L.mute]) {
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
