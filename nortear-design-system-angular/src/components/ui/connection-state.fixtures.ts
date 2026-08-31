/**
 * Andaime das demonstrações do estado da ligação.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. A
 * CONTAGEM é dado de exemplo e fica igual nos três idiomas: ela já chega
 * escrita ao componente, e traduzi-la aqui faria as cinco stories fotografarem
 * linhas de larguras diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import connectionTranslations from '@shared/content/connection-state/translations.json';
import { CONNECTION_STATES, type ConnectionState } from '@shared/primitives/chat-protocol';
import type { ConnectionStateLabels } from './connection-state';

const { t } = useTranslation(connectionTranslations as Record<string, unknown>);

/**
 * A palavra de cada estado, e o rótulo da ação onde ela existe.
 *
 * O mapa de estados sai de `CONNECTION_STATES`, e não de três linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function connectionStateLabels(): ConnectionStateLabels {
  const state = {} as Record<ConnectionState, string>;
  for (const item of CONNECTION_STATES) state[item] = t(`labels.state.${item}`);

  return {
    state,
    // A ligação de pé fica sem ação de propósito: sobre uma ligação que está
    // funcionando não há o que fazer aqui.
    action: {
      reconnecting: t('labels.action.reconnecting'),
      disconnected: t('labels.action.disconnected'),
    },
  };
}

/**
 * A contagem de exemplo, a mesma em toda foto.
 *
 * Uma só, e não um mapa por estado: só `reconnecting` tem tentativa marcada, e
 * um mapa com uma entrada seria uma tabela fingindo escolha. As stories que
 * mostram os outros dois passam esta mesma string de propósito — é assim que
 * elas provam que a peça não a desenha quando nada está agendado.
 */
export const CONNECTION_COUNTDOWN = 'em 5 s';
