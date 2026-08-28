/**
 * Andaime das demonstrações do MediaPlayer — um construtor, cinco arquivos.
 *
 * Existe porque num `*.stories.ts` todo export nomeado vira story: o andaime
 * não pode morar lá, e a saída fácil é copiar a constante para cada arquivo.
 * Cópia divergida não é variação — é o defeito, porque corrigir uma delas
 * deixa as outras erradas sem nenhum sinal.
 *
 * Aqui os rótulos são o NOME ACESSÍVEL de cada botão — todos são só de ícone —,
 * e é por eles que toda play encontra o que clicar. Um rótulo diferente num
 * arquivo quebraria a busca em vez de mudar a aparência.
 *
 * Nada de `storybook/test` neste módulo, de propósito: a docs page importa
 * daqui os rótulos e a mídia da demonstração, e arrastar o runner de teste
 * para dentro dela levaria o pacote junto.
 *
 * TODA mídia daqui é construída em MEMÓRIA. Nada é baixado, nada depende de
 * rede: suíte que fala com serviço externo falha por motivo alheio ao código.
 */

import { createTranslation } from '@/lib/i18n';
import mediaPlayerTranslations from '@shared/content/media-player/translations.json';
import type { MediaPlayerLabels, MediaPlayerTrack } from './media-player';

const { t } = createTranslation(mediaPlayerTranslations as Record<string, unknown>);

// A lista é EXAUSTIVA por construção, e é o `satisfies` que garante: um rótulo
// novo no tipo sem entrada aqui não compila. Uma lista solta, com `as`, deixaria
// o botão novo sair da barra com o nome da própria chave por nome acessível —
// defeito silencioso, e só visível para quem ouve.
const LABEL_KEYS = Object.keys({
  player: 1, controls: 1, play: 1, pause: 1, mute: 1, unmute: 1,
  seek: 1, rate: 1, enterFullscreen: 1, exitFullscreen: 1, enterPip: 1, exitPip: 1,
} satisfies Record<keyof MediaPlayerLabels, 1>) as Array<keyof MediaPlayerLabels>;

/**
 * Monta os rótulos a partir do conteúdo compartilhado, no idioma da página.
 *
 * É função, e não constante, porque `t()` resolve no idioma corrente: a docs
 * page refaz as seções a cada troca de idioma, e a barra troca junto.
 */
export function mediaPlayerLabels(): MediaPlayerLabels {
  return Object.fromEntries(
    LABEL_KEYS.map((key) => [key, t(`labels.${key}`)]),
  ) as MediaPlayerLabels;
}

/**
 * Os rótulos das stories, resolvidos uma vez na carga do módulo.
 *
 * A story não troca de idioma no meio da execução, e a play precisa do MESMO
 * texto que a barra recebeu para encontrar o botão por nome acessível.
 */
export const LABELS: MediaPlayerLabels = mediaPlayerLabels();

/**
 * WAV PCM 8 bits, mono, 8 kHz, silencioso, com a duração pedida.
 *
 * Quarenta e quatro bytes de cabeçalho e um byte por amostra — o formato mais
 * simples que um navegador toca sem codec externo. Silencioso porque a suíte
 * roda em bloco e áudio audível em teste é ruído literal.
 */
export function silentWav(seconds: number): string {
  const rate = 8000;
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
