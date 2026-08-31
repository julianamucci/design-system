/**
 * Andaime das demonstrações da faixa de cota.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * USOS são dado de exemplo e ficam iguais nos três idiomas: são números, e
 * traduzi-los faria as stories fotografarem frações diferentes conforme o
 * idioma da foto. Mesmo arranjo das três peças de medição irmãs.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER O HORIZONTE, e MONTAR O
 * CONTROLE. Os dois são de propósito, e são a demonstração do contrato — aqui o
 * andaime está no papel de quem consome, e é quem consome que conhece o idioma
 * e sabe o que o botão faz. Um formatador de duração mora nesta camada em
 * qualquer produto de verdade; o que não pode é morar dentro do componente,
 * onde decidiria idioma em cinco stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma duração sai
 * `3 h 12 min` ou `3 hr 12 min`, e a abreviatura da hora troca com quem lê.
 * Nenhuma heurística de componente acerta as três.
 *
 * Os usos são escolhidos para cair EXATAMENTE onde a conta decide algo, e não
 * em números redondos bonitos: um deles encosta no limiar de aviso em ponto,
 * outro passa do teto. Exemplo que evita a borda é exemplo que nunca mostra a
 * regra.
 *
 * DOIS acessos ao mesmo dicionário, como em `cost-meter.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import quotaTranslations from "@shared/content/quota-banner/translations.json"
import { BUDGET_LEVELS, type BudgetLevel } from "@shared/primitives/token-budget"
import type { QuotaAllowance, QuotaBannerLabels } from "./quota-banner"

type QuotaContent = {
  labels: {
    action: string
    title: string
    unit: string
    left: string
    exhausted: string
    renews: string
    of: string
    level: Record<string, string>
  }
}

const CONTENT = quotaTranslations as unknown as Record<string, QuotaContent>

/**
 * A duração escrita, no idioma corrente.
 *
 * Lê a loja A CADA CHAMADA, e não uma vez no topo do módulo: a docs page se
 * redesenha quando o idioma muda, e um formatador guardado no topo continuaria
 * escrevendo no idioma em que a página abriu. Mesma mecânica da quantia escrita
 * da peça do custo.
 *
 * As duas unidades saem sempre, mesmo quando a hora é zero: um ramo a menos
 * aqui seria um caminho que nenhuma story exercita, e o que se demonstra é o
 * FORMATO — que a abreviatura da hora e a do minuto vêm de quem lê.
 */
export function renewalIn(minutes: number): string {
  const locale = useI18nStore.getState().locale
  const unit = (value: number, name: "hour" | "minute") =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit: name,
      unitDisplay: "short",
    }).format(value)

  return `${unit(Math.floor(minutes / 60), "hour")} ${unit(minutes % 60, "minute")}`
}

/**
 * O nome da cota, o que é contado, e as palavras que acompanham cada parte.
 *
 * O mapa de níveis sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão:
 * nível novo no primitivo compartilhado entra aqui sozinho, e a story que
 * percorre os níveis passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
function read(locale: Locale): QuotaBannerLabels {
  const raw = (CONTENT[locale] ?? CONTENT["pt-BR"]).labels

  const level = {} as Record<BudgetLevel, string>
  for (const item of BUDGET_LEVELS) level[item] = raw.level[item] ?? ""

  return {
    title: raw.title,
    unit: raw.unit,
    left: raw.left,
    exhausted: raw.exhausted,
    renews: raw.renews,
    of: raw.of,
    level,
  }
}

/** Os rótulos da faixa, no idioma corrente. Para dentro de um componente. */
export function useQuotaBannerLabels(): QuotaBannerLabels {
  const { locale } = useTranslation(quotaTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function quotaBannerLabels(): QuotaBannerLabels {
  return read(useI18nStore.getState().locale)
}

/** Os casos que a peça desenha diferente. */
export type QuotaBannerCase =
  | "normal"
  | "threshold"
  | "warning"
  | "critical"
  | "exhausted"
  | "noRenewal"

/** Uma cota e, quando ela renova, quanto falta para isso. */
export interface QuotaExample {
  quota: QuotaAllowance
  /** Minutos até renovar. Ausente é a cota que não renova. */
  renewalMinutes?: number
}

/**
 * Um uso por caso, todos contra o mesmo teto de duzentas mensagens.
 *
 * O teto é o MESMO nos seis para que a diferença entre as fotos seja o uso, e
 * não a escala. Duzentos, e não cinquenta, porque três quartos de duzentos é um
 * número inteiro de mensagens: com um teto que não divide por quatro, a borda
 * do limiar cairia numa fração de mensagem e o exemplo deixaria de ser um
 * exemplo.
 *
 * `threshold` vale cento e cinquenta de duzentas, que são três quartos EM
 * PONTO: é a borda do limiar, e é o único uso aqui cujo valor não pode mudar
 * sem mudar o que a story prova. `exhausted` passa do teto de propósito — é ele
 * que mostra o piso do resto em zero E o recorte da razão em uma volta, que são
 * duas travas diferentes na mesma foto.
 *
 * `noRenewal` repete os números de `warning` de propósito: assim a única
 * diferença entre as duas fotos é a linha do horizonte, e é isso que a story
 * existe para mostrar.
 */
export const QUOTA_BANNER_USE: Record<QuotaBannerCase, QuotaExample> = {
  normal: { quota: { used: 72, limit: 200 }, renewalMinutes: 192 },
  threshold: { quota: { used: 150, limit: 200 }, renewalMinutes: 192 },
  warning: { quota: { used: 168, limit: 200 }, renewalMinutes: 192 },
  critical: { quota: { used: 188, limit: 200 }, renewalMinutes: 192 },
  exhausted: { quota: { used: 214, limit: 200 }, renewalMinutes: 192 },
  noRenewal: { quota: { used: 168, limit: 200 } },
}

/** A cota daquele caso. */
export function quotaOf(name: QuotaBannerCase): QuotaAllowance {
  return QUOTA_BANNER_USE[name].quota
}

/**
 * O horizonte daquele caso, já escrito — ou nada, quando a cota não renova.
 *
 * É a AUSÊNCIA que decide, e não um sinalizador à parte: a cota sem renovação
 * simplesmente não traz os minutos, e o `undefined` atravessa até a peça, onde
 * vira a linha que não é montada.
 */
export function renewalOf(name: QuotaBannerCase): string | undefined {
  const { renewalMinutes } = QUOTA_BANNER_USE[name]
  if (renewalMinutes === undefined) return undefined
  return renewalIn(renewalMinutes)
}

/**
 * O controle da faixa, montado por QUEM CONSOME.
 *
 * Ele nasce aqui e não dentro da peça porque a §7 da guideline 17 deixa o
 * desenho do controle, a ênfase dele e o significado da escolha do lado de fora
 * do design system. A faixa desenha o LUGAR de quem responde; o que o botão faz
 * é de quem o passou — e é por isso que ele não tem `onClick` nenhum aqui:
 * demonstrar a política seria demonstrar o que a peça não tem.
 */
export function quotaBannerAction(): ReactNode {
  const raw = (CONTENT[useI18nStore.getState().locale] ?? CONTENT["pt-BR"]).labels
  return (
    <Button key="action" type="button" variant="outline" size="sm">
      {raw.action}
    </Button>
  )
}
