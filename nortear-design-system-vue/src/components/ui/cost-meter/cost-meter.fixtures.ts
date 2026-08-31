/**
 * Andaime das demonstrações do custo de uma execução.
 *
 * Existe pelo mesmo motivo do andaime da medição da janela: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * GASTOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O DINHEIRO. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem consome a peça, e é quem consome que conhece a moeda e o idioma. Um
 * `Intl.NumberFormat` mora nesta camada em qualquer produto de verdade; o que
 * não pode é morar dentro do componente, onde decidiria idioma e moeda em cinco
 * stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma quantia sai
 * `US$ 0,84`, `$0.84` ou `0,84 US$`, e o símbolo TROCA DE PONTA. Nenhuma
 * heurística de componente acerta as três.
 *
 * Os gastos são escolhidos para cair EXATAMENTE onde a conta decide algo, e não
 * em números redondos bonitos: um deles encosta no limiar de aviso em ponto,
 * outro passa do teto. Exemplo que evita a borda é exemplo que nunca mostra a
 * regra.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import { spentFraction } from '@shared/primitives/token-budget';
import costTranslations from '@shared/content/cost-meter/translations.json';
import type { CostBudget, CostMeterLabels } from './CostMeter.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `CostMeterLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela.
 *
 * É também o que faz o mapa de níveis acompanhar o primitivo compartilhado sem
 * que ninguém precise lembrar: `level` é `Record<BudgetLevel, string>`, e um
 * nível novo em `BUDGET_LEVELS` reprova a compilação aqui em vez de desenhar
 * uma etiqueta em branco que ninguém repara.
 */
const CONTENT: Record<Locale, { labels: CostMeterLabels }> = costTranslations;

/**
 * A moeda dos exemplos.
 *
 * Dólar porque é a moeda em que preço de modelo é cotado, e porque ela deixa a
 * demonstração honesta: quem consome o design system em outra moeda escreve
 * outra, e a peça não muda de linha por causa disso.
 */
const EXAMPLE_CURRENCY = 'USD';

/** A quantia escrita num idioma — a forma para quem já tem o locale em mãos. */
export function costAmountFor(target: Locale, value: number): string {
  return new Intl.NumberFormat(target, {
    style: 'currency',
    currency: EXAMPLE_CURRENCY,
  }).format(value);
}

/**
 * A quantia escrita fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que os composables abaixo, e monta o formatador A
 * CADA CHAMADA: a docs page se redesenha quando o idioma muda, e um formatador
 * guardado no topo do módulo continuaria escrevendo no idioma em que a página
 * abriu.
 */
export function costAmount(value: number): string {
  return costAmountFor(useI18nStore().locale, value);
}

/** Os rótulos da linha num idioma. */
export function costMeterLabelsFor(target: Locale): CostMeterLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da linha fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function costMeterLabels(): CostMeterLabels {
  return costMeterLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da linha no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useCostMeterLabels(): ComputedRef<CostMeterLabels> {
  const { locale } = useTranslation(costTranslations);
  return computed(() => costMeterLabelsFor(locale.value as Locale));
}

/** Os casos que a peça desenha diferente. */
export type CostMeterCase =
  | 'normal'
  | 'threshold'
  | 'warning'
  | 'critical'
  | 'over'
  | 'unbounded';

/** Um gasto e o teto contra o qual ele se mede, quando há teto. */
export interface CostExample {
  spent: number;
  budget?: number;
}

/**
 * Um gasto por caso, todos contra o mesmo teto de um dólar.
 *
 * O teto é o MESMO em cinco dos seis para que a diferença entre as fotos seja o
 * gasto, e não a escala. O sexto não tem teto — é o caso de que ele não foi
 * declarado, e é justamente o que não pode parecer "não gastou nada".
 *
 * `threshold` vale setenta e cinco centavos de um dólar, que são três quartos
 * EM PONTO: é a borda do limiar, e é o único gasto aqui cujo valor não pode
 * mudar sem mudar o que a story prova. `over` passa do teto de propósito, e é
 * ele que mostra o recorte em uma volta.
 */
export const COST_METER_SPEND: Record<CostMeterCase, CostExample> = {
  normal: { spent: 0.36, budget: 1 },
  threshold: { spent: 0.75, budget: 1 },
  warning: { spent: 0.84, budget: 1 },
  critical: { spent: 0.94, budget: 1 },
  over: { spent: 1.24, budget: 1 },
  unbounded: { spent: 0.84 },
};

/**
 * O que a peça recebe: a quantia escrita e, quando há teto, o par do teto.
 *
 * As duas metades saem juntas de um lugar só porque é assim que a peça as
 * recebe. Duas funções independentes deixariam existir a foto meio montada —
 * quantia de um caso ao lado do teto de outro — e nenhuma das duas reprovaria.
 */
export interface CostMeterView {
  amount: string;
  budget?: CostBudget;
}

/**
 * Um gasto já escrito, com o teto quando há teto — num idioma.
 *
 * A FRAÇÃO SAI DO PRIMITIVO, e não de uma divisão daqui: é `spentFraction` que
 * guarda o recorte em uma volta e a resposta de que teto ausente é `null`. É
 * esse `null` que vira "sem teto declarado" na tela, e é por ele que o caso sem
 * orçamento se produz sem nenhum sinalizador à parte.
 */
export function costViewFor(target: Locale, spend: CostExample): CostMeterView {
  const amount = costAmountFor(target, spend.spent);
  const fraction = spentFraction(spend.spent, spend.budget);
  // É o `null` que decide, e não um sinalizador à parte: teto ausente, zero ou
  // não-finito já saem daqui como ausência de fração. O `budget` reaparece na
  // condição só para o compilador — sem ele a fração já teria saído `null`.
  if (fraction === null || spend.budget === undefined) return { amount };
  return { amount, budget: { amount: costAmountFor(target, spend.budget), fraction } };
}

/** O mesmo, fora de um componente — `play` não é render. */
export function costView(spend: CostExample): CostMeterView {
  return costViewFor(useI18nStore().locale, spend);
}

/**
 * O gasto daquele caso, já escrito.
 *
 * Só a quantia sai por aqui, e não o teto: quem RENDERIZA lê o par inteiro de
 * `useCostViews`, porque as duas metades da mesma foto têm de sair juntas. Esta
 * é a forma da `play`, que precisa comparar a cadeia com o que está na tela.
 */
export function amountOf(name: CostMeterCase): string {
  return costView(COST_METER_SPEND[name]).amount;
}

/**
 * Um gasto qualquer no idioma corrente — a forma dos controls.
 *
 * Recebe um GETTER, e não um objeto: os args do Playground trocam com o painel
 * aberto, e um objeto lido uma vez congelaria a foto nos números com que a
 * story abriu.
 */
export function useCostView(spend: () => CostExample): ComputedRef<CostMeterView> {
  const { locale } = useTranslation(costTranslations);
  return computed(() => costViewFor(locale.value as Locale, spend()));
}

/** Os seis exemplos no idioma corrente, prontos para a peça. */
export function useCostViews(): ComputedRef<Record<CostMeterCase, CostMeterView>> {
  const { locale } = useTranslation(costTranslations);
  return computed(() => {
    const target = locale.value as Locale;
    const views = {} as Record<CostMeterCase, CostMeterView>;
    for (const name of Object.keys(COST_METER_SPEND) as CostMeterCase[]) {
      views[name] = costViewFor(target, COST_METER_SPEND[name]);
    }
    return views;
  });
}
