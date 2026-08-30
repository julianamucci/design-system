// ─── MediaPlayer — andaime das stories e da docs page ────────────────────────
//
// Nada aqui vira snippet: o painel Code lê `media-player.source.ts`. Este módulo
// existe para que os quatro arquivos de story E a docs page compartilhem os
// rótulos, a mídia de exemplo e o acesso à instância — sem isso cada consumidor
// carregaria a sua cópia, e cópia divergida não é variação: é o defeito, porque
// corrigir uma delas deixa as outras erradas sem nenhum sinal.
//
// Fica fora dos `*.stories.tsx` porque no CSF TODO export nomeado é lido como
// story: `export const LABELS` num arquivo de story apareceria na barra lateral.
//
// Nada de `storybook/test` aqui, de propósito — a docs page importa deste
// módulo, e arrastar o runner de teste para dentro dela levaria o pacote junto.
// O que é só do teste mora em `media-player.play-helpers.ts`.
//
// TODA mídia daqui é construída em MEMÓRIA. Nada é baixado, nada depende de
// rede: suíte que fala com serviço externo falha por motivo alheio ao código.

import { useMemo, useState } from 'react';
import {
  MediaPlayer,
  type MediaPlayerHandle,
  type MediaPlayerLabels,
  type MediaPlayerProps,
  type MediaPlayerTrack,
} from './media-player';
import { useI18nStore, type Locale } from '@/lib/i18n';
import mediaPlayerTranslations from '@shared/content/media-player/translations.json';

/**
 * Os rótulos da barra vêm do CONTEÚDO COMPARTILHADO, nos três idiomas.
 *
 * Todos os controles são só de ícone, então o rótulo É o nome acessível: é ele
 * que o leitor de tela anuncia, e é por ele que a play encontra cada botão. Um
 * objeto local em pt-BR deixaria a barra em português numa página em espanhol —
 * ilegível justamente para quem depende dela.
 *
 * A anotação de tipo é o portão: `labels` é lido como `MediaPlayerLabels` em
 * cada um dos três idiomas, então rótulo que sumir do JSON — ou idioma que ficar
 * para trás — reprova no `tsc`, e não na tela.
 */
const CONTENT: Record<Locale, { labels: MediaPlayerLabels }> = mediaPlayerTranslations;

/** Os rótulos de um idioma. */
export function mediaPlayerLabelsFor(locale: Locale): MediaPlayerLabels {
  return CONTENT[locale].labels;
}

/**
 * Os rótulos fora do React — `args` e `play` não são componente.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a barra mostra.
 */
export function mediaPlayerLabels(): MediaPlayerLabels {
  return mediaPlayerLabelsFor(useI18nStore.getState().locale);
}

/** A versão reativa, para dentro do render e da docs page. */
export function useMediaPlayerLabels(): MediaPlayerLabels {
  const locale = useI18nStore((state) => state.locale);
  return useMemo(() => mediaPlayerLabelsFor(locale), [locale]);
}

/**
 * Quantos segundos tem a mídia que a DEMONSTRAÇÃO mostra.
 *
 * A versão anterior usava 0,6s em toda parte, e o relógio da barra lia
 * `0:00 / 0:00` — que na tela se lê como componente quebrado. Zero vírgula seis
 * segundos servem a quem TESTA, porque a mídia acaba rápido; não servem a quem
 * LÊ, porque não há o que a barra represente. As stories que precisam do fim da
 * mídia continuam com clipes curtos, e cada uma diz por quê.
 */
export const DEMO_SECONDS = 60;

/**
 * WAV PCM 8 bits, mono, 8 kHz, silencioso, com a duração pedida.
 *
 * Quarenta e quatro bytes de cabeçalho e um byte por amostra — o formato mais
 * simples que um navegador toca sem codec externo. Silencioso porque a suíte
 * roda em bloco e áudio audível em teste é ruído literal.
 */
export function silentWav(seconds: number): string {
  // 4 kHz é o PISO, e é medido: a 2 kHz, 1 kHz e 500 Hz o navegador simplesmente
  // não carrega o arquivo — `duration` nunca sai de `NaN`. Como a duração é
  // bytes ÷ taxa, a taxa é quem decide quanto custa um minuto de demonstração:
  // 4 kHz o deixa em 313 KB de `data:` contra 625 KB a 8 kHz, e nada disso vai
  // para o pacote — é montado em memória na hora.
  const rate = 4000;
  const samples = Math.round(rate * seconds);
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
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
  // 128 é o silêncio em PCM de 8 bits sem sinal — zero seria o pico negativo.
  bytes.fill(128, 44);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Um vídeo de VERDADE, desenhado num canvas e capturado como MediaStream.
 *
 * Um `<video>` alimentado com o WAV passa por TODA a detecção de capacidade e
 * depois recusa o Picture-in-Picture com `InvalidStateError` — `videoWidth` fica
 * em 0, medido. Era o botão que "não fazia nada" na tela. O canvas dá faixa de
 * vídeo com dimensão, que é o que o PiP exige.
 *
 * Sendo stream ao vivo, `playbackRate` é ignorado (1.5 escrito lê de volta 1) e
 * a duração é infinita — por isso quem usa esta fonte passa `rates={[]}`.
 */
export function canvasStream(): MediaStream {
  const canvas = document.createElement('canvas');
  // 1280×720, e não os 320×180 de antes: o elemento ocupa a largura do
  // container, então uma fonte pequena é ESTICADA. Medido — 320×180 virava
  // 1198×674 numa story de 1200px, um borrão.
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#22333b';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#8ecae6';
    context.fillRect(80, 80, 480, 240);
  }
  return canvas.captureStream(10);
}

/**
 * Uma faixa de legenda vazia, em `data:`.
 *
 * Vazia e ainda assim presente: vídeo com áudio SEM legenda reprova em
 * WCAG 1.2.2 (nível A), e uma story não pode ensinar o contrário. O conteúdo
 * é o cabeçalho `WEBVTT` e nada mais — o que se demonstra é a DECLARAÇÃO da
 * faixa, não a tradução de um diálogo que não existe.
 */
export const EMPTY_VTT = 'data:text/vtt;base64,V0VCVlRUCgo=';

/** A faixa que toda story de vídeo declara. */
export function captionTrack(): MediaPlayerTrack {
  return { src: EMPTY_VTT, srclang: 'pt-BR', label: 'Português', default: true };
}

/**
 * Identificadores públicos, escolhidos por serem estáveis há mais de uma década.
 *
 * O quadro NÃO carrega na suíte, e é de propósito — ver a story de provedor.
 * Estão aqui para a demonstração no navegador de quem lê a documentação.
 */
// Uma definição só, em `media-player.source.ts`: é o snippet que precisa do
// valor como texto, e declarar nos dois faria o painel Code ensinar um vídeo
// enquanto a demonstração toca outro.
export { VIMEO_VIDEO_ID, YOUTUBE_VIDEO_ID } from './media-player.source';

// ─── Acesso à instância ──────────────────────────────────────────────────────

/**
 * As instâncias montadas, indexadas pela própria moldura.
 *
 * Em vanilla a fábrica devolve a raiz com `media` e `frame` pendurados; aqui a
 * mesma dupla chega por `ref`, e a play precisa alcançá-la. A chave é o nó raiz
 * porque é o que a play tem em mãos: uma variável de módulo apontaria sempre
 * para a última instância montada, e a composição de dois players e a docs page
 * montam várias.
 */
const handles = new WeakMap<HTMLElement, MediaPlayerHandle>();

/** `ref` das stories e da docs page. Função de MÓDULO, para ser estável. */
export function registerMediaPlayer(handle: MediaPlayerHandle | null): void {
  if (handle?.root) handles.set(handle.root, handle);
}

/** As molduras montadas neste canvas, na ordem do DOM. */
export function mediaPlayerRoots(canvasElement: HTMLElement): HTMLElement[] {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="media-player"]'));
}

/** O player desta moldura. Falha alto se ainda não montou. */
export function mediaPlayerHandleFor(root: HTMLElement): MediaPlayerHandle {
  const handle = handles.get(root);
  if (!handle) throw new Error('MediaPlayer ainda não montado nesta moldura');
  return handle;
}

/** O único player montado neste canvas. */
export function mediaPlayerHandle(canvasElement: HTMLElement): MediaPlayerHandle {
  const [root] = mediaPlayerRoots(canvasElement);
  if (!root) throw new Error('Nenhum MediaPlayer montado neste canvas');
  return mediaPlayerHandleFor(root);
}

/**
 * O mesmo `MediaPlayer`, com a instância registrada para a play alcançar e a
 * moldura fluida em volta.
 *
 * O player é `width: 100%`, e sob `layout: 'padded'` o container do canvas já
 * tem largura definida — o wrapper só declara que a caixa ocupa tudo.
 *
 * Sem `labels` explícitos, resolve os do idioma CORRENTE: quem troca de idioma
 * no seletor da página vê a barra trocar junto.
 */
export function MediaPlayerCanvas({
  labels,
  ...props
}: Omit<MediaPlayerProps, 'ref' | 'labels'> & { labels?: MediaPlayerLabels }) {
  const fallback = useMediaPlayerLabels();
  return (
    <div className="nds-w-full">
      <MediaPlayer {...props} labels={labels ?? fallback} ref={registerMediaPlayer} />
    </div>
  );
}

/**
 * A captura do canvas, montada UMA vez por montagem.
 *
 * `canvasStream()` chamado direto no `render` da story produziria uma captura
 * nova a cada redesenho, e a limpeza pararia as trilhas da anterior no meio da
 * reprodução. Em vanilla o `render` roda uma vez por montagem; aqui roda toda
 * vez que um arg ou um global do Storybook muda.
 */
export function useCanvasStream(): MediaStream {
  const [stream] = useState(canvasStream);
  return stream;
}

/**
 * `rates` desligado, como constante de MÓDULO.
 *
 * Stream ao vivo ignora `playbackRate` — medido, 1.5 escrito lê de volta 1 —, e
 * lista vazia é o que esconde o seletor. Constante porque um literal novo a cada
 * desenho seria uma prop nova a cada desenho.
 */
export const NO_RATES: number[] = [];

/**
 * Player de vídeo alimentado por canvas — a fonte de vídeo de toda story e de
 * toda demonstração desta stack.
 *
 * Mora nas fixtures, e não copiado em cada arquivo: quatro arquivos de story e a
 * docs page precisam exatamente do mesmo andaime, e cópia divergida é o defeito
 * que ninguém vê.
 */
export function CanvasVideoPlayer({
  tracks,
  ...props
}: Omit<MediaPlayerProps, 'ref' | 'labels' | 'kind' | 'stream' | 'src' | 'embed'> & {
  labels?: MediaPlayerLabels;
}) {
  const stream = useCanvasStream();
  return (
    <MediaPlayerCanvas
      kind="video"
      stream={stream}
      rates={NO_RATES}
      // Uma faixa de legenda, ainda que vazia: vídeo com áudio SEM legenda
      // reprova em WCAG 1.2.2 (nível A), e a story não pode ensinar o contrário.
      // O contra-exemplo do Do & Don't passa a lista vazia de propósito.
      tracks={tracks ?? [captionTrack()]}
      {...props}
    />
  );
}
