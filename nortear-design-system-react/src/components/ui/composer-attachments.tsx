import type { CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { formatFileSize, type FileSizeUnit } from "@shared/primitives/file-size"
import type { Attachment, AttachmentState } from "@shared/primitives/chat-protocol"

/**
 * A fila de arquivos que vai junto com a mensagem.
 *
 * Desenho em `nds/composer.css`, no bloco de anexos, que também guarda as cinco
 * decisões de acessibilidade. O vocabulário — `Attachment`, `AttachmentState` —
 * vem de `@shared/primitives/chat-protocol`, e a conversão de bytes de
 * `@shared/primitives/file-size`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: a barra de progresso é DECORATIVA, e o estado é
 * TEXTO. A barra muda a cada instante, e é a mesma armadilha do contador de
 * caracteres e do relógio do media player — número que se reanuncia torna a
 * tela impossível de ouvir. Quem lê com leitor de tela recebe a palavra, que é
 * o que decide o que fazer: "Enviando" pede paciência, "Falhou" pede ação.
 *
 * O QUE O COMPONENTE NÃO FAZ: subir arquivo, decidir o que pode ser anexado,
 * ou remover coisa alguma. Ele desenha a fila que recebe e avisa que alguém
 * pediu para remover. Quem consome sobe, valida e decide — mesma divisão de
 * `approval` no `chat-thread`.
 *
 * A API NÃO DIVERGE do Vanilla: os três nomes são os mesmos, porque aqui não há
 * estado imperativo para traduzir. A fila é dado que entra e desenho que sai.
 */

export interface ComposerAttachmentLabels {
  /** Nome acessível da fila. */
  list: string
  /** Nome do botão de remover. `{name}` vira o nome do arquivo. */
  remove: string
  /** A palavra de cada estado. É ela que o leitor de tela recebe. */
  state: Record<AttachmentState, string>
  /** A palavra de cada unidade de tamanho. */
  unit: Record<FileSizeUnit, string>
}

export interface ComposerAttachmentsProps {
  attachments: Attachment[]
  labels: ComposerAttachmentLabels
  /** Alguém pediu para remover. Remover de verdade é de quem consome. */
  onRemove?: (attachment: Attachment) => void
}

/**
 * O tamanho já escrito: número no idioma da página, unidade em palavra.
 *
 * A conta vem do primitivo; o texto, dos rótulos. Sem tamanho não há frase —
 * quem produz o dado nem sempre sabe quanto o arquivo tem, e "0 B" seria uma
 * informação inventada.
 */
function sizeText(
  attachment: Attachment,
  labels: ComposerAttachmentLabels,
): string | null {
  if (attachment.size === undefined) return null
  const { value, unit } = formatFileSize(attachment.size)
  return `${value.toLocaleString()} ${labels.unit[unit]}`
}

/**
 * A fração virada porcentagem, LIMITADA à faixa.
 *
 * Progresso é dado de fora, e dado de fora chega errado: uma barra alimentada
 * com 2.5 vazaria o trilho, e uma com -1 desenharia para trás.
 */
function progressWidth(progress: number | undefined): string {
  return `${Math.round(Math.min(Math.max(progress ?? 0, 0), 1) * 100)}%`
}

function ComposerAttachments({
  attachments,
  labels,
  onRemove,
}: ComposerAttachmentsProps) {
  return (
    // `<ul>`: é o que faz o leitor de tela anunciar quantos anexos há antes de
    // percorrê-los. Uma pilha de `div` não anuncia nada.
    <ul
      data-slot="composer-attachments"
      className="nds-composer-attachments"
      aria-label={labels.list}
    >
      {attachments.map((attachment, index) => {
        const uploading = attachment.state === "uploading"
        const size = sizeText(attachment, labels)

        return (
          <li
            key={attachment.id ?? `${attachment.name}-${index}`}
            className="nds-composer-attachment"
            data-slot="composer-attachment"
            data-state={attachment.state}
            data-attachment-id={attachment.id}
            // Ocupado enquanto sobe, e NÃO região viva: o progresso não se
            // anuncia.
            aria-busy={uploading ? true : undefined}
          >
            <span className="nds-composer-attachment-name">{attachment.name}</span>

            {/* O texto de apoio junta tamanho e ESTADO. É por ele que quem
                ouve sabe o que está acontecendo — a barra não fala. */}
            <span className="nds-composer-attachment-meta">
              {[size, labels.state[attachment.state]].filter(Boolean).join(" · ")}
            </span>

            {uploading ? (
              // Decorativa: o estado já está escrito no texto de apoio, e uma
              // barra que se anuncia a cada quadro é o defeito que esta peça
              // existe para evitar.
              <span className="nds-composer-attachment-bar" aria-hidden="true">
                <span
                  className="nds-composer-attachment-bar-fill"
                  // Custom property, e não largura em `style`: o valor é dado
                  // de runtime, e a folha é quem decide como ele vira desenho.
                  style={
                    {
                      "--nds-attachment-progress": progressWidth(attachment.progress),
                    } as CSSProperties
                  }
                />
              </span>
            ) : null}

            {/* O nome acessível leva o NOME DO ARQUIVO: uma fila de três
                botões chamados "Remover" é indistinguível por audição. */}
            <Button
              data-slot="composer-attachment-remove"
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.remove.replace("{name}", attachment.name)}
              onClick={() => onRemove?.(attachment)}
            >
              ×
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export { ComposerAttachments }
