/**
 * Andaime das demonstrações do uso do contexto.
 *
 * Existe pelo mesmo motivo do andaime do estado da execução: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
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
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import contextTranslations from '@shared/content/context-display/translations.json';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import type { ContextDisplayLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ContextDisplayLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um nível
 * sem palavra deixaria a linha distinguindo a janela só pela cor do medidor.
 */
const CONTENT: Record<Locale, { labels: ContextDisplayLabels }> = contextTranslations;

/** Os rótulos da medição num idioma — a forma para quem já tem o locale em mãos. */
export function contextDisplayLabelsFor(target: Locale): ContextDisplayLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos fora de um componente — `props` de story e `play` não são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a medição desenha.
 */
export function contextDisplayLabels(): ContextDisplayLabels {
  return contextDisplayLabelsFor(get(locale));
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
