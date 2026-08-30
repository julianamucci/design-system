/**
 * Andaime das demonstrações do seletor de modelo — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES dos modelos, as descrições e o motivo de indisponibilidade são DADO de
 * exemplo e ficam iguais nos três idiomas — mesma decisão do
 * `chat-examples.ts`: o que se traduz são os rótulos da interface, não a fala.
 * Traduzi-los faria as cinco stories fotografarem listas diferentes conforme o
 * idioma da foto.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer-context.fixtures.tsx`, e
 * a duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import pickerTranslations from "@shared/content/composer-model-picker/translations.json"
import type { ModelOption } from "@shared/primitives/chat-protocol"
import type { ComposerModelPickerLabels } from "./composer-model-picker"

type PickerContent = { labels: ComposerModelPickerLabels }

const CONTENT = pickerTranslations as unknown as Record<string, PickerContent>

function read(locale: Locale): ComposerModelPickerLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos do seletor, no idioma corrente. Para dentro de um componente. */
export function useModelLabels(): ComposerModelPickerLabels {
  const { locale } = useTranslation(pickerTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function modelLabels(): ComposerModelPickerLabels {
  return read(useI18nStore.getState().locale)
}

/** O modelo mais rápido, sem etiqueta e sem impedimento. */
function fast(): ModelOption {
  return {
    id: "fast",
    label: "Rápido",
    description: "Responde em segundos. Serve para rascunho e pergunta curta.",
  }
}

/** O do meio, e o único que carrega etiqueta. */
function balanced(): ModelOption {
  return {
    id: "balanced",
    label: "Equilibrado",
    description: "O meio-termo entre esperar e acertar.",
    badge: "Novo",
  }
}

/** O mais lento — e o que não pode responder agora. */
function deep(): ModelOption {
  return {
    id: "deep",
    label: "Profundo",
    description: "Lê a obra inteira antes de responder, e leva minutos.",
    unavailable: true,
    unavailableReason: "Fora do seu plano.",
  }
}

/**
 * Dois modelos que podem responder, os dois com descrição e nenhum com
 * etiqueta.
 *
 * É a lista mínima em que a descrição é o único assunto — sem etiqueta e sem
 * impedimento, o que sobra na tela é o que sustenta a troca.
 */
export function availableModels(): ModelOption[] {
  return [
    fast(),
    {
      id: "balanced",
      label: "Equilibrado",
      description: "O meio-termo entre esperar e acertar.",
    },
  ]
}

/** Dois modelos, um deles com a etiqueta curta ao lado do nome. */
export function badgedModels(): ModelOption[] {
  return [fast(), balanced()]
}

/**
 * Os três: o rápido, o etiquetado e o que não pode responder agora.
 *
 * É a lista que a peça existe para desenhar — os três casos de opção convivem
 * numa lista só, que é como ela chega a quem escolhe.
 */
export function everyModel(): ModelOption[] {
  return [fast(), balanced(), deep()]
}
