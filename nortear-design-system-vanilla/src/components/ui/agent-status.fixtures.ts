/**
 * Andaime das demonstrações do estado da execução.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * RELÓGIO é dado de exemplo e fica igual nos três idiomas: ele já chega escrito
 * ao componente, e traduzi-lo aqui faria as cinco stories fotografarem linhas
 * de larguras diferentes conforme o idioma da foto.
 */

import { createTranslation } from '@/lib/i18n';
import statusTranslations from '@shared/content/agent-status/translations.json';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import type { AgentStatusLabels } from './agent-status';

const { t } = createTranslation(statusTranslations as Record<string, unknown>);

/**
 * A palavra de cada estado, e o rótulo da ação onde ela existe.
 *
 * O mapa de estados sai de `RUN_STATUSES`, e não de cinco linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function agentStatusLabels(): AgentStatusLabels {
  const status = {} as Record<RunStatus, string>;
  for (const item of RUN_STATUSES) status[item] = t(`labels.status.${item}`);

  return {
    status,
    // Em espera e concluída ficam sem ação de propósito: começar uma execução é
    // do campo de mensagem, e sobre uma resposta pronta não há o que fazer aqui.
    action: {
      running: t('labels.action.running'),
      stopped: t('labels.action.stopped'),
      failed: t('labels.action.failed'),
    },
  };
}

/**
 * O relógio de exemplo em cada estado.
 *
 * `idle` não tem relógio, e é a única razão de este mapa ser parcial: nada
 * começou, então não há o que contar. Nos outros quatro o número é o mesmo em
 * toda foto, para que a diferença entre elas seja o estado e não a largura.
 */
const ELAPSED: Partial<Record<RunStatus, string>> = {
  running: '1:04',
  stopped: '0:42',
  complete: '2:11',
  failed: '0:08',
};

/** Quanto tempo mostrar naquele estado, ou nada quando não há o que contar. */
export function elapsedOf(status: RunStatus): string | undefined {
  return ELAPSED[status];
}
