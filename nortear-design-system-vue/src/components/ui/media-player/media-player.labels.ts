/**
 * Os doze rótulos da barra do MediaPlayer, lidos do CONTEÚDO COMPARTILHADO.
 *
 * Todo controle é só de ícone: o rótulo É o nome acessível, aquilo que o leitor
 * de tela anuncia. Nome acessível é conteúdo, não constante de código — uma
 * barra em português numa página em espanhol é ilegível para quem ouve, e o
 * defeito não aparece na tela de ninguém que enxergue.
 *
 * O módulo é FOLHA de propósito: a docs page e o andaime das stories precisam
 * dos mesmos rótulos, e pôr a leitura em `media-player.fixtures.ts` arrastaria
 * junto o que aquele módulo importa.
 *
 * A ANOTAÇÃO DE TIPO é o portão. `CONTENT` é lido como `MediaPlayerLabels` em
 * cada um dos três idiomas, então rótulo que sumir do JSON, ou idioma que ficar
 * para trás numa tradução, reprova no `vue-tsc` — e não em silêncio na tela,
 * com a chave crua no lugar do nome do botão.
 */
import mediaPlayerTranslations from '@shared/content/media-player/translations.json';
import type { Locale } from '@/lib/i18n';
import type { MediaPlayerLabels } from './index';

type MediaPlayerContent = { labels: MediaPlayerLabels };

const CONTENT: Record<Locale, MediaPlayerContent> = mediaPlayerTranslations;

/**
 * Os rótulos de um idioma, como o conteúdo os declara.
 *
 * É função, e não constante, porque a docs page refaz as seções a cada troca de
 * idioma: a barra troca junto com o texto em volta.
 */
export function mediaPlayerLabelsFor(locale: Locale): MediaPlayerLabels {
  return CONTENT[locale].labels;
}
