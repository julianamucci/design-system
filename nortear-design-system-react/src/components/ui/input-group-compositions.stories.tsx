import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
// O ícone chega com apelido: o nome `Search` é da story, e a barra lateral
// mostra o nome do export. Colisão aqui viraria um nome de story fora do
// contrato compartilhado, e a mesma story apareceria em outro lugar da árvore.
import { Eye, EyeOff, Search as SearchIcon } from "lucide-react"
import { expect, userEvent, within } from "storybook/test"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group"
import {
  addonOfAlign,
  inputGroupControl,
  inputGroupRoot,
  HIDE_LABEL,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_FIELD_ID,
  PASSWORD_GROUP_LABEL,
  PASSWORD_SAMPLE,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_FIELD_ID,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from "./input-group.fixtures"
import {
  inputGroupAffixSource,
  inputGroupPasswordSource,
  inputGroupSearchSource,
  inputGroupTextareaToolbarSource,
} from "./input-group.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As quatro composições que o conteúdo compartilhado documenta. Cada uma existe
// para provar uma decisão diferente do componente, e não para ilustrar um
// visual: busca prova que decoração fica fora da leitura, senha prova que o que
// age é botão, formato prova que prefixo não substitui rótulo, e a área de
// texto prova que o grupo empilha sozinho.

const meta: Meta = {
  title: "Components/Form/InputGroup/Compositions",
  tags: ["form"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: inputGroupSearchSource },
      description: {
        component:
          "Busca, senha, formato e área de texto. O grupo só ganha nome acessível quando guarda mais de um controle — nas composições de campo simples ele fica sem nome de propósito.",
      },
    },
  },
}

export default meta
type Story = StoryObj

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Search: Story = {
  parameters: {
    covers: ["visual.item4"],
  },
  render: () => (
    <InputGroup aria-label={SEARCH_GROUP_LABEL}>
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder={SEARCH_PLACEHOLDER} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{SEARCH_SHORTCUT}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)

    await step(
      "O ícone é decoração e fica fora da árvore de acessibilidade",
      async () => {
        // O que a lupa ilustra já está no nome do grupo e no rótulo do campo:
        // lida também pelo leitor de tela, ela viraria repetição.
        const icon = root().querySelector("svg")!
        await expect(icon).toHaveAttribute("aria-hidden", "true")
        await expect(icon.hasAttribute("tabindex")).toBe(false)
      },
    )

    await step("O atalho é TEXTO, e não um controle disfarçado", async () => {
      // `Ctrl+K` informa; ele não age. Um botão ali prometeria uma ação que o
      // componente não tem, e ainda gastaria uma parada de tabulação.
      const suffix = addonOfAlign(root(), "inline-end")!
      await expect(suffix).toHaveTextContent(SEARCH_SHORTCUT)
      await expect(suffix.querySelector("button")).toBeNull()
      await expect(canvas.queryAllByRole("button")).toHaveLength(0)
    })

    await step(
      "O grupo tem nome porque a busca é um conjunto, não só um campo",
      async () => {
        await expect(
          canvas.getByRole("group", { name: SEARCH_GROUP_LABEL }),
        ).toBe(root())
      },
    )
  },
}

/**
 * O campo de senha com a alternância no addon final.
 *
 * O estado vive FORA do componente — é a aplicação que decide se a senha está
 * à mostra. O NOME do botão é que conta o que aconteceu, e não o desenho do
 * ícone: por isso ele muda junto com o estado, e é ele que a play mede.
 */
function PasswordField() {
  const [visible, setVisible] = useState(false)

  return (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      {/* O campo tem nome PRÓPRIO, e o nome do grupo não o substitui: o do
          grupo pertence ao conjunto campo + botão (decisão 2 do primitivo), e
          o leitor de tela não o empresta ao campo. Sem este rótulo o campo
          ficava anônimo — sem `<label>`, sem `aria-label` e sem `placeholder`,
          que é justamente o caso que o axe reprova na regra `label`. */}
      <label className="nds-label" htmlFor={PASSWORD_FIELD_ID}>
        {PASSWORD_GROUP_LABEL}
      </label>
      <InputGroup aria-label={PASSWORD_GROUP_LABEL}>
        <InputGroupInput
          id={PASSWORD_FIELD_ID}
          type={visible ? "text" : "password"}
          defaultValue={PASSWORD_SAMPLE}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? HIDE_LABEL : REVEAL_LABEL}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export const PasswordReveal: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item4"],
    docs: { source: { transform: inputGroupPasswordSource } },
  },
  render: () => <PasswordField />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl<HTMLInputElement>(canvasElement)

    await step("O que age é um BOTÃO de verdade, com nome próprio", async () => {
      // Um bloco clicável no lugar do botão não recebe foco e some para quem
      // navega por teclado — foi o custo declarado do `stepper`.
      const toggle = root().querySelector<HTMLElement>(
        '[data-slot="input-group-button"]',
      )!
      await expect(toggle.tagName).toBe("BUTTON")
      await expect(toggle).toHaveAttribute("type", "button")
      // Só de ícone: sem texto visível, o nome acessível é a única pista.
      await expect(toggle.textContent?.trim()).toBe("")
      await expect(canvas.getByRole("button", { name: /./ })).toBe(toggle)
    })

    await step("A alternância conta o que aconteceu pela PALAVRA", async () => {
      // O passo estabelece a própria precondição: o painel Interactions
      // reexecuta no mesmo DOM, então clicar às cegas partiria do estado que a
      // rodada anterior deixou e inverteria o resultado. O par só clica quando
      // o estado atual não é o desejado.
      const show = async () => {
        if (field().type !== "text") {
          await userEvent.click(canvas.getByRole("button", { name: REVEAL_LABEL }))
        }
      }
      const hide = async () => {
        if (field().type !== "password") {
          await userEvent.click(canvas.getByRole("button", { name: HIDE_LABEL }))
        }
      }

      await hide()
      await expect(field().type).toBe("password")
      await expect(
        canvas.getByRole("button", { name: REVEAL_LABEL }),
      ).toBeInTheDocument()

      await show()
      await expect(field().type).toBe("text")
      await expect(
        canvas.getByRole("button", { name: HIDE_LABEL }),
      ).toBeInTheDocument()

      await hide()
    })

    await step(
      "Clique no botão é DO BOTÃO — o campo não rouba o foco",
      async () => {
        // functional.item2. Sem a guarda do atalho do addon, apertar o botão
        // devolveria o foco ao campo no meio da ação, e o botão perderia o
        // próprio foco. É o defeito que a decisão 5 do primitivo existe para
        // evitar, e ele só aparece medindo QUEM ficou com o foco.
        await userEvent.click(canvas.getByRole("button", { name: REVEAL_LABEL }))
        await expect(canvasElement.contains(document.activeElement)).toBe(true)
        await expect(document.activeElement).not.toBe(field())

        // E devolve o estado que a story montou, para a foto e para o replay.
        await userEvent.click(canvas.getByRole("button", { name: HIDE_LABEL }))
        await expect(field().type).toBe("password")
        ;(document.activeElement as HTMLElement | null)?.blur()
      },
    )
  },
}

export const FormatAffixes: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: inputGroupAffixSource } },
  },
  // O rótulo VISÍVEL fica fora da moldura. O prefixo completa o formato; ele
  // não nomeia o campo, e é essa a diferença que o par de Do & Don't ensina.
  render: () => (
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <label className="nds-label" htmlFor={SITE_FIELD_ID}>
        {SITE_GROUP_LABEL}
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{SITE_PREFIX}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id={SITE_FIELD_ID} placeholder={SITE_PLACEHOLDER} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{SITE_SUFFIX}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)

    await step("Quem nomeia o campo é o RÓTULO, e não o prefixo", async () => {
      // Prefixo fazendo as vezes de rótulo deixa o campo sem nome para o
      // leitor de tela — o `https://` não é o assunto do campo.
      const field = canvas.getByLabelText(SITE_GROUP_LABEL)
      await expect(field).toHaveClass("nds-input-group-control")
      await expect(field.getAttribute("aria-label")).toBeNull()
    })

    await step("Os dois fragmentos são texto de apoio nas duas pontas", async () => {
      await expect(addonOfAlign(root(), "inline-start")).toHaveTextContent(
        SITE_PREFIX,
      )
      await expect(addonOfAlign(root(), "inline-end")).toHaveTextContent(
        SITE_SUFFIX,
      )
      await expect(canvas.queryAllByRole("button")).toHaveLength(0)
    })

    await step(
      "O grupo fica SEM nome, porque só há um controle dentro",
      async () => {
        // Nomeá-lo faria o leitor de tela dizer "Endereço do site" duas vezes:
        // uma pelo grupo, outra pelo campo.
        await expect(root().hasAttribute("aria-label")).toBe(false)
        await expect(
          canvas.queryAllByRole("group", { name: /./ }),
        ).toHaveLength(0)
      },
    )
  },
}

export const TextareaWithToolbar: Story = {
  parameters: {
    covers: ["functional.item3", "visual.item4"],
    docs: { source: { transform: inputGroupTextareaToolbarSource } },
  },
  render: () => (
    <InputGroup aria-label={NOTE_GROUP_LABEL}>
      <InputGroupTextarea placeholder={NOTE_PLACEHOLDER} rows={3} />
      <InputGroupAddon align="block-end">
        <InputGroupButton>{SEND_LABEL}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl<HTMLTextAreaElement>(canvasElement)

    await step("Com a área de texto dentro, o grupo empilha sozinho", async () => {
      // functional.item3, primeira metade. Não há opção de direção: a folha
      // troca linha por coluna por `:has(> textarea)`.
      await expect(field().tagName).toBe("TEXTAREA")
      await expect(getComputedStyle(root()).flexDirection).toBe("column")
    })

    await step(
      "O atalho do addon alcança a ÁREA DE TEXTO, e não só o input",
      async () => {
        // functional.item3, segunda metade — e a razão de o campo ser
        // procurado pela CLASSE do controle. Procurado pelo elemento `input`,
        // este clique não focaria nada, e o defeito passaria despercebido nas
        // composições de uma linha, que são a maioria.
        field().blur()
        await expect(field()).not.toHaveFocus()

        // Clique na barra, longe do botão: o alvo é a própria barra.
        await userEvent.click(addonOfAlign(root(), "block-end")!)
        await expect(field()).toHaveFocus()
      },
    )

    await step(
      "O botão da barra é botão, e o grupo tem nome por causa dele",
      async () => {
        const sendButton = canvas.getByRole("button", { name: SEND_LABEL })
        await expect(sendButton.tagName).toBe("BUTTON")
        await expect(canvas.getByRole("group", { name: NOTE_GROUP_LABEL })).toBe(
          root(),
        )

        field().blur()
      },
    )
  },
}
