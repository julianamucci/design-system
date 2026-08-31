/**
 * Andaime das demonstrações do uso do contexto.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. As
 * MEDIÇÕES são dado de exemplo e ficam iguais nos três idiomas: elas são
 * números, e traduzi-las faria as cinco stories fotografarem frações diferentes
 * conforme o idioma da foto.
 *
 * As medições são escolhidas para cair EXATAMENTE onde a conta decide algo, e
 * não em números redondos bonitos: uma delas encosta no limiar de aviso em
 * ponto, outra passa do teto. Exemplo que evita a borda é exemplo que nunca
 * mostra a regra.
 */

import { createTranslation } from '@/lib/i18n';
import contextTranslations from '@shared/content/context-display/translations.json';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import { BUDGET_LEVELS, type BudgetLevel } from '@shared/primitives/token-budget';
import type { ContextDisplayLabels } from './context-display';

const { t } = createTranslation(contextTranslations as Record<string, unknown>);

/**
 * O nome da medida, a palavra de cada nível, a unidade e o que dizer sem teto.
 *
 * O mapa de níveis sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão:
 * nível novo no primitivo compartilhado entra aqui sozinho, e a story que
 * percorre os níveis passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function contextDisplayLabels(): ContextDisplayLabels {
  const level = {} as Record<BudgetLevel, string>;
  for (const item of BUDGET_LEVELS) level[item] = t(`labels.level.${item}`);

  return {
    title: t('labels.title'),
    level,
    of: t('labels.of'),
    unit: t('labels.unit'),
    unbounded: t('labels.unbounded'),
  };
}

/** Os casos que a peça desenha diferente. */
export type ContextDisplayCase =
  | 'normal'
  | 'threshold'
  | 'warning'
  | 'critical'
  | 'over'
  | 'unbounded';

/**
 * Uma medição por caso, todas com a mesma janela de trinta e dois mil.
 *
 * O teto é o MESMO em cinco dos seis para que a diferença entre as fotos seja o
 * consumo, e não a escala. O sexto não tem teto — é o caso de que ele não se
 * sabe, e é justamente o que não pode parecer zero por cento.
 *
 * `threshold` vale vinte e quatro mil sobre trinta e dois mil, que são três
 * quartos EM PONTO: é a borda do limiar, e é a única medição aqui cujo valor
 * não pode mudar sem mudar o que a story prova.
 */
export const CONTEXT_DISPLAY_USAGE: Record<ContextDisplayCase, TokenUsage> = {
  normal: { input: 12_000, output: 4_000, limit: 32_000 },
  threshold: { input: 20_000, output: 4_000, limit: 32_000 },
  warning: { input: 18_000, output: 7_000, limit: 32_000 },
  critical: { input: 22_000, output: 8_000, limit: 32_000 },
  over: { input: 26_000, output: 8_000, limit: 32_000 },
  unbounded: { input: 18_000, output: 7_000 },
};

/** A medição daquele caso. */
export function usageOf(name: ContextDisplayCase): TokenUsage {
  return CONTEXT_DISPLAY_USAGE[name];
}
