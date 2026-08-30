/**
 * Andaime das demonstrações do Composer — um construtor, cinco arquivos.
 *
 * Existe pelo mesmo motivo do `chat-thread.fixtures.tsx`: num `*.stories.tsx`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, e não de literais: são texto de
 * interface, e texto de interface tem três idiomas.
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
import composerTranslations from "@shared/content/composer/translations.json"
import type { ComposerLabels } from "./composer"

type ComposerContent = {
  labels: ComposerLabels & { attach: string }
}

const CONTENT = composerTranslations as unknown as Record<string, ComposerContent>

function read(locale: Locale): ComposerContent["labels"] {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos da interface, no idioma corrente. Para dentro de um componente. */
export function useComposerLabels(): ComposerLabels {
  const { locale } = useTranslation(composerTranslations)
  return useMemo(() => {
    const source = read(locale)
    return {
      input: source.input,
      placeholder: source.placeholder,
      submit: source.submit,
      stop: source.stop,
      hint: source.hint,
      limit: source.limit,
    }
  }, [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function composerLabels(): ComposerLabels {
  const source = read(useI18nStore.getState().locale)
  return {
    input: source.input,
    placeholder: source.placeholder,
    submit: source.submit,
    stop: source.stop,
    hint: source.hint,
    limit: source.limit,
  }
}

/** O rótulo do controle de exemplo do trilho. */
export function attachLabel(): string {
  return read(useI18nStore.getState().locale).attach
}

/**
 * Um texto de exemplo com tamanho previsível.
 *
 * As stories que medem o contador precisam de um comprimento que elas próprias
 * controlem — usar uma frase escrita à mão faria a asserção depender de contar
 * caracteres a olho, e de recontar a cada tradução.
 */
export function textOfLength(n: number): string {
  return "a".repeat(n)
}
