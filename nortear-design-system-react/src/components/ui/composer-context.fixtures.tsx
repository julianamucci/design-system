/**
 * Andaime das demonstrações do contexto — um construtor por caso.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das referências e os recortes são dado de exemplo e ficam iguais nos
 * três idiomas: nome de arquivo não se traduz, e traduzi-lo faria as cinco
 * stories fotografarem listas diferentes conforme o idioma da foto.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 *
 * Os rótulos do CAMPO não moram aqui: eles já vivem em `composer.fixtures.tsx`,
 * e uma segunda cópia divergiria da primeira sem nenhum sinal.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import contextTranslations from "@shared/content/composer-context/translations.json"
import { CONTEXT_KINDS, type ContextItem } from "@shared/primitives/chat-protocol"
import type { ComposerContextLabels } from "./composer-context"

type ContextContent = { labels: ComposerContextLabels }

const CONTENT = contextTranslations as unknown as Record<string, ContextContent>

function read(locale: Locale): ComposerContextLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos da lista, no idioma corrente. Para dentro de um componente. */
export function useContextLabels(): ComposerContextLabels {
  const { locale } = useTranslation(contextTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function contextLabels(): ComposerContextLabels {
  return read(useI18nStore.getState().locale)
}

/** O nome de exemplo de cada espécie. Dado, e por isso fora da tradução. */
const KIND_LABELS: Record<(typeof CONTEXT_KINDS)[number], string> = {
  selection: "relatorio.ts",
  file: "medidas.csv",
  directory: "src/fachada",
  page: "Painel de medidas",
  repository: "nortear/obra",
}

/**
 * Uma etiqueta por espécie, na ordem do vocabulário compartilhado.
 *
 * A lista sai de `CONTEXT_KINDS`, e não de um array escrito à mão: espécie nova
 * no protocolo entra aqui sozinha, e a story que conta as etiquetas passa a
 * cobri-la sem que ninguém lembre de mexer no andaime.
 */
export function everyKind(): ContextItem[] {
  return CONTEXT_KINDS.map((kind, i) => ({
    id: `c${i + 1}`,
    label: KIND_LABELS[kind],
    kind,
  }))
}

/** O trecho, que é a única espécie que sempre traz recorte. */
export function selection(): ContextItem[] {
  return [{ id: "c1", label: "relatorio.ts", kind: "selection", detail: "linhas 12–48" }]
}

/** Só o repositório — a espécie mais larga. */
export function repository(): ContextItem[] {
  return [{ id: "c5", label: "nortear/obra", kind: "repository" }]
}

/**
 * Um posto à mão e um que entrou sozinho, lado a lado.
 *
 * É o par que a peça existe para desenhar: um tem botão de remover, o outro tem
 * a marca escrita e nenhum botão.
 */
export function mixed(): ContextItem[] {
  return [
    { id: "c1", label: "relatorio.ts", kind: "selection", detail: "linhas 12–48" },
    { id: "c2", label: "Painel de medidas", kind: "page", automatic: true },
  ]
}

/** Só o que entrou sozinho. */
export function automatic(): ContextItem[] {
  return [{ id: "c2", label: "Painel de medidas", kind: "page", automatic: true }]
}
