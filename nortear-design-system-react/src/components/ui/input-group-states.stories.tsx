import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./input-group"
import {
  addonsOf,
  inputGroupControl,
  inputGroupRoot,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from "./input-group.fixtures"
import {
  inputGroupDisabledSource,
  inputGroupInvalidSource,
  inputGroupRestSource,
} from "./input-group.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A folha declara QUATRO estados para a moldura, e nenhum deles é escrito por
// JS: repouso, foco (`:has(.nds-input-group-control:focus-visible)`), inválido
// (`:has([aria-invalid="true"])`) e desabilitado (`:has(:disabled)`). Estas
// stories medem o que a pessoa PERCEBE — a palavra e a tabulação —, porque cor
// sozinha não é estado.
//
// O estado somente-leitura NÃO tem story aqui, e a ausência é declarada: a folha
// não declara forma para ele. Inventar uma classe que a folha não tem seria
// justamente crayonizar o valor; enquanto essa forma não existir, `readOnly` é
// atributo nativo do campo, anunciado pelo leitor de tela e sem cor gasta.

const meta: Meta = {
  title: "Primitives/Form/InputGroup/States",
  tags: ["form"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: inputGroupRestSource },
      description: {
        component:
          "Repouso, inválido e desabilitado. O estado mora sempre no CAMPO — a moldura só reage a ele —, e nunca depende só de cor: inválido tem texto ligado ao campo, desabilitado sai da ordem de tabulação.",
      },
    },
  },
}

export default meta
type Story = StoryObj

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Rest: Story = {
  parameters: {
    covers: ["visual.item3"],
  },
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{SITE_PREFIX}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder={SITE_PLACEHOLDER} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>{PASTE_LABEL}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl(canvasElement)

    await step(
      "Em repouso o campo é editável e não carrega estado nenhum",
      async () => {
        await expect(field()).toBeVisible()
        await expect(field()).not.toBeDisabled()
        await expect(field().hasAttribute("aria-invalid")).toBe(false)
        await expect(field().hasAttribute("aria-describedby")).toBe(false)
      },
    )

    await step("A moldura é do GRUPO, e o campo fica nu", async () => {
      // É a regra central da folha: se o campo desenhasse a própria borda,
      // apareceriam duas molduras concêntricas na hora do foco.
      const fieldStyle = getComputedStyle(field())
      await expect(fieldStyle.borderTopWidth).toBe("0px")
      await expect(fieldStyle.boxShadow).toBe("none")

      const frameStyle = getComputedStyle(root())
      await expect(frameStyle.borderTopWidth).not.toBe("0px")
    })
  },
}

export const Invalid: Story = {
  parameters: {
    covers: ["accessibility.item5", "visual.item3"],
    docs: { source: { transform: inputGroupInvalidSource } },
  },
  render: () => (
    // O texto do erro mora FORA da moldura: dentro dela ele herdaria o
    // `cursor: text` do addon e disputaria a largura com o que a pessoa digita.
    <div className="nds-stack nds-w-full" data-spacing="sm">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{SITE_PREFIX}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          placeholder={SITE_PLACEHOLDER}
          aria-invalid
          aria-describedby={INVALID_MESSAGE_ID}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>{PASTE_LABEL}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p
        id={INVALID_MESSAGE_ID}
        className="nds-text-caption nds-text-destructive"
      >
        {INVALID_MESSAGE}
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl(canvasElement)

    await step("O erro é PALAVRA antes de ser cor", async () => {
      // accessibility.item5 (WCAG 1.4.1). O id sai da fixture como constante
      // nomeada: escrito à mão aqui, um literal errado faria a story lançar em
      // vez de reprovar, e ninguém saberia por quê.
      await expect(field()).toHaveAttribute("aria-invalid", "true")
      await expect(field()).toHaveAttribute("aria-describedby", INVALID_MESSAGE_ID)

      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`)
      await expect(description).not.toBeNull()
      await expect(description).toHaveTextContent(INVALID_MESSAGE)
    })

    await step(
      "A moldura ECOA o estado do campo, sem que ninguém a pinte",
      async () => {
        // A cor vem de `:has([aria-invalid="true"])` na folha. Medir a cor
        // computada é o que separa "a regra existe" de "a regra alcançou".
        //
        // A escrita e as duas leituras acontecem aqui, de uma vez — nunca
        // dentro de um `waitFor`, que reagendaria a si mesmo e travaria a aba.
        // O atributo é DEVOLVIDO no mesmo passo, e é isso que faz o replay do
        // painel Interactions partir do mesmo estado da primeira rodada.
        const withError = getComputedStyle(root()).borderTopColor

        field().removeAttribute("aria-invalid")
        const withoutError = getComputedStyle(root()).borderTopColor
        field().setAttribute("aria-invalid", "true")

        await expect(withError).not.toBe(withoutError)
      },
    )

    await step("O texto do erro mora FORA da moldura", async () => {
      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`)!
      await expect(root().contains(description)).toBe(false)

      // E o campo continua sendo achável pelo papel, com a descrição ligada.
      await expect(canvas.getByRole("textbox")).toBe(field())
    })
  },
}

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item3"],
    docs: { source: { transform: inputGroupDisabledSource } },
  },
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{SITE_PREFIX}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder={SITE_PLACEHOLDER} disabled />
      <InputGroupAddon align="inline-end">
        <InputGroupButton disabled>{PASTE_LABEL}</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl(canvasElement)

    await step(
      "O campo está desabilitado DE VERDADE, e sai da tabulação",
      async () => {
        // functional.item5 — aparência de desabilitado com o campo ainda
        // focável é a pior das duas: a pessoa chega nele por Tab e não
        // consegue digitar.
        await expect(field()).toBeDisabled()

        field().focus()
        await expect(field()).not.toHaveFocus()
      },
    )

    await step("O grupo inteiro esmaece por REAGIR ao campo", async () => {
      // A opacidade vem de `:has(:disabled)` na folha; ninguém a escreve.
      const opacity = Number(getComputedStyle(root()).opacity)
      await expect(opacity).toBeLessThan(1)
      await expect(root().hasAttribute("aria-disabled")).toBe(false)
    })

    await step("O addon continua sem papel e sem foco", async () => {
      for (const addon of addonsOf(root())) {
        await expect(addon.hasAttribute("role")).toBe(false)
        await expect(addon.hasAttribute("tabindex")).toBe(false)
      }
    })
  },
}
