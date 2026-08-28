/**
 * Andaime das demonstrações do MediaPlayer — um construtor, cinco arquivos.
 *
 * Existe porque num `*.stories.ts` todo export nomeado vira story: o andaime
 * não pode morar lá, e a saída fácil é copiar a constante para cada arquivo.
 * Cópia divergida não é variação — é o defeito, porque corrigir uma delas
 * deixa as outras erradas sem nenhum sinal.
 *
 * Nada de `storybook/test` neste módulo, de propósito: a docs page importa
 * daqui a mídia da demonstração, e arrastar o runner de teste para dentro dela
 * levaria o pacote junto. As esperas e as sondas moram em
 * `media-player.play-helpers.ts`.
 *
 * TODA mídia daqui é construída em MEMÓRIA. Nada é baixado, nada depende de
 * rede: suíte que fala com serviço externo falha por motivo alheio ao código.
 */

import type { MediaPlayerLabels, MediaPlayerTrack } from './index';
import { mediaPlayerLabelsFor } from './media-player.labels';

/**
 * Os rótulos das stories, resolvidos uma vez na carga do módulo, em pt-BR.
 *
 * A story não troca de idioma no meio da execução, e a play precisa do MESMO
 * texto que a barra recebeu para encontrar o botão por nome acessível. A docs
 * page, que troca de idioma no seletor, chama `mediaPlayerLabelsFor(locale)` a
 * cada mudança.
 *
 * O portão de rótulo ausente — ou de idioma que ficou para trás na tradução —
 * é a anotação de tipo dentro de `media-player.labels.ts`, e ele reprova no
 * `vue-tsc`, não na tela.
 */
export const LABELS: MediaPlayerLabels = mediaPlayerLabelsFor('pt-BR');

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
 * a duração é infinita — por isso quem usa esta fonte passa `rates: []`.
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
export const YOUTUBE_VIDEO_ID = 'aqz-KE-bpKQ';
export const VIMEO_VIDEO_ID = '76979871';
