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
  rate: 'Velocidade de reprodução',
  enterFullscreen: 'Tela cheia',
  exitFullscreen: 'Sair da tela cheia',
  enterPip: 'Janela flutuante',
  exitPip: 'Sair da janela flutuante',
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
    // A afirmação de não-nulo é a story dizendo que SABE qual motor pediu:
    // `media` é nulo em provedor externo, e o tipo obriga a declarar isso em
    // vez de presumir.
    const media = root.media!;
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

    await step('A velocidade é um seletor nativo, e muda a reprodução', async () => {
      const seletor = canvas.getByRole('combobox', { name: LABELS.rate });
      await expect(seletor).toBeInTheDocument();
      // `1×`, e não `1`: o número sozinho não diz de que grandeza se fala.
      await expect(seletor.textContent).toContain('1×');

      await userEvent.selectOptions(seletor, '1.5');
      await expect(media.playbackRate).toBe(1.5);

      // E a barra segue o ELEMENTO, como no botão de tocar: mudar a taxa por
      // fora tem de repintar o seletor sem passar por ele.
      media.playbackRate = 0.5;
      await until(() => (seletor as HTMLSelectElement).value === '0.5');
      await expect((seletor as HTMLSelectElement).value).toBe('0.5');
      media.playbackRate = 1;
    });

    await step('Áudio não oferece tela cheia nem janela flutuante', async () => {
      // Os dois são de vídeo. Num player de áudio o botão não teria o que
      // mostrar, e botão que não faz nada é ruído — a mesma regra que fez os
      // controles de tabela do editor serem contextuais.
      await expect(canvas.queryByRole('button', { name: LABELS.enterFullscreen })).toBeNull();
      await expect(canvas.queryByRole('button', { name: LABELS.enterPip })).toBeNull();
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

/**
 * Um vídeo de verdade, desenhado num canvas e capturado como MediaStream.
 *
 * A versão anterior desta story alimentava um `<video>` com o WAV — e um
 * elemento de vídeo sem FAIXA de vídeo passa por toda a detecção de capacidade e
 * depois recusa o Picture-in-Picture com `InvalidStateError` (`videoWidth=0`,
 * medido). Era o botão que "não fazia nada" na tela.
 *
 * Como é stream ao vivo, o seletor de velocidade sai de cena: `playbackRate` é
 * ignorado em stream — também medido.
 */
function canvasStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#22333b';
    ctx.fillRect(0, 0, 320, 180);
    ctx.fillStyle = '#8ecae6';
    ctx.fillRect(20, 20, 120, 60);
  }
  return canvas.captureStream(10);
}

export const Video: Story = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  render: (args) =>
    createMediaPlayer({
      kind: 'video',
      stream: canvasStream(),
      // Stream ao vivo ignora `playbackRate` — sem lista, sem seletor.
      rates: [],
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
      await expect(root.media!.tagName).toBe('VIDEO');
      const track = root.media!.querySelector('track');
      await expect(track).toBeInTheDocument();
      await expect(track).toHaveAttribute('kind', 'captions');
      await expect(track).toHaveAttribute('srclang', 'pt-BR');
    });

    await step('A superfície ocupa a largura e não deforma', async () => {
      const estilo = getComputedStyle(root.media!);
      await expect(estilo.display).toBe('block');
      await expect(root.dataset.kind).toBe('video');
    });

    await step('A janela flutuante exige FAIXA de vídeo, não só um <video>', async () => {
      const canvas = within(canvasElement);
      const video = root.media! as HTMLVideoElement;

      // Este é o defeito que a dona encontrou clicando: a story alimentava um
      // `<video>` com o WAV. O elemento passava por TODA a detecção de
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
      const temQuadro = await until(() => video.videoWidth > 0, 5000);
      await expect(temQuadro).toBe(true);

      const botao = canvas.queryByRole('button', { name: LABELS.enterPip });
      if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
        // Com faixa de vídeo, o botão tem de estar visível de verdade — não
        // basta existir no DOM, porque ele NASCE escondido e só é revelado
        // quando os metadados chegam.
        await expect(botao).not.toBeNull();
        await expect(getComputedStyle(botao as HTMLElement).display).not.toBe('none');
      }
    });

    await step('Tela cheia e janela flutuante aparecem, por DETECÇÃO', async () => {
      const canvas = within(canvasElement);
      // A detecção é em tempo de execução: a resposta muda com o navegador e
      // com a política de permissão do iframe que hospeda a página. Medido no
      // navegador da suíte — `fullscreenEnabled` e `pictureInPictureEnabled`
      // ambos verdadeiros, e o iframe do Storybook com `allowfullscreen`.
      const podeTela = document.fullscreenEnabled;
      const podeJanela =
        document.pictureInPictureEnabled && !(root.media! as HTMLVideoElement)
          .disablePictureInPicture;

      const botaoTela = canvas.queryByRole('button', { name: LABELS.enterFullscreen });
      const botaoJanela = canvas.queryByRole('button', { name: LABELS.enterPip });

      // O que se afirma é a CORRESPONDÊNCIA, não a presença: onde o navegador
      // não oferece, o botão não pode existir; onde oferece, tem de existir.
      await expect(Boolean(botaoTela)).toBe(podeTela);
      await expect(Boolean(botaoJanela)).toBe(podeJanela);

      // A tela cheia é pedida na MOLDURA, não no vídeo — pedindo no `<video>` o
      // navegador desenha os controles dele e a nossa barra desaparece
      // justamente quando a tela é maior.
      await expect(typeof root.requestFullscreen).toBe('function');
    });

    await step('O que a suíte NÃO consegue provar, e por quê', async () => {
      // Medido: o clique sintético do driver não concede ativação do usuário
      // (`navigator.userActivation.hasBeenActive` = false), e tela cheia e PiP a
      // exigem — as duas recusam com `TypeError` e `NotAllowedError`. Então a
      // suíte alcança a detecção, a fiação e o tratamento da recusa; não alcança
      // a entrada de fato. Registrado aqui para ninguém ler o verde como prova
      // do que ele não mede.
      const ativacao = (
        navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
      ).userActivation;
      if (ativacao) await expect(ativacao.hasBeenActive).toBe(false);

      // O tratamento da recusa É verificável: o botão não pode ficar prometendo
      // um estado que não aconteceu.
      const botaoTela = within(canvasElement).queryByRole('button', {
        name: LABELS.enterFullscreen,
      });
      if (botaoTela) {
        await userEvent.click(botaoTela);
        await new Promise((r) => setTimeout(r, 80));
        await expect(document.fullscreenElement).toBeNull();
        // Continua dizendo "entrar", porque não entrou.
        await expect(botaoTela).toHaveAttribute('aria-label', LABELS.enterFullscreen);
      }
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
 * provedor manda.
 *
 * O que fica sem cobertura está dito em voz alta no último passo: o aperto de
 * mão real com o YouTube.
 */
export const YouTube: Story = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  render: (args) =>
    createMediaPlayer({
      embed: { provider: 'youtube', videoId: 'aqz-KE-bpKQ' },
      labels: LABELS,
      onPlay: args.onPlay,
      onPause: args.onPause,
      onEnded: args.onEnded,
    }),

  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="media-player"]') as MediaPlayerRoot;
    const frame = root.frame!;

    await step('É um quadro, e não há elemento de mídia', async () => {
      // O tipo já diz isto, e a story confirma em execução: quem escrever
      // `player.media.currentTime` num provedor recebe nulo, não um erro
      // obscuro três telas adiante.
      await expect(root.media).toBeNull();
      await expect(frame.tagName).toBe('IFRAME');
      // Sem `title`, o leitor de tela anuncia só "quadro" — e uma página com
      // três vídeos vira três "quadro".
      await expect(frame).toHaveAttribute('title', LABELS.player);
    });

    await step('A URL protege quem assiste e habilita a conversa', async () => {
      // Domínio sem cookie por padrão: o domínio comum grava perfil de quem
      // assiste antes mesmo do play.
      await expect(frame.src).toContain('youtube-nocookie.com');
      await expect(frame.src).toContain('enablejsapi=1');
      // Sem `origin` o YouTube recusa comandos — é a proteção dele contra
      // terceiro dirigindo a reprodução.
      await expect(frame.src).toContain('origin=');
      // Sem isto o iOS abre em tela cheia sozinho ao dar play, e a barra some
      // no momento em que seria usada.
      await expect(frame.src).toContain('playsinline=1');
    });

    await step('As permissões que os controles precisam são delegadas', async () => {
      for (const permissao of ['autoplay', 'fullscreen', 'picture-in-picture']) {
        await expect(frame.allow).toContain(permissao);
      }
    });

    await step('A barra não oferece o que o provedor não entrega', async () => {
      // Picture-in-Picture pede a FAIXA de vídeo, e ela está dentro de um
      // documento de outra origem: não há como pedir daqui. O provedor oferece
      // o dele, dentro do próprio quadro.
      await expect(canvas.queryByRole('button', { name: LABELS.enterPip })).toBeNull();
      // Tela cheia continua, porque quem entra em tela cheia é a MOLDURA — e
      // ela é nossa.
      await expect(canvas.queryByRole('button', { name: LABELS.enterFullscreen })).not.toBeNull();
    });

    await step('O caminho do evento, encenado com as mensagens do provedor', async () => {
      (args.onPlay as ReturnType<typeof fn>).mockClear();
      (args.onPause as ReturnType<typeof fn>).mockClear();
      (args.onEnded as ReturnType<typeof fn>).mockClear();

      // As cargas são as MESMAS que o YouTube envia: `onStateChange` com estado
      // numérico. Encenar o provedor é o que permite cobrir o caminho inteiro
      // sem rede — e o dialeto está preso em `media-embed.test.ts`.
      const doQuadro = (data: unknown) =>
        window.dispatchEvent(
          new MessageEvent('message', { data, source: frame.contentWindow }),
        );

      doQuadro(JSON.stringify({ event: 'onStateChange', info: 1 }));
      await until(() => (args.onPlay as ReturnType<typeof fn>).mock.calls.length > 0);
      await expect(args.onPlay).toHaveBeenCalled();
      // E a barra segue o estado: o botão passou a oferecer pausa sem ninguém
      // ter clicado nele.
      await expect(canvas.getByRole('button', { name: LABELS.pause })).toBeInTheDocument();

      doQuadro(JSON.stringify({ event: 'onStateChange', info: 2 }));
      await until(() => (args.onPause as ReturnType<typeof fn>).mock.calls.length > 0);
      // Pausa de verdade num provedor: `ended` falso, mesma forma do motor
      // nativo. É o ponto do desenho — uma API, dois motores.
      await expect(args.onPause).toHaveBeenCalledWith(
        expect.objectContaining({ ended: false }),
      );

      doQuadro(JSON.stringify({ event: 'infoDelivery', info: { currentTime: 30, duration: 120 } }));
      await until(() => (root.querySelector('[data-slot="media-player-time"]')?.textContent ?? '')
        .includes('0:30'));
      await expect(root.querySelector('[data-slot="media-player-time"]')?.textContent)
        .toBe('0:30 / 2:00');

      doQuadro(JSON.stringify({ event: 'onStateChange', info: 0 }));
      await until(() => (args.onEnded as ReturnType<typeof fn>).mock.calls.length > 0);
      await expect(args.onEnded).toHaveBeenCalled();
    });

    await step('Mensagem de OUTRA origem é ignorada', async () => {
      (args.onPause as ReturnType<typeof fn>).mockClear();
      // A página recebe `message` de qualquer um — outro embed, uma extensão,
      // um anúncio. Sem conferir a fonte, um segundo player pausa o primeiro, e
      // uma extensão qualquer mexe na reprodução.
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'onStateChange', info: 2 }),
          source: window,
        }),
      );
      await new Promise((r) => setTimeout(r, 60));
      await expect(args.onPause).not.toHaveBeenCalled();
    });

    await step('O que esta suíte NÃO prova', async () => {
      // O aperto de mão real com o YouTube exige rede, e suíte que depende de
      // serviço externo falha por motivo alheio ao código. O quadro nem carrega
      // aqui. Coberto: URL, permissões, dialeto (em `media-embed.test.ts`) e o
      // caminho do evento. Não coberto: a conversa de verdade.
      //
      // Registrado como asserção para ninguém ler o verde como prova do que ele
      // não mede.
      await expect(frame.src.startsWith('https://')).toBe(true);
    });
  },
};
