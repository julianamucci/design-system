/**
 * Andaime das demonstrações dos anexos — um construtor, cinco arquivos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES dos arquivos e os tamanhos são dado de exemplo e ficam iguais nos três
 * idiomas: nome de arquivo não se traduz, e traduzi-lo faria as cinco stories
 * fotografarem filas diferentes conforme o idioma da foto.
 *
 * DOIS acessos ao mesmo dicionário, como em `composer.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import attachmentTranslations from "@shared/content/composer-attachments/translations.json"
import type { Attachment } from "@shared/primitives/chat-protocol"
import type { ComposerAttachmentLabels } from "./composer-attachments"

type AttachmentContent = { labels: ComposerAttachmentLabels }

const CONTENT = attachmentTranslations as unknown as Record<string, AttachmentContent>

function read(locale: Locale): ComposerAttachmentLabels {
  return (CONTENT[locale] ?? CONTENT["pt-BR"]).labels
}

/** Os rótulos da fila, no idioma corrente. Para dentro de um componente. */
export function useAttachmentLabels(): ComposerAttachmentLabels {
  const { locale } = useTranslation(attachmentTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function attachmentLabels(): ComposerAttachmentLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * Tamanhos escolhidos para caírem em unidades diferentes.
 *
 * `2516582` dá 2,4 MB — número com casa decimal, que é onde o arredondamento
 * do primitivo aparece. `840` fica em bytes, e prova que o limiar não é frouxo.
 */
export const SIZE_MB = 2516582
export const SIZE_BYTES = 840

/** Um anexo por estado, na ordem em que o arquivo anda. */
export function queue(): Attachment[] {
  return [
    { id: "a1", name: "planta.pdf", size: SIZE_MB, state: "pending" },
    { id: "a2", name: "medidas.csv", size: SIZE_BYTES, state: "uploading", progress: 0.4 },
    { id: "a3", name: "fachada.png", size: SIZE_MB, state: "ready" },
    { id: "a4", name: "corte.dwg", size: SIZE_MB, state: "failed" },
  ]
}

/** Um anexo só, no estado pedido. */
export function one(
  state: Attachment["state"],
  extra: Partial<Attachment> = {},
): Attachment[] {
  return [{ id: "a1", name: "planta.pdf", size: SIZE_MB, state, ...extra }]
}
