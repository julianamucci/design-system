import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"
import { Composer } from "./composer"
import { useComposerLabels } from "./composer.fixtures"
import {
  attachmentLabels,
  queue,
  SIZE_BYTES,
  SIZE_MB,
  useAttachmentLabels,
} from "./composer-attachments.fixtures"
import { composerAttachmentsSource } from "./composer-attachments.source"
import { ComposerAttachmentsDocs } from "@/components/docs/ComposerAttachmentsDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveAttachment = fn()

/** Os rótulos vêm de hook, então o render passa por um componente. */
function QueueExample() {
  return (
    <Composer
      labels={useComposerLabels()}
      attachmentLabels={useAttachmentLabels()}
      attachments={queue()}
      onRemoveAttachment={onRemoveAttachment}
      className="nds-max-w-lg"
    />
  )
}

const meta: Meta = {
  title: "Components/Conversational/ComposerAttachments",
  tags: ["autodocs", "conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ComposerAttachmentsDocs),
      // O gerador imprimiria a árvore do render da story, com o andaime que só
      // existe no arquivo. A transform devolve o uso real.
      source: { transform: composerAttachmentsSource },
    },
  },
}

export default meta
type Story = StoryObj

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item4",
      "accessibility.item1", "accessibility.item4",
      "visual.item1",
    ],
  },
  render: () => <QueueExample />,
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!
    const list = root.querySelector<HTMLElement>('[data-slot="composer-attachments"]')!
    const labels = attachmentLabels()

    await step("A fila é uma LISTA, com um item por anexo", async () => {
      // É o que faz o leitor de tela anunciar quantos anexos há antes de
      // percorrê-los. Uma pilha de `div` não anuncia nada.
      await expect(list.tagName).toBe("UL")
      await expect(list).toHaveAccessibleName(labels.list)
      await expect(list.children).toHaveLength(4)
    })

    await step("O tamanho aparece convertido, com a unidade em palavra", async () => {
      // A conta vem do primitivo compartilhado; a palavra, dos rótulos. O
      // arquivo de 2.516.582 bytes se lê em megabytes com uma casa.
      //
      // Três afirmações, e nenhuma delas passa pela mesma conversão que o
      // componente usa — asserção circular provaria a fiação e não o valor:
      //
      //   o número, com o separador do IDIOMA aceito nos dois formatos, porque
      //   cravar a vírgula mediria a configuração da máquina;
      //   a unidade, traduzida;
      //   e a ausência do número de bytes, que é o que prova a conversão.
      const first = list.children[0]!
      await expect(first).toHaveTextContent(/2[.,]4/)
      await expect(first).toHaveTextContent(labels.unit.mb)
      await expect(first).not.toHaveTextContent(String(SIZE_MB))
    })

    await step("E o que é pequeno fica em bytes — o limiar não é frouxo", async () => {
      const uploading = list.children[1]!
      await expect(uploading).toHaveTextContent(`${SIZE_BYTES} ${labels.unit.byte}`)
    })

    await step("Cada item diz o ESTADO por escrito", async () => {
      // É a palavra que decide o que fazer: uma pede paciência, a outra pede
      // ação. A barra não fala.
      const words = [...list.children].map((li) => li.textContent ?? "")
      await expect(words[0]).toContain(labels.state.pending)
      await expect(words[1]).toContain(labels.state.uploading)
      await expect(words[2]).toContain(labels.state.ready)
      await expect(words[3]).toContain(labels.state.failed)
    })

    await step("E cada botão de remover diz QUAL arquivo remove", async () => {
      // Uma fila de três botões chamados "Remover" é o mesmo botão para quem
      // ouve a tela.
      const canvas = within(canvasElement)
      for (const fileName of ["planta.pdf", "medidas.csv", "fachada.png", "corte.dwg"]) {
        await expect(
          canvas.getByRole("button", { name: labels.remove.replace("{name}", fileName) }),
        ).toBeInTheDocument()
      }
    })
  },
}
