import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { resolveColor } from "@shared/testing/cor"
import { contrastesNosDoisModos } from "@shared/testing/form-probe"

import { Fieldset, FormField } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  formDisabledSource,
  formEmDuasPaletasSource,
  formInvalidoSource,
  formSource,
} from "./form.source"

const meta: Meta = {
  title: "UI/Form/States",
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: formSource } },
  },
}

export default meta
type Story = StoryObj

/**
 * O campo com mensagem de erro. Nada aqui interage: o estado é o assunto, e a
 * foto do Chromatic tem que sair com o erro na tela — story de estado visual
 * cuja play termina em OUTRO estado fotografa a coisa errada.
 */
export const Invalid: Story = {
  parameters: {
    covers: [
      "functional.item4",
      "accessibility.item3",
      "accessibility.item5",
      "visual.item3",
    ],
    // O par obrigatório do estado inválido — `error` no campo E `aria-invalid`
    // no controle — não sai dos args, desligados neste arquivo.
    docs: { source: { transform: formInvalidoSource } },
  },
  render: () => (
    <FormField
      className="nds-max-w-sm"
      label="Senha"
      description="Use pelo menos 8 caracteres, com letras e números."
      error="A senha precisa ter pelo menos 8 caracteres."
    >
      <Input type="password" defaultValue="123" aria-invalid autoComplete="new-password" />
    </FormField>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const campo = canvasElement.querySelector<HTMLElement>('[data-slot="field"]')!
    const controle = canvas.getByLabelText("Senha")
    const rotulo = campo.querySelector<HTMLLabelElement>("label")!
    const mensagem = campo.querySelector<HTMLElement>('[data-slot="field-error"]')!

    await step("A mensagem é anunciada sem roubar o foco", async () => {
      // `polite` e não `assertive`: em validação a cada tecla, interromper a
      // digitação a cada caractere é pior que esperar a pausa.
      await expect(mensagem).toHaveAttribute("aria-live", "polite")
    })

    await step("A mensagem está em --destructive, e não numa cor qualquer", async () => {
      // Comparar com o token RESOLVIDO pelo navegador, não com um rgb literal:
      // o literal quebraria a cada ajuste de paleta e não valeria nos temas de
      // marca. É a metade do item de contrato que ninguém verificava.
      await expect(getComputedStyle(mensagem).color).toBe(
        resolveColor(campo, "hsl(var(--destructive))"),
      )
    })

    await step("O erro chega ao controle e ao rótulo, não só à cor da mensagem", async () => {
      // Vermelho sozinho não alcança quem não enxerga cor. O `aria-describedby`
      // é o que faz o leitor anunciar a mensagem junto com o nome do campo.
      await expect(controle.getAttribute("aria-describedby")).toContain(mensagem.id)
      await expect(document.getElementById(mensagem.id)).toBe(mensagem)
      await expect(controle).toHaveAttribute("aria-invalid", "true")
      await expect(rotulo).toHaveAttribute("data-error", "true")
    })

    await step("Rótulo, apoio e erro passam de 4.5:1 no claro E no escuro", async () => {
      // O axe do test-runner mede só o que está na tela, e a tela está sempre no
      // tema claro — metade do produto ficava fora enquanto o contrato afirmava
      // "em todos os temas". A classe `.dark` sai no `finally` do colhedor.
      const measurements = contrastesNosDoisModos(campo)
      await expect(measurements).toHaveLength(2)
      for (const m of measurements) {
        await expect(m.rotulo).toBeGreaterThanOrEqual(4.5)
        await expect(m.apoio).toBeGreaterThanOrEqual(4.5)
        await expect(m.erro).toBeGreaterThanOrEqual(4.5)
      }
    })
  },
}

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item7"],
    // `disabled` é do CONTROLE, não do campo — o snippet precisa mostrar onde
    // ele fica para que o rótulo continue visível e associado.
    docs: { source: { transform: formDisabledSource } },
  },
  render: () => (
    <FormField
      className="nds-max-w-sm"
      label="CPF"
      description="Preenchido pelo cadastro da empresa."
    >
      <Input type="text" defaultValue="000.000.000-00" disabled />
    </FormField>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const controle = canvas.getByLabelText("CPF") as HTMLInputElement

    await step("O controle não recebe foco nem digitação", async () => {
      // Clique em elemento desabilitado é idempotente por natureza: ele não
      // muda de estado em rodada nenhuma do replay.
      await expect(controle).toBeDisabled()
      await userEvent.click(controle)
      await expect(controle).not.toHaveFocus()
    })

    await step("O rótulo continua visível e associado", async () => {
      // Rótulo escondido em campo desabilitado é o padrão que faz a pessoa
      // perder a referência do que aquele valor significa.
      const rotulo = canvasElement.querySelector<HTMLLabelElement>("label")!
      await expect(rotulo.offsetParent).not.toBeNull()
      await expect(rotulo.htmlFor).toBe(controle.id)
    })

    await step("A descrição segue sendo lida junto com o campo", async () => {
      const descricao = canvasElement.querySelector<HTMLElement>(
        '[data-slot="field-description"]',
      )!
      await expect(controle.getAttribute("aria-describedby")).toContain(descricao.id)
    })
  },
}

/**
 * O tema escuro não é enfeite do Chromatic: a mensagem de erro e o texto de
 * apoio dependem de tokens que trocam de valor entre paletas, e é onde o
 * contraste costuma cair primeiro.
 */
export const DarkPalette: Story = {
  parameters: {
    covers: ["visual.item5"],
    // Três campos e um fieldset numa story só: é a combinação inteira que
    // mostra erro e apoio precisando de tokens distintos em qualquer paleta.
    docs: { source: { transform: formEmDuasPaletasSource } },
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: "dark" },
  },
  render: () => (
    <div className="nds-stack nds-max-w-sm">
      <FormField label="Nome completo">
        <Input type="text" placeholder="ex: João da Silva" />
      </FormField>
      <FormField
        label="Email"
        description="Usaremos apenas para contato."
        error="Endereço de email incompleto."
      >
        <Input type="email" defaultValue="joao@" aria-invalid />
      </FormField>
      <Fieldset legend="Endereço de entrega">
        <FormField label="Cidade">
          <Input type="text" defaultValue="São Paulo" disabled />
        </FormField>
      </Fieldset>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("A paleta escura está aplicada no documento", async () => {
      await expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    await step("O campo é mais escuro que o texto que ele recebe", async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const campo = canvasElement.querySelector<HTMLElement>('input[type="text"]')!
      const cs = getComputedStyle(campo)
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? []
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color))
    })

    await step("A mensagem de erro se distingue do texto de apoio", async () => {
      // Se as duas caíssem na mesma cor, o erro deixaria de ser visível como
      // erro — e nenhum teste de contraste pegaria, porque as duas passariam.
      const descricao = canvasElement.querySelector<HTMLElement>(
        '[data-slot="field-description"]',
      )!
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!
      await expect(getComputedStyle(mensagem).color).not.toBe(
        getComputedStyle(descricao).color,
      )
    })
  },
}
