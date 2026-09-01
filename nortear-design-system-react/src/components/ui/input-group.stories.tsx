import type { Meta, StoryObj } from "@storybook/react-vite"
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
  addonsOf,
  inputGroupControl,
  inputGroupRoot,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from "./input-group.fixtures"
import { inputGroupSource } from "./input-group.source"
import { InputGroupDocs } from "@/components/docs/InputGroupDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

// ─── Meta ─────────────────────────────────────────────────────────────────────

/**
 * O que a Playground controla, mais o que a aba API Reference documenta.
 *
 * `align` e `size` entram sem control de propósito: são props das PEÇAS, e não
 * da raiz. Sem entrada aqui elas não aparecem em lugar nenhum da página de
 * story, e quem lê a aba não descobre que existem.
 */
interface InputGroupArgs {
  "aria-label"?: string
  placeholder: string
  multiline: boolean
  disabled: boolean
  invalid: boolean
  className?: string
  align?: string
  size?: string
}

const meta: Meta<InputGroupArgs> = {
  title: "Primitives/Form/InputGroup",
  tags: ["autodocs", "form"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(InputGroupDocs),
      source: { transform: inputGroupSource },
    },
  },
  argTypes: {
    "aria-label": {
      control: "text",
      description:
        "Nome acessível do grupo. OPCIONAL: com um campo só, o rótulo do campo já nomeia, e nomear o grupo também faz o leitor de tela repetir. Use quando a moldura guardar mais de um controle.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    placeholder: {
      control: "text",
      description: "Texto de exemplo dentro do campo. Não substitui o rótulo.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    multiline: {
      control: "boolean",
      description:
        "Troca o campo de uma linha por uma área de texto. Presente, a folha compartilhada faz o grupo empilhar sozinha.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Desabilita o campo interno. O grupo inteiro esmaece por reagir ao campo, e o campo sai da ordem de tabulação por ser desabilitado de verdade.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    invalid: {
      control: "boolean",
      description:
        "Marca o CAMPO como inválido e o liga ao texto que descreve o problema. A moldura vermelha é o eco disso, nunca a origem.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    className: {
      // Fixada pelo `render`: control aqui seria morto.
      control: false,
      description: "Classes .nds-* adicionais na raiz.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    align: {
      control: false,
      description:
        "InputGroupAddon: posição do addon — 'inline-start', 'inline-end', 'block-start' ou 'block-end'. As duas em bloco fazem o grupo empilhar.",
      table: {
        type: { summary: "InputGroupAlign" },
        defaultValue: { summary: "'inline-start'" },
      },
    },
    size: {
      control: false,
      description:
        "InputGroupButton: medida do botão apertado — 'xs', 'sm', 'icon-xs' ou 'icon-sm'. É repassada ao Button, que é quem rende a classe da medida.",
      table: {
        type: { summary: "InputGroupButtonSize" },
        defaultValue: { summary: "'xs'" },
      },
    },
  },
  args: {
    "aria-label": SITE_GROUP_LABEL,
    placeholder: SITE_PLACEHOLDER,
    multiline: false,
    disabled: false,
    invalid: false,
  },
}

export default meta
type Story = StoryObj<InputGroupArgs>

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item6",
      "accessibility.item7",
      "visual.item1",
    ],
  },
  render: (args) => {
    // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO e apontam
    // para o texto que descreve o problema. A moldura vermelha é o eco disso.
    const invalidAttributes = {
      "aria-invalid": args.invalid || undefined,
      "aria-describedby": args.invalid ? INVALID_MESSAGE_ID : undefined,
    }

    return (
      <div className="nds-stack nds-w-full" data-spacing="sm">
        <InputGroup aria-label={args["aria-label"]}>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{SITE_PREFIX}</InputGroupText>
          </InputGroupAddon>

          {args.multiline ? (
            <InputGroupTextarea
              placeholder={args.placeholder}
              disabled={args.disabled}
              rows={3}
              {...invalidAttributes}
            />
          ) : (
            <InputGroupInput
              placeholder={args.placeholder}
              disabled={args.disabled}
              {...invalidAttributes}
            />
          )}

          <InputGroupAddon align="inline-end">
            <InputGroupButton>{PASTE_LABEL}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {/* O texto do erro mora FORA da moldura: dentro dela ele herdaria o
            `cursor: text` do addon e disputaria a largura com o que a pessoa
            digita. Ele só aparece com o control ligado — `aria-describedby`
            apontando para um id ausente é promessa que o leitor de tela não
            consegue cumprir. */}
        {args.invalid && (
          <p
            id={INVALID_MESSAGE_ID}
            className="nds-text-caption nds-text-destructive"
          >
            {INVALID_MESSAGE}
          </p>
        )}
      </div>
    )
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement)
    const root = () => inputGroupRoot(canvasElement)
    const field = () => inputGroupControl(canvasElement)

    await step(
      "A raiz declara papel de grupo, e o papel ACEITA o nome que recebe",
      async () => {
        // accessibility.item1 e item2. O papel está declarado de propósito: em
        // `drawer` e `sheet` o corpo era um `<div>` sem papel e o `aria-label`
        // era descartado em silêncio. Aqui a busca por papel COM nome é o que
        // prova que o nome chegou — se ele fosse descartado, ela não acharia.
        const byRole = canvas.getByRole("group", { name: args["aria-label"]! })
        await expect(byRole).toBe(root())
      },
    )

    await step("O addon não declara papel nenhum", async () => {
      // accessibility.item3 — um agrupamento sem nome dentro do grupo de
      // verdade acrescenta um degrau que anuncia "grupo" e não informa nada.
      const addons = addonsOf(root())
      await expect(addons).toHaveLength(2)
      for (const addon of addons) {
        await expect(addon.hasAttribute("role")).toBe(false)
      }
      // E o grupo continua sendo o ÚNICO com papel de grupo na árvore.
      await expect(canvas.getAllByRole("group")).toHaveLength(1)
    })

    await step("Nenhum addon é parada de tabulação", async () => {
      // accessibility.item4 — o addon é atalho de ponteiro, não controle. O
      // que age ali é o botão, e ele é um `<button>` de verdade.
      for (const addon of addonsOf(root())) {
        await expect(addon.hasAttribute("tabindex")).toBe(false)
      }
      const actionable = root().querySelector<HTMLElement>(
        '[data-slot="input-group-button"]',
      )!
      await expect(actionable.tagName).toBe("BUTTON")
      await expect(actionable).toHaveAttribute("type", "button")
    })

    await step("Clicar no addon decorativo leva o foco ao campo", async () => {
      // functional.item1. O passo estabelece a PRÓPRIA precondição — tira o
      // foco antes de clicar — porque o painel Interactions reexecuta no mesmo
      // DOM: sem isso, a segunda rodada partiria do campo já focado e a
      // asserção passaria sem medir nada.
      field().blur()
      await expect(field()).not.toHaveFocus()

      await userEvent.click(addonOfAlign(root(), "inline-start")!)
      await expect(field()).toHaveFocus()
    })

    await step("Nada no grupo é região viva", async () => {
      // accessibility.item6 — quem conta o erro é o texto ligado ao campo, no
      // momento da validação, e não uma moldura que se reanuncia.
      await expect(root().querySelectorAll("[aria-live]")).toHaveLength(0)
      await expect(
        root().querySelectorAll('[role="status"], [role="alert"], [role="log"]'),
      ).toHaveLength(0)
      await expect(root().hasAttribute("aria-live")).toBe(false)
    })

    await step(
      "A altura é RESULTADO, e cresce com o tamanho do texto",
      async () => {
        // accessibility.item7 (WCAG 1.4.4). Medir a classe não prova nada: o
        // que a norma pede é que o componente ACOMPANHE o texto ampliado.
        // Então a medição é essa mesma — dobra o degrau de controle e confere
        // que a moldura cresceu junto. Com altura cravada em qualquer peça, a
        // segunda medida sairia igual à primeira e este passo reprova.
        //
        // O knob é `--text-control`, e NÃO `--type-base`: os dois são tokens do
        // sistema, mas `--text-control` é declarado em `:root` como
        // `calc(var(--type-base) * .875)`, e a substituição de `var()` acontece
        // ali. Redefinir `--type-base` no meio da árvore deixa `--text-control`
        // com o valor já resolvido, e a sonda mediria duas vezes o mesmo
        // número. `--text-control` é o degrau que o campo e o addon leem de
        // verdade, e é ele que a preferência de fonte do navegador move.
        //
        // A escrita e as duas leituras acontecem AQUI, de uma vez, e nunca
        // dentro de um `waitFor`: condição que mexe no DOM reagenda a si mesma
        // por observador de mutação, o prazo nunca chega e a aba morre sem
        // reportar.
        const host = root().parentElement as HTMLElement
        const original = host.style.getPropertyValue("--text-control")

        const before = root().getBoundingClientRect().height
        host.style.setProperty("--text-control", "2rem")
        const after = root().getBoundingClientRect().height
        if (original) host.style.setProperty("--text-control", original)
        else host.style.removeProperty("--text-control")

        await expect(after).toBeGreaterThan(before)

        // E nenhuma peça crava a altura por estilo em linha, que passaria por
        // cima da folha e levaria o tema e a densidade junto.
        const pieces = [
          root(),
          field(),
          ...root().querySelectorAll<HTMLElement>("[data-slot]"),
        ]
        for (const piece of pieces) {
          await expect(piece.style.height).toBe("")
        }
      },
    )

    await step("A foto sai sem o foco que só o teste provocou", async () => {
      // A foto do Chromatic é tirada depois da play: sair do campo deixa a
      // moldura no estado de montagem, e não num anel de foco de teste.
      field().blur()
      await expect(field()).not.toHaveFocus()
    })
  },
}
