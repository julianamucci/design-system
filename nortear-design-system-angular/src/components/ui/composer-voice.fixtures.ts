/**
 * Andaime das demonstrações do ditado — os rótulos e os valores de exemplo.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O nível
 * e o tempo decorrido são dado de exemplo e ficam iguais nos três idiomas: são o
 * que a foto do Chromatic compara, e um número diferente por idioma faria as
 * cinco stacks fotografarem barras de alturas diferentes.
 *
 * O construtor dos rótulos do CAMPO é REEXPORTADO, e não reescrito: ele já mora
 * em `composer.fixtures.ts`, e o controle vive no trilho do campo. Copiar o
 * corpo produziria duas cópias que divergem sem nenhum sinal.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import voiceTranslations from '@shared/content/composer-voice/translations.json';
import type { ComposerVoiceLabels } from './composer-voice';

export { composerLabels } from './composer.fixtures';

const { t } = useTranslation(voiceTranslations as Record<string, unknown>);

/** Os rótulos do controle, no idioma corrente. */
export function voiceLabels(): ComposerVoiceLabels {
  return {
    start: t('labels.start'),
    stop: t('labels.stop'),
    status: {
      idle: t('labels.status.idle'),
      recording: t('labels.status.recording'),
      transcribing: t('labels.status.transcribing'),
    },
  };
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
