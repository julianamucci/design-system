/**
 * Andaime das demonstrações do custo de uma execução.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * GASTOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto. Mesmo arranjo da peça da janela de contexto.
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
 * DOIS acessos ao mesmo dicionário, como em `context-display.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import costTranslations from "@shared/content/cost-meter/translations.json"
import { BUDGET_LEVELS, spentFraction, type BudgetLevel } from "@shared/primitives/token-budget"
import type { CostBudget, CostMeterLabels } from "./cost-meter"

type CostContent = {
  labels: {
    title: string
    level: Record<string, string>
    of: string
    unbounded: string
  }
}

const CONTENT = costTranslations as unknown as Record<string, CostContent>

/**
 * A moeda dos exemplos.
 *
 * Dólar porque é a moeda em que preço de modelo é cotado, e porque ela deixa a
 * demonstração honesta: quem consome o design system em outra moeda escreve
 * outra, e a peça não muda de linha por causa disso.
 */
const EXAMPLE_CURRENCY = "USD"

/** O formatador daquele idioma — o que é de QUEM CONSOME, e nunca da peça. */
function money(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: EXAMPLE_CURRENCY,
  })
}

/**
 * A quantia escrita, no idioma corrente.
 *
 * Lê a loja A CADA CHAMADA, e não uma vez no topo do módulo: a docs page se
 * redesenha quando o idioma muda, e um formatador guardado no topo continuaria
 * escrevendo no idioma em que a página abriu. Serve às duas pontas — quem a
 * chama dentro de um componente já subscreveu o idioma por `useCostMeterLabels`,
 * e quem a chama na `play` quer justamente a leitura de agora.
 */
export function costAmount(value: number): string {
  return money(useI18nStore.getState().locale).format(value)
}

/**
 * O nome da medida, a palavra de cada nível, a ligação e o que dizer sem teto.
 *
 * O mapa de níveis sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão:
 * nível novo no primitivo compartilhado entra aqui sozinho, e a story que
 * percorre os níveis passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 *
 * Não há unidade aqui, ao contrário dos rótulos das duas peças irmãs: a moeda
 * já vem dentro da quantia escrita.
 */
function read(locale: Locale): CostMeterLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const level = {} as Record<BudgetLevel, string>
  for (const item of BUDGET_LEVELS) level[item] = raw.level[item] ?? ""

  return {
    title: raw.title,
    level,
    of: raw.of,
    unbounded: raw.unbounded,
  }
}

/** Os rótulos da linha, no idioma corrente. Para dentro de um componente. */
export function useCostMeterLabels(): CostMeterLabels {
  const { locale } = useTranslation(costTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function costMeterLabels(): CostMeterLabels {
  return read(useI18nStore.getState().locale)
}

/** Os casos que a peça desenha diferente. */
export type CostMeterCase =
  | "normal"
  | "threshold"
  | "warning"
  | "critical"
  | "over"
  | "unbounded"

/** Um gasto e o teto contra o qual ele se mede, quando há teto. */
export interface CostExample {
  spent: number
  budget?: number
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
}

/** O gasto daquele caso, já escrito. */
export function amountOf(name: CostMeterCase): string {
  return costAmount(COST_METER_SPEND[name].spent)
}

/**
 * O teto daquele caso — a quantia escrita e a fração já gasta —, ou nada.
 *
 * A FRAÇÃO SAI DO PRIMITIVO, e não de uma divisão daqui: é `spentFraction` que
 * guarda o recorte em uma volta e a resposta de que teto ausente é `null`. É
 * esse `null` que vira "sem teto declarado" na tela, e é por ele que o caso sem
 * orçamento se produz sem nenhum sinalizador à parte.
 */
export function budgetOf(name: CostMeterCase): CostBudget | undefined {
  const { spent, budget } = COST_METER_SPEND[name]
  const fraction = spentFraction(spent, budget)
  // É o `null` que decide, e não um sinalizador à parte: teto ausente, zero ou
  // não-finito já saem daqui como ausência de fração. O `budget` reaparece na
  // condição só para o compilador — sem ele a fração já teria saído `null`.
  if (fraction === null || budget === undefined) return undefined
  return { amount: costAmount(budget), fraction }
}
