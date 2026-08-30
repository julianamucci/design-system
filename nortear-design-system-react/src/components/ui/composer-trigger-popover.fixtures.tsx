/**
 * Andaime das demonstrações do seletor do gatilho — um construtor, cinco
 * arquivos.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.tsx`: num `*.stories.tsx` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída fácil
 * — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das pessoas e dos comandos são dado de exemplo e ficam iguais nos três
 * idiomas: um nome próprio não se traduz, e traduzir o rótulo de um comando
 * faria as stories fotografarem listas diferentes conforme o idioma em que a
 * foto foi tirada.
 *
 * DOIS acessos ao mesmo dicionário, e a duplicação é o assunto do módulo. O
 * hook subscreve a loja e faz a demonstração se redesenhar quando o idioma
 * muda; a função pura lê o idioma corrente uma vez e serve à `play`, onde não
 * há componente para pendurar um hook. É também o que torna a asserção imune à
 * troca de idioma: a play compara com o rótulo que a tela está mostrando, e não
 * com uma palavra escrita à mão dentro de uma expressão regular.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import { Composer } from "./composer"
import { useComposerLabels } from "./composer.fixtures"
import triggerTranslations from "@shared/content/composer-trigger-popover/translations.json"
import { COMMAND_TRIGGER, MENTION_TRIGGER } from "@shared/primitives/composer-trigger"
import type {
  TriggerOption,
  TriggerPopoverLabels,
  TriggerSource,
} from "./composer-trigger-popover"

type TriggerContent = {
  labels: TriggerPopoverLabels & { team: string }
}

const CONTENT = triggerTranslations as unknown as Record<string, TriggerContent>

function read(locale: Locale): TriggerContent["labels"] {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos do painel, no idioma corrente. Para dentro de um componente. */
export function useTriggerLabels(): TriggerPopoverLabels {
  const { locale } = useTranslation(triggerTranslations)
  return useMemo(() => {
    const source = read(locale)
    return { empty: source.empty, list: source.list }
  }, [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function triggerLabels(): TriggerPopoverLabels {
  const source = read(useI18nStore.getState().locale)
  return { empty: source.empty, list: source.list }
}

/**
 * As pessoas do exemplo.
 *
 * `Ana` e `Joana` existem para provar a ordenação: quem digita `an` quer Ana, e
 * Joana casa por conter. `Ângela` existe para provar o acento — quem digita
 * `an` sem acento tem de achá-la.
 */
export function people(): TriggerOption[] {
  const team = read(useI18nStore.getState().locale).team
  return [
    { id: "joana", label: "Joana Lima", hint: team },
    { id: "ana", label: "Ana Souza", hint: team },
    { id: "angela", label: "Ângela Reis", hint: team },
    { id: "bruno", label: "Bruno Dias", hint: team },
  ]
}

/**
 * Os comandos do exemplo.
 *
 * O primeiro tem `value` diferente do `label`, que é o caso que o campo `value`
 * existe para cobrir: mostra "Resumir a conversa" e escreve a barra seguida do
 * verbo.
 */
export function commands(): TriggerOption[] {
  return [
    { id: "resumir", label: "Resumir a conversa", value: "/resumir", hint: "/resumir" },
    { id: "traduzir", label: "Traduzir", value: "/traduzir", hint: "/traduzir" },
  ]
}

/** Menção em começo de palavra. */
export function mentionSource(): TriggerSource {
  return { spec: MENTION_TRIGGER, options: people() }
}

/** Comando só no começo do campo. */
export function commandSource(): TriggerSource {
  return { spec: COMMAND_TRIGGER, options: commands() }
}

export interface TriggerComposerExampleProps {
  /** Troca o gatilho de menção pelo de comando. */
  command?: boolean
  /** O espião da story. Fica de fora daqui: cada arquivo tem o seu. */
  onSubmit?: (value: string) => void
}

/**
 * Um composer com um gatilho — o andaime de três arquivos de story.
 *
 * Os rótulos vêm de hook, então montar o campo exige um componente; deixá-lo em
 * cada arquivo produzia três cópias que divergem sem sinal. O espião entra por
 * propriedade porque ele é da story, e não do andaime: quem afirma sobre envio
 * precisa do seu próprio.
 */
export function TriggerComposerExample({
  command = false,
  onSubmit,
}: TriggerComposerExampleProps) {
  return (
    <Composer
      labels={useComposerLabels()}
      triggerLabels={useTriggerLabels()}
      triggers={[command ? commandSource() : mentionSource()]}
      onSubmit={onSubmit}
      className="nds-max-w-lg"
    />
  )
}
