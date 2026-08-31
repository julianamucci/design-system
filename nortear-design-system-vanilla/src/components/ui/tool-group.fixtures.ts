/**
 * Andaime das demonstrações do grupo de ferramentas.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. As
 * CHAMADAS saem de `@shared/primitives/tool-group-examples`, porque são fala —
 * e fala é a mesma nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse as próprias chamadas, as cinco stories deixariam de fotografar a
 * mesma tela e a divergência só apareceria no Chromatic, como diferença de
 * largura que ninguém consegue atribuir a nada.
 */

import { createTranslation } from '@/lib/i18n';
import groupTranslations from '@shared/content/tool-group/translations.json';
import { TOOL_CALL_STATES, type ToolCallState } from '@shared/primitives/chat-protocol';
import type { ToolGroupLabels } from './tool-group';

const { t } = createTranslation(groupTranslations as Record<string, unknown>);

/**
 * O título do resumo, a palavra do conjunto e a palavra de cada chamada.
 *
 * Os dois mapas de estado saem de `TOOL_CALL_STATES`, e não de quatro linhas
 * escritas à mão: estado novo no vocabulário compartilhado entra aqui sozinho,
 * e a story que percorre os estados passa a cobri-lo sem que ninguém lembre de
 * mexer no andaime.
 */
export function toolGroupLabels(): ToolGroupLabels {
  const summary = {} as Record<ToolCallState, string>;
  const call = {} as Record<ToolCallState, string>;
  for (const state of TOOL_CALL_STATES) {
    summary[state] = t(`labels.summary.${state}`);
    call[state] = t(`labels.call.${state}`);
  }

  return {
    // O plural mora na `translations.json` e o número entra por substituição:
    // "1 ferramenta" e "{n} ferramentas" são duas frases diferentes em cada
    // idioma, e escolher entre elas aqui é o que impede o componente de
    // escolher por cinco idiomas de uma vez.
    title: (count: number) =>
      count === 1 ? t('labels.title.one') : t('labels.title.other').replace('{n}', String(count)),
    summary,
    call,
  };
}
