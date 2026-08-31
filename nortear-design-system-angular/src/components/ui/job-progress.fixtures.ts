/**
 * Andaime das demonstrações do andamento de trabalho longo.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — e os
 * moldes da conta junto com eles, porque a palavra que liga os dois números é
 * do idioma. Os NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: o
 * que muda por idioma é o separador de milhar, que a própria peça aplica, e não
 * a quantidade — números diferentes por foto fariam as cinco stories
 * fotografarem barras de comprimentos diferentes.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import jobTranslations from '@shared/content/job-progress/translations.json';
import { RUN_STATUSES, type JobCount, type RunStatus } from '@shared/primitives/chat-protocol';
import type { JobProgressLabels } from './job-progress';

const { t } = useTranslation(jobTranslations as Record<string, unknown>);

/** O que está sendo feito nas demonstrações. */
export function jobLabel(): string {
  return t('labels.job');
}

/**
 * A palavra de cada estado, os dois moldes da conta e o rótulo da ação onde ela
 * existe.
 *
 * O mapa de estados sai de `RUN_STATUSES`, e não de cinco linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function jobProgressLabels(): JobProgressLabels {
  const status = {} as Record<RunStatus, string>;
  for (const item of RUN_STATUSES) status[item] = t(`labels.status.${item}`);

  return {
    status,
    count: t('labels.count'),
    countWithoutTotal: t('labels.countWithoutTotal'),
    // Em espera e concluído ficam sem ação de propósito: disparar o trabalho é
    // de quem o enfileirou, e sobre um trabalho pronto não há o que fazer aqui.
    action: {
      running: t('labels.action.running'),
      stopped: t('labels.action.stopped'),
      failed: t('labels.action.failed'),
    },
  };
}

/**
 * A conta de exemplo, a mesma em toda foto.
 *
 * Uma só, com total conhecido, e é ela que as stories dos cinco estados
 * recebem de propósito: assim a diferença entre as fotos é o estado, e não o
 * número. O que a peça faz com a MESMA conta em cada estado é justamente o
 * assunto — concluído desenha cheio, parado congela, em andamento mostra a
 * fração.
 */
export const JOB_COUNT: JobCount = { done: 1240, total: 5000 };

/**
 * A conta sem total conhecido — o caso que a peça existe para não errar.
 *
 * Quem varre um repositório sabe quantos arquivos abriu, e não quantos vai
 * abrir. Mesmo número já feito da conta acima, para que a única diferença entre
 * as duas fotos seja a ausência do denominador.
 */
export const JOB_COUNT_WITHOUT_TOTAL: JobCount = { done: 1240 };
