import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within, expect, fn, waitFor } from "storybook/test"
import {
  waitForPortal,
  waitForPortalGone,
  REGRA_GUARDA_DE_FOCO,
} from "@/lib/wait-for-portal"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./menubar"
import { MenubarDocs } from "@/components/docs/MenubarDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"

// ─── Dados da barra ───────────────────────────────────────────────────────────
//
// A barra do Playground nasce de uma lista, e não de markup repetido quatro
// vezes: as asserções contam a partir DELA (`MENUS.length`), então acrescentar
// um menu não deixa um número cravado para trás no teste.

const MENUS = [
  {
    label: "Arquivo",
    itens: [
      { label: "Novo", atalho: "⌘N" },
      { label: "Abrir", atalho: "⌘O" },
      { label: "Salvar", atalho: "⌘S" },
    ],
  },
  {
    label: "Editar",
    itens: [
      { label: "Desfazer", atalho: "⌘Z" },
      { label: "Refazer", atalho: "⇧⌘Z" },
      { label: "Copiar", atalho: "⌘C" },
    ],
  },
  {
    label: "Exibir",
    itens: [{ label: "Aproximar" }, { label: "Afastar" }, { label: "Tela cheia" }],
  },
  {
    label: "Ajuda",
    itens: [{ label: "Documentação" }, { label: "Atalhos de teclado" }],
  },
] as const

type PlaygroundArgs = {
  modal: boolean
  loopFocus: boolean
  onOpenChange: (aberto: boolean) => void
}

const meta = {
  title: "UI/Menubar",
  component: Menubar as never,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: { page: withAutoDocsTab(MenubarDocs) },
  },
  argTypes: {
    modal: {
      control: "boolean",
      description:
        "Bloqueia a interação com o resto da página enquanto um menu está aberto.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    loopFocus: {
      control: "boolean",
      description:
        "A seta dá a volta do último gatilho para o primeiro, e vice-versa.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    onOpenChange: { control: false, table: { disable: true } },
  },
  args: {
    modal: true,
    loopFocus: true,
    onOpenChange: fn(),
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "functional.item4",
      "functional.item6",
      "functional.item8",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item6",
    ],
  },
  render: ({ modal, loopFocus, onOpenChange }) => (
    <div style={{ contain: "layout", minHeight: 320, position: "relative" }}>
      <Menubar modal={modal} loopFocus={loopFocus}>
        {MENUS.map((menu) => (
          <MenubarMenu
            key={menu.label}
            onOpenChange={(aberto) => onOpenChange?.(aberto)}
          >
            <MenubarTrigger>{menu.label}</MenubarTrigger>
            <MenubarContent>
              {menu.itens.map((item) => (
                <MenubarItem key={item.label}>
                  {item.label}
                  {"atalho" in item ? (
                    <MenubarShortcut>{item.atalho}</MenubarShortcut>
                  ) : null}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ))}
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement)
    const barra = canvas.getByRole("menubar")
    const gatilhos = within(barra).getAllByRole("menuitem")
    const [arquivo, editar] = gatilhos

    await step("A barra é um menubar, e cada gatilho anuncia o menu que abre", async () => {
      await expect(gatilhos).toHaveLength(MENUS.length)
      for (const [i, gatilho] of gatilhos.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS[i].label)
        await expect(gatilho.getAttribute("aria-haspopup")).toBe("menu")
      }
    })

    await step("A barra inteira é UMA parada de tabulação", async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      ;(document.activeElement as HTMLElement | null)?.blur()
      await userEvent.tab()

      // Roving tabindex: um só gatilho é alcançável pelo Tab, e é o primeiro.
      // Sem isto, atravessar uma barra de seis menus custaria seis Tabs.
      await expect(document.activeElement).toBe(arquivo)
      await expect(gatilhos.filter((g) => g.tabIndex === 0)).toHaveLength(1)
    })

    await step("Enter no gatilho abre o menu com foco no primeiro item", async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute("aria-expanded") !== "true") {
        arquivo.focus()
        await userEvent.keyboard("{Enter}")
      }

      const menu = await waitForPortal("menu")
      await expect(arquivo.getAttribute("aria-expanded")).toBe("true")
      await expect(args.onOpenChange).toHaveBeenCalledWith(true)

      const itens = within(menu).getAllByRole("menuitem")
      await expect(itens).toHaveLength(MENUS[0].itens.length)
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[0])
      })
    })

    await step("Dentro do menu, a seta vertical anda entre os itens", async () => {
      const menu = await waitForPortal("menu")
      const itens = within(menu).getAllByRole("menuitem")

      await userEvent.keyboard("{ArrowDown}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[1])
      })

      await userEvent.keyboard("{ArrowUp}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[0])
      })
    })

    await step("Com um menu aberto, a seta horizontal já abre o vizinho", async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard("{ArrowRight}")
      await waitFor(async () => {
        await expect(editar.getAttribute("aria-expanded")).toBe("true")
      })
      await expect(arquivo.getAttribute("aria-expanded")).toBe("false")

      await userEvent.keyboard("{ArrowLeft}")
      await waitFor(async () => {
        await expect(arquivo.getAttribute("aria-expanded")).toBe("true")
      })
      await expect(editar.getAttribute("aria-expanded")).toBe("false")
    })

    await step("Escape fecha o menu e devolve o foco ao gatilho", async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (arquivo.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(arquivo)
        await waitForPortal("menu")
      }
      arquivo.focus()
      await userEvent.keyboard("{Escape}")
      await waitForPortalGone("menu")
      await expect(arquivo.getAttribute("aria-expanded")).toBe("false")
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo)
      })
    })

    await step("Clicar no gatilho de um menu aberto fecha o menu", async () => {
      if (arquivo.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(arquivo)
      }
      await waitForPortal("menu")

      await userEvent.click(arquivo)
      await waitForPortalGone("menu")
      await expect(arquivo.getAttribute("aria-expanded")).toBe("false")
    })
  },
}
