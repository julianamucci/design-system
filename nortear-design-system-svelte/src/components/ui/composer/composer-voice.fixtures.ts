/**
 * Andaime das demonstrações do ditado — os rótulos e os valores de exemplo.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * nível e o tempo decorrido são dado de exemplo e ficam iguais nos três
 * idiomas: são o que a foto do Chromatic compara, e um número diferente por
 * idioma faria as cinco stacks fotografarem barras de alturas diferentes.
 *
 * Os rótulos do CAMPO não moram aqui, e isso é divergência de forma em relação
 * à referência: nesta stack eles já são os mesmos para todas as peças da
 * moldura, e `composer.fixtures.ts` é quem os tem — quem precisa do trilho
 * importa `composerLabels` de lá. Uma segunda cópia divergiria sem sinal, que é
 * exatamente o que este arquivo existe para evitar.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import voiceTranslations from '@shared/content/composer-voice/translations.json';
import type { ComposerVoiceLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComposerVoiceLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um estado
 * sem palavra deixaria o controle com o medidor e sem a informação.
 */
const CONTENT: Record<Locale, { labels: ComposerVoiceLabels }> = voiceTranslations;

/** Os rótulos do controle num idioma — a forma para quem já tem o locale em mãos. */
export function voiceLabelsFor(target: Locale): ComposerVoiceLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos do controle fora de um componente — `props` de story e `play` não
 * são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que o controle desenha.
 */
export function voiceLabels(): ComposerVoiceLabels {
  return voiceLabelsFor(get(locale));
}

/**
 * O nível de exemplo enquanto capta.
 *
 * Nem cheio nem no chão: 1 desenharia o mesmo que a ausência de nível, e 0
 * desenharia um medidor apagado no exato estado em que ele deveria estar vivo.
 * Um valor no meio é o único que prova que o número chega ao desenho.
 */
export const SAMPLE_LEVEL = 0.62;

/** O tempo decorrido de exemplo, JÁ ESCRITO — quem formata é quem consome. */
export const SAMPLE_ELAPSED = '0:12';

/** O tempo de exemplo quando a captura já acabou e o texto ainda vem. */
export const SAMPLE_ELAPSED_DONE = '0:34';
