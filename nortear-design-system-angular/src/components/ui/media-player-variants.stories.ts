// ─── MediaPlayer — Fontes ────────────────────────────────────────────────────
//
// O eixo de variação deste componente é a FONTE, não a aparência: a barra é a
// mesma nas quatro, e é esse o ponto. `Video` e `Audio` usam o motor nativo;
// `YouTube` e `Vimeo` trocam o motor por um quadro de outra origem sem trocar
// uma linha da API de quem consome.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { MediaPlayerComponent, type MediaPlayerHostElement } from './media-player';
import {
  MEDIA_PLAYER_LABELS,
  VIMEO_VIDEO_ID,
  YOUTUBE_VIDEO_ID,
  canvasStream,
  captionTrack,
  silentWav,
  DEMO_SECONDS,
} from './media-player.fixtures';
import { firstControl, clockText, until } from './media-player.play-helpers';
import {
  mediaPlayerAudioSource,
  mediaPlayerTracksSource,
  mediaPlayerVimeoSource,
  mediaPlayerYoutubeSource,
} from './media-player.source';

const meta: Meta = {
  title: 'Primitives/Display/MediaPlayer/Variants',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [MediaPlayerComponent] })],
  // Sem `argTypes` próprios, o painel Controls ficaria vazio e a aba Actions
  // prometeria um evento que nenhum arg alimenta.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Video: Story = {
  parameters: {
    docs: { source: { transform: mediaPlayerTracksSource } },
  },
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      stream: canvasStream(),
      // Uma faixa de legenda, ainda que vazia: vídeo com áudio SEM legenda
      // reprova em WCAG 1.2.2 (nível A), e a story não pode ensinar o contrário.
      tracks: [captionTrack()],
      // Stream ao vivo ignora `playbackRate` — sem lista, sem seletor. Medido:
      // 1.5 escrito lê de volta 1.
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
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.media));
    const video = root.media! as HTMLVideoElement;

    await step('É um <video>, e ele carrega a faixa de legenda', async () => {
      await expect(video.tagName).toBe('VIDEO');
      await expect(root.dataset['kind']).toBe('video');
      const track = video.querySelector('track');
      await expect(track).toHaveAttribute('kind', 'captions');
      await expect(track).toHaveAttribute('srclang', 'pt-BR');
    });

    await step('Controle marcado como `hidden` some de verdade', async () => {
      // O atributo `hidden` sozinho não esconde nada quando a folha declara
      // `display`: `[hidden] { display: none }` é regra do agente de usuário e
      // perde para QUALQUER declaração de autor. Foi assim que o botão de
      // janela flutuante — que nasce escondido e só é revelado quando se
      // descobre que há faixa de vídeo — ficou na barra o tempo todo,
      // prometendo o que o navegador recusa com `InvalidStateError`.
      //
      // A asserção MARCA o controle em vez de procurar um que esteja escondido
      // agora. Procurar dependeria de qual controle está escondido neste
      // instante, que varia com a stack e com o momento em que os primeiros
      // quadros chegam — e onde não houvesse nenhum, o passo passaria sem medir
      // nada. Portão que filtra exclui em silêncio.
      //
      // `queryByRole` não serve aqui: ele honra o ATRIBUTO e enxerga o controle
      // como ausente qualquer que seja o CSS. Por isso nenhuma suíte pegava, e
      // quem via era só quem abria a tela.
      const guarded = root.querySelector('.nds-media-player-button') as HTMLElement;
      guarded.hidden = true;
      await expect(getComputedStyle(guarded).display).toBe('none');
      guarded.hidden = false;
      await expect(getComputedStyle(guarded).display).not.toBe('none');
    });

    await step('Fonte ao vivo se ANUNCIA, em vez de fingir um relógio', async () => {
      // Transmissão não tem duração — o navegador reporta `Infinity`, e é o que
      // um canal ao vivo de verdade também reporta. `0:00 / --:--` ao lado de
      // uma barra que não anda se lê como componente quebrado; foi assim que a
      // dona viu. O que separa "não sei a duração" de "não existe duração" é
      // este aviso.
      // Prazo FOLGADO de propósito. `data-live` só aparece depois que a mídia
      // reporta `Infinity` em `duration`, e isso depende de `loadedmetadata` —
      // trabalho que compete com o resto da suíte. Medido em 2026-09-01: passou
      // numa rodada de 380s e reprovou na de 910s, com a mesma máquina e o
      // mesmo código, porque 5s não davam sob carga. O laço é de relógio e sai
      // assim que a condição vira, então o prazo maior não custa tempo de
      // rodada — só deixa de reprovar por carga.
      await until(() => root.dataset['live'] === 'true', 20000);
      await expect(root.dataset['live']).toBe('true');
      await expect(clockText(root)).toBe(MEDIA_PLAYER_LABELS.live);
      await expect(clockText(root)).not.toContain('--:--');

      // E a barra de progresso sai de cena, de verdade: não há posição para
      // onde arrastar, e slider parado é o "controle que não faz nada".
      const slider = root.querySelector('.nds-media-player-seek') as HTMLElement;
      await expect(slider.hasAttribute('hidden')).toBe(true);
      await expect(getComputedStyle(slider).display).toBe('none');
    });

    await step('A fonte ao vivo não promete velocidade que ela ignora', async () => {
      // `rates: []` esconde o seletor. Deixá-lo ali daria à pessoa um controle
      // que ela mexe e não acontece nada — o mesmo defeito que a janela
      // flutuante teve uma vez.
      await expect(canvas.queryByRole('combobox', { name: MEDIA_PLAYER_LABELS.rate })).toBeNull();
    });

    await step('A janela flutuante exige FAIXA de vídeo, não só um <video>', async () => {
      // Este é o defeito que a dona encontrou clicando: a story alimentava um
      // `<video>` com um WAV. O elemento passava por TODA a detecção de
      // capacidade — `pictureInPictureEnabled` responde pelo documento, não pelo
      // conteúdo — e o pedido recusava com `InvalidStateError`, engolido pelo
      // `catch`. Na tela: clico e nada acontece.
      //
      // Medido, os dois casos se distinguem pelo nome do erro:
      //   videoWidth=0   → InvalidStateError (sem faixa de vídeo)
      //   videoWidth=160 → NotAllowedError   (só falta ativação do usuário)
      // Em stream ao vivo a largura só aparece com os primeiros quadros, e eles
      // só chegam tocando — por isso a story toca antes de medir.
      video.muted = true;
      // Este `play` é o do HTMLMediaElement, e não a `play` de outra story: a
      // regra casa pelo NOME do método e não distingue os dois.
      // eslint-disable-next-line storybook/context-in-play-function
      await video.play().catch(() => {});
      const hasVideoTrack = await until(() => video.videoWidth > 0, 5000);
      await expect(hasVideoTrack).toBe(true);

      if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
        // Com faixa de vídeo, o botão tem de estar visível DE VERDADE — não
        // basta existir no DOM, porque ele NASCE escondido e só é revelado
        // quando a largura aparece. E a leitura é do `display` computado, não do
        // atributo: `[hidden]` é regra de agente de usuário, e qualquer
        // declaração de autor a vence — já aconteceu quatro vezes neste
        // repositório.
        const appeared = await until(
          () => Boolean(canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip })),
          5000,
        );
        await expect(appeared).toBe(true);
        const button = canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip });
        await expect(button).not.toBeNull();
        await expect(getComputedStyle(button as HTMLElement).display).not.toBe('none');
      }
      video.pause();
    });

    await step('Em tela cheia a barra some parada — e nunca com foco dentro', async () => {
      // Tela cheia de VERDADE exige ativação do usuário, que o clique sintético
      // do driver não concede (medido). Por isso a regra pende de atributos
      // NOSSOS: aqui eles são postos à mão, e o que se afirma é a folha — que é
      // a metade que ninguém veria quebrar.
      const controls = root.querySelector(
        '[data-slot="media-player-controls"]',
      ) as HTMLElement;
      await expect(getComputedStyle(controls).opacity).toBe('1');

      root.dataset['fullscreen'] = 'true';
      root.dataset['idle'] = 'true';
      // A espera é pela TRANSIÇÃO, não pelo atributo: `getComputedStyle`
      // devolve o valor animado do instante, e medir logo depois de trocar o
      // atributo pega a barra no meio do desaparecimento.
      await expect(await until(() => getComputedStyle(controls).opacity === '0', 3000)).toBe(true);
      // Barra invisível que ainda recebe clique é armadilha.
      await expect(getComputedStyle(controls).pointerEvents).toBe('none');

      // A guarda que importa: com o foco dentro, a barra NÃO some. Quem navega
      // por teclado perderia o elemento focado sem ter feito nada.
      const playButton = firstControl(root);
      playButton.focus();
      await expect(document.activeElement).toBe(playButton);
      await expect(await until(() => getComputedStyle(controls).opacity === '1', 3000)).toBe(true);
      await expect(getComputedStyle(controls).pointerEvents).not.toBe('none');
      playButton.blur();

      // E fora da tela cheia a barra nunca some, mesmo parada: ali a moldura é
      // pequena e a barra é a única forma de operar.
      root.dataset['fullscreen'] = 'false';
      await expect(await until(() => getComputedStyle(controls).opacity === '1', 3000)).toBe(true);
      root.dataset['idle'] = 'false';
    });

    await step('Tela cheia e janela flutuante aparecem por DETECÇÃO', async () => {
      // A resposta muda com o navegador e com a política de permissão do iframe
      // que hospeda a página. O que se afirma é a CORRESPONDÊNCIA, não a
      // presença: onde o navegador não oferece, o botão não pode existir; onde
      // oferece, tem de existir.
      const canFullscreen = document.fullscreenEnabled;
      const canPip = document.pictureInPictureEnabled && !video.disablePictureInPicture;

      const fullscreenButton = canvas.queryByRole('button', {
        name: MEDIA_PLAYER_LABELS.enterFullscreen,
      });
      const pipButton = canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip });

      await expect(Boolean(fullscreenButton)).toBe(canFullscreen);
      await expect(Boolean(pipButton)).toBe(canPip);

      // A tela cheia é pedida na MOLDURA, não no vídeo — pedindo no `<video>` o
      // navegador desenha os controles dele e a nossa barra desaparece
      // justamente quando a tela é maior.
      await expect(typeof root.requestFullscreen).toBe('function');
    });

    await step('O que esta suíte NÃO prova, e por quê', async () => {
      // Medido: o clique sintético do driver não concede ativação do usuário
      // (`navigator.userActivation.hasBeenActive` = false), e tela cheia e
      // janela flutuante a exigem — recusam com `TypeError` e `NotAllowedError`.
      // A suíte alcança a detecção, a fiação e o tratamento da recusa; não
      // alcança a entrada de fato. Registrado como asserção para ninguém ler o
      // verde como prova do que ele não mede.
      const activation = (
        navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
      ).userActivation;
      if (activation) await expect(activation.hasBeenActive).toBe(false);
    });
  },
};

export const Audio: Story = {
  parameters: { docs: { source: { transform: mediaPlayerAudioSource } } },
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

    await step('É um <audio>, e a barra é a mesma do vídeo', async () => {
      await expect(root.media!.tagName).toBe('AUDIO');
      await expect(root.dataset['kind']).toBe('audio');
      await expect(
        canvas.getByRole('group', { name: MEDIA_PLAYER_LABELS.controls }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('slider', { name: MEDIA_PLAYER_LABELS.seek }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('combobox', { name: MEDIA_PLAYER_LABELS.rate }),
      ).toBeInTheDocument();
    });

    await step('Áudio não oferece o que é de vídeo', async () => {
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterFullscreen }),
      ).toBeNull();
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip }),
      ).toBeNull();
    });

    await step('A superfície não ocupa espaço — no áudio, a barra é o componente', async () => {
      const surface = root.media!;
      // O fundo declarado pela folha prova que a classe alcançou o elemento —
      // sem isto, "não ocupa espaço" também seria o que se veria se o CSS
      // simplesmente não tivesse carregado.
      await expect(getComputedStyle(surface).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

      // MEDIDO: aqui `display` volta `none`, e não o `block` que a folha
      // declara. A folha de agente de usuário do Chromium traz
      // `audio:not([controls]) { display: none !important }`, e `!important` de
      // agente de usuário é a única origem que declaração de autor não vence.
      // Onde o navegador não força isso, quem zera é o `block-size: 0` da nossa
      // folha. O invariante é o mesmo pelos dois caminhos, e é ele — e não o
      // `display` de um navegador só — que se afirma.
      await expect(surface.getBoundingClientRect().height).toBe(0);
    });
  },
};

/**
 * Vídeo hospedado no YouTube — mesma barra, mesma API, outro motor.
 *
 * O quadro NÃO carrega nesta suíte, e é de propósito: depender de serviço
 * externo faria a rodada falhar por motivo alheio ao código. O que a story
 * exercita é tudo que não precisa de rede — a URL construída, as permissões
 * delegadas, e o CAMINHO DO EVENTO, encenado com mensagens iguais às que o
 * provedor manda. O dialeto tem teste próprio em `media-embed.test.ts`.
 */
export const YouTube: Story = {
  parameters: {
    docs: {
      source: { transform: mediaPlayerYoutubeSource },
    },
  },
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      embed: { provider: 'youtube', videoId: YOUTUBE_VIDEO_ID },
    },
    template: '<nds-media-player [embed]="embed" [labels]="labels" />',
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.frame));
    const frame = root.frame!;

    await step('É um quadro, e não há elemento de mídia', async () => {
      // O tipo já diz isto, e a story confirma em execução: quem escrever
      // `player.media.currentTime` num provedor recebe nulo, não um erro obscuro
      // três telas adiante.
      await expect(root.media).toBeNull();
      await expect(frame.tagName).toBe('IFRAME');
      await expect(root.dataset['kind']).toBe('youtube');
      // Sem `title`, o leitor de tela anuncia só "quadro" — e uma página com
      // três vídeos vira três "quadro".
      await expect(frame).toHaveAttribute('title', MEDIA_PLAYER_LABELS.player);
    });

    await step('A URL protege quem assiste e habilita a conversa', async () => {
      // Domínio sem cookie por padrão: o domínio comum grava perfil de quem
      // assiste antes mesmo do play.
      await expect(frame.src).toContain('youtube-nocookie.com');
      await expect(frame.src).toContain('enablejsapi=1');
      // Sem `origin` o YouTube recusa comandos — é a proteção dele contra
      // terceiro dirigindo a reprodução.
      await expect(frame.src).toContain('origin=');
      // Sem isto o iOS abre em tela cheia sozinho ao dar play, e a barra some no
      // momento em que seria usada.
      await expect(frame.src).toContain('playsinline=1');
    });

    await step('As permissões que os controles precisam são delegadas', async () => {
      for (const permission of ['autoplay', 'fullscreen', 'picture-in-picture']) {
        await expect(frame.allow).toContain(permission);
      }
    });

    await step('A barra não oferece o que o provedor não entrega', async () => {
      // A janela flutuante pede a FAIXA de vídeo, e ela está dentro de um
      // documento de outra origem: não há como pedir daqui. O provedor oferece a
      // dele, dentro do próprio quadro.
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip }),
      ).toBeNull();
      // Tela cheia continua, porque quem entra em tela cheia é a MOLDURA — e ela
      // é nossa.
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterFullscreen }),
      ).not.toBeNull();
    });
  },
};

/**
 * O mesmo desenho, outro provedor — e o dialeto é OUTRO.
 *
 * O Vimeo assina um evento por vez, fala por `method`/`value` em vez de
 * `event`/`func`, e não tem "mudo": tem volume. A story existe para provar que a
 * diferença fica toda em `media-embed.ts`, e não vaza para a barra.
 */
export const Vimeo: Story = {
  parameters: {
    docs: {
      source: { transform: mediaPlayerVimeoSource },
    },
  },
  render: () => ({
    props: {
      labels: MEDIA_PLAYER_LABELS,
      embed: { provider: 'vimeo', videoId: VIMEO_VIDEO_ID },
    },
    template: '<nds-media-player [embed]="embed" [labels]="labels" />',
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-slot="media-player"]',
    ) as MediaPlayerHostElement;
    await until(() => Boolean(root.frame));
    const frame = root.frame!;

    await step('É um quadro do Vimeo, com nome próprio', async () => {
      await expect(root.media).toBeNull();
      await expect(root.dataset['kind']).toBe('vimeo');
      await expect(frame.src).toContain('player.vimeo.com/video/');
      await expect(frame.src).toContain(VIMEO_VIDEO_ID);
      // Sem `api=1` o Vimeo não aceita comando nem envia evento.
      await expect(frame.src).toContain('api=1');
      await expect(frame).toHaveAttribute('title', MEDIA_PLAYER_LABELS.player);
    });

    await step('A barra é a MESMA do YouTube e a do vídeo nativo', async () => {
      // É o ponto do desenho: quem consome escreve a mesma coisa nos quatro
      // casos. Trocar o motor não redesenha nada.
      await expect(
        canvas.getByRole('group', { name: MEDIA_PLAYER_LABELS.controls }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('button', { name: MEDIA_PLAYER_LABELS.play }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('slider', { name: MEDIA_PLAYER_LABELS.seek }),
      ).toBeInTheDocument();
      await expect(
        canvas.queryByRole('button', { name: MEDIA_PLAYER_LABELS.enterPip }),
      ).toBeNull();
    });
  },
};
