import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
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
  inputGroupRoots,
  NOTE_PLACEHOLDER,
  SEND_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
  visualStart,
  visualTop,
} from "./input-group.fixtures"
import { inputGroupAlignmentsSource } from "./input-group.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A variação do InputGroup é a POSIÇÃO do acompanhamento, e ela mora num
// atributo que a folha lê: `[data-align]`. Não há classe por alinhamento para
// medir aqui, e é por isso que estas stories medem a ORDEM VISUAL — que é o que
// a pessoa vê — em vez do nome do atributo sozinho.

const meta: Meta = {
  title: "Primitives/Form/InputGroup/Variants",
  tags: ["form"],
  parameters: {
    layout: "padded",
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: inputGroupAlignmentsSource },
      description: {
        component:
          "As quatro posições do addon. As duas em linha mantêm tudo numa fila; as duas em bloco ocupam a largura inteira e fazem o grupo virar coluna — decisão da folha compartilhada, sem opção de direção para passar.",
      },
    },
  },
}

export default meta
type Story = StoryObj

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Alignments: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item2"],
  },
  // Uma moldura por posição, e cada uma com UM addon só: com dois na mesma
  // moldura não daria para afirmar qual deles a folha ordenou.
  render: () => (
    <div className="nds-stack nds-w-full" data-spacing="lg">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{SITE_PREFIX}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder={SITE_PLACEHOLDER} />
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder={SITE_PLACEHOLDER} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{SITE_SUFFIX}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>{SITE_PREFIX}</InputGroupText>
        </InputGroupAddon>
        <InputGroupTextarea placeholder={NOTE_PLACEHOLDER} rows={2} />
      </InputGroup>

      <InputGroup>
        <InputGroupTextarea placeholder={NOTE_PLACEHOLDER} rows={2} />
        <InputGroupAddon align="block-end">
          <InputGroupButton>{SEND_LABEL}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const groups = () => inputGroupRoots(canvasElement)

    await step("Cada moldura carrega a posição declarada", async () => {
      // functional.item4, primeira metade: o atributo chegou.
      await expect(groups()).toHaveLength(4)
      const positions = groups().map(
        (group) =>
          group.querySelector<HTMLElement>('[data-slot="input-group-addon"]')!
            .dataset.align,
      )
      await expect(positions).toEqual([
        "inline-start",
        "inline-end",
        "block-start",
        "block-end",
      ])
    })

    await step("Em linha, a ordem VISUAL acompanha a posição", async () => {
      // functional.item4, segunda metade — e a que importa. O atributo sozinho
      // não prova nada: quem move o addon é a folha, por `order`. Medir a
      // caixa é o que separa "o atributo está lá" de "o addon está no lugar".
      const [leading, trailing] = groups()

      const leadingAddon = addonOfAlign(leading, "inline-start")!
      const leadingField = inputGroupControl(leading)
      await expect(visualStart(leadingAddon)).toBeLessThan(
        visualStart(leadingField),
      )

      const trailingAddon = addonOfAlign(trailing, "inline-end")!
      const trailingField = inputGroupControl(trailing)
      await expect(visualStart(trailingAddon)).toBeGreaterThan(
        visualStart(trailingField),
      )
    })

    await step(
      "Em bloco, o grupo empilha e o addon ocupa a largura inteira",
      async () => {
        const [, , above, below] = groups()

        const aboveAddon = addonOfAlign(above, "block-start")!
        const aboveField = inputGroupControl(above)
        await expect(visualTop(aboveAddon)).toBeLessThan(visualTop(aboveField))

        const belowAddon = addonOfAlign(below, "block-end")!
        const belowField = inputGroupControl(below)
        await expect(visualTop(belowAddon)).toBeGreaterThan(
          visualTop(belowField),
        )

        // A largura inteira é o que distingue o addon em bloco do em linha: ele
        // não divide a fila com o campo, ele ocupa a própria.
        const addonWidth = belowAddon.getBoundingClientRect().width
        const fieldWidth = belowField.getBoundingClientRect().width
        await expect(Math.abs(addonWidth - fieldWidth)).toBeLessThan(2)
      },
    )

    await step(
      "Nenhuma moldura ganhou papel ou nome que não foi pedido",
      async () => {
        // Nenhuma das quatro recebeu `aria-label`: o rótulo do campo é quem
        // nomeia, e um grupo nomeado à toa faz o leitor de tela repetir.
        await expect(canvas.queryAllByRole("group", { name: /./ })).toHaveLength(
          0,
        )
        for (const group of groups()) {
          await expect(group).toHaveAttribute("role", "group")
          await expect(group.hasAttribute("aria-label")).toBe(false)
        }
      },
    )
  },
}
