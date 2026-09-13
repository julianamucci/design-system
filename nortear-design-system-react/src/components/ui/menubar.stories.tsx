import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within, expect, fn, waitFor } from "storybook/test"
import {
  waitForPortal,
  waitForPortalGone,
  FOCUS_RULE_GUARDA,
} from "@/lib/wait-for-portal"
import { expectOndeDiz, waitForAncorado } from "@shared/testing/ancoragem"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar"
import { Button } from "./button"
import { menubarSource } from "./menubar.source"
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
    items: [
      { label: "Novo", atalho: "Ctrl+N" },
      { label: "Abrir", atalho: "Ctrl+O" },
      { label: "Salvar", atalho: "Ctrl+S" },
    ],
  },
  {
    label: "Editar",
    items: [
      { label: "Desfazer", atalho: "Ctrl+Z" },
      { label: "Refazer", atalho: "Ctrl+Shift+Z" },
      { label: "Copiar", atalho: "Ctrl+C" },
    ],
  },
  {
    label: "Exibir",
    items: [{ label: "Aproximar" }, { label: "Afastar" }, { label: "Tela cheia" }],
  },
  {
    label: "Ajuda",
    items: [{ label: "Documentação" }, { label: "Atalhos de teclado" }],
  },
] as const

type PlaygroundArgs = {
  modal: boolean
  loopFocus: boolean
  side: "top" | "right" | "bottom" | "left"
  onOpenChange: (isOpen: boolean) => void
}

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pelo `play`. Recebe só o rótulo do item escolhido.
const itemSelectSpy = fn()

/**
 * Clique fora da barra, por despacho direto no `<body>`.
 *
 * `userEvent.click(document.body)` não serve: com o menu modal a lib segura o
 * resto da página, e o `userEvent` se recusa a clicar em elemento assim — a
 * play morre com erro em vez de falha. Os três eventos são de propósito: a
 * camada dispensável escuta um deles conforme a lib. É o mesmo gesto do
 * `clickOutside` do ContextMenu (`@shared/testing/context-menu-area`), que
 * espera pelo painel DAQUELE componente.
 */
function clickOutside(): void {
  for (const type of ["pointerdown", "mousedown", "click"] as const) {
    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
  }
}

const meta = {
  title: "Components/Navigation/Menubar",
  component: Menubar as never,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      page: withAutoDocsTab(MenubarDocs),
      // O painel imprimia a árvore do `render`, que monta a barra a partir de
      // uma lista declarada só neste arquivo. A transform devolve o uso real.
      source: { transform: menubarSource },
    },
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
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "De que lado do gatilho o painel abre. O padrão desce, que é o que a barra de menu faz em toda plataforma.",
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"bottom"' } },
    },
    onOpenChange: { control: false, table: { disable: true } },
  },
  args: {
    modal: true,
    loopFocus: true,
    side: "bottom",
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
      "functional.item10",
      "functional.item11",
      "functional.item12",
      "functional.item14",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item6",
    ],
  },
  render: ({ modal, loopFocus, side, onOpenChange }) => (
    // `contain` e `position` são mecânica e ficam inline; a altura mínima é
    // valor de design e mora em `.nds-min-h-80` (20rem = os mesmos 320px).
    <div className="nds-min-h-80" style={{ contain: "layout", position: "relative" }}>
      <Menubar modal={modal} loopFocus={loopFocus}>
        {MENUS.map((menu) => (
          <MenubarMenu
            key={menu.label}
            onOpenChange={(isOpen) => onOpenChange?.(isOpen)}
          >
            <MenubarTrigger>{menu.label}</MenubarTrigger>
            <MenubarContent side={side}>
              {menu.items.map((item) => (
                <MenubarItem key={item.label} onClick={() => itemSelectSpy(item.label)}>
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
    const triggers = within(barra).getAllByRole("menuitem")
    const [arquivo, editar] = triggers

    await step("A barra é um menubar, e cada gatilho anuncia o menu que abre", async () => {
      await expect(triggers).toHaveLength(MENUS.length)
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label)
        await expect(trigger.getAttribute("aria-haspopup")).toBe("menu")
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
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1)
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

      const items = within(menu).getAllByRole("menuitem")
      await expect(items).toHaveLength(MENUS[0].items.length)
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0])
      })
    })

    await step("O painel abre do lado que `side` pede", async () => {
      // `side` era ensinado pelo snippet de extensibilidade e não era exercitado
      // por nenhuma story — a prop existe (o conteúdo a encaminha ao
      // posicionador), mas nada provava que ela chega. É o achado
      // `snippet_sem_lastro`: quem copiasse o snippet não teria como saber se o
      // que ele ensina vale. O posicionador reescreve `data-side` quando não há
      // espaço para o lado pedido, então a asserção é contra o ARGUMENTO.
      const menu = await waitForPortal("menu")
      await expect(menu.closest("[data-side]")?.getAttribute("data-side")).toBe(
        args.side
      )

      // E o painel está ONDE ele diz que está. O `data-side` acima mede a
      // AFIRMAÇÃO do posicionador; com o painel fora do fluxo pela folha, o
      // invólucro que a lib posiciona colapsa para 0×0 e ela passa a calcular a
      // colisão contra uma caixa sem tamanho, publicando o lado certo. Medido
      // no Svelte com a declaração replantada: invólucro de 128×97 para 0×0.
      // O vão é 8 e não 4: o Menubar abre de uma BARRA, e as cinco stacks
      // declaram 8 aqui contra os 4 do DropdownMenu.
      const panel = document.querySelector<HTMLElement>(".nds-dropdown-menu-content")!
      await waitForAncorado(panel)
      expectOndeDiz(arquivo, panel, 8)
    })

    await step("Dentro do menu, a seta vertical anda entre os itens", async () => {
      const menu = await waitForPortal("menu")
      const items = within(menu).getAllByRole("menuitem")

      await userEvent.keyboard("{ArrowDown}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[1])
      })

      await userEvent.keyboard("{ArrowUp}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0])
      })
    })

    await step("Digitar uma letra leva ao item que começa por ela", async () => {
      // `s` é inequívoco nesta lista (Novo, Abrir, Salvar) — busca por letra com
      // dois candidatos mediria a política de desempate, que é outro assunto.
      const menu = await waitForPortal("menu")
      const items = within(menu).getAllByRole("menuitem")
      const saveItem = items.find((i) => (i.textContent ?? "").trim().startsWith("Salvar"))!
      await expect(saveItem).toBeDefined()

      await userEvent.keyboard("s")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(saveItem)
      })
    })

    await step("Space também abre o gatilho, e não só Enter", async () => {
      // O item do contrato diz "Enter/Space", e só o Enter era verificado —
      // meia verdade que o auditor de cobertura contava como verdade inteira.
      // Fecha ANTES de digitar: o passo estabelece a própria precondição, senão
      // o replay do painel Interactions parte do menu já aberto e o Space o
      // fecharia.
      await userEvent.keyboard("{Escape}")
      await waitFor(async () => {
        await expect(arquivo.getAttribute("aria-expanded")).toBe("false")
      })

      arquivo.focus()
      await userEvent.keyboard(" ")
      await waitFor(async () => {
        await expect(arquivo.getAttribute("aria-expanded")).toBe("true")
      })
    })

    await step("Home e End saltam para as pontas da lista", async () => {
      const menu = await waitForPortal("menu")
      const items = within(menu).getAllByRole("menuitem")

      await userEvent.keyboard("{End}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[items.length - 1])
      })

      await userEvent.keyboard("{Home}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0])
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

    await step("Clicar fora da barra fecha o menu sem executar nenhum item", async () => {
      // Contrato C5: clique fora é "saí sem decidir". Fechar executando o item
      // em foco — o primeiro, que a lib destaca ao abrir — seria a ação que a
      // pessoa não pediu. A contagem parte do valor ATUAL do espião, que
      // sobrevive ao replay do painel Interactions.
      if (arquivo.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(arquivo)
      }
      await waitForPortal("menu")
      const selectionsBefore = itemSelectSpy.mock.calls.length

      clickOutside()
      await waitForPortalGone("menu")
      for (const trigger of triggers) {
        await expect(trigger.getAttribute("aria-expanded")).toBe("false")
      }
      await expect(itemSelectSpy).toHaveBeenCalledTimes(selectionsBefore)
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false)
    })
  },
}

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * Quem decide o Tab é o `keydown` do PAINEL, no wrapper do DropdownMenu, que o
 * `MenubarMenu` compõe — a lib o deixa para o navegador. Um `keydown`
 * despachado não tem ação padrão: o navegador não move o foco, e as âncoras de
 * foco da lib em volta do portal não entram em jogo. O que a story mede é que o
 * wrapper é dono da tecla. A medição das três entradas (teclado real, o
 * `userEvent.tab()` e este despacho) está no `pressTab` de
 * `dropdown-menu.stories.tsx`.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true }),
  )
}

/**
 * Dois menus da barra, e um submenu no primeiro: o bastante para a barra ter
 * um gatilho fora da ordem de tabulação (`Editar`, `tabindex="-1"`) e para o
 * Tab sair de dentro de um submenu.
 */
function TabBar({ withAfter }: { withAfter: boolean }) {
  return (
    <div className="nds-cluster nds-min-h-80" data-spacing="md" style={{ contain: "layout" }}>
      <Button variant="ghost">Antes</Button>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>{MENUS[0].label}</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>{MENUS[0].items[0].label}</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF</MenubarItem>
                <MenubarItem>CSV</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>{MENUS[1].label}</MenubarTrigger>
          <MenubarContent>
            {MENUS[1].items.map((item) => (
              <MenubarItem key={item.label}>{item.label}</MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {withAfter ? <Button variant="ghost">Depois</Button> : null}
    </div>
  )
}

export const TabLeavesMenubar: Story = {
  // Tab e Shift+Tab, do painel e de dentro do submenu, até o vizinho da BARRA.
  // A barra como última parada fica em `TabAtPageEnd`.
  parameters: { covers: ["functional.item13"], controls: { disable: true } },
  render: () => <TabBar withAfter />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole("menubar")
    const [fileTrigger] = within(bar).getAllByRole("menuitem")
    const before = canvas.getByRole("button", { name: "Antes" })
    const after = canvas.getByRole("button", { name: "Depois" })
    const body = within(document.body)

    const openWithItemFocused = async () => {
      if (fileTrigger.getAttribute("aria-expanded") !== "true") await userEvent.click(fileTrigger)
      const menu = await waitForPortal("menu")
      within(menu).getAllByRole("menuitem")[0].focus()
      await expect(menu.contains(document.activeElement)).toBe(true)
    }

    const openSubmenuWithItemFocused = async () => {
      await openWithItemFocused()
      const subTrigger = within(await waitForPortal("menu")).getByRole("menuitem", {
        name: "Exportar",
      })
      subTrigger.focus()
      await userEvent.keyboard("{ArrowRight}")
      await waitFor(async () => {
        await expect(body.getAllByRole("menu")).toHaveLength(2)
      })
      const submenu = body.getAllByRole("menu")[1]
      within(submenu).getAllByRole("menuitem")[0].focus()
      await expect(submenu.contains(document.activeElement)).toBe(true)
    }

    await step("Tab sai da barra inteira e fecha o menu aberto", async () => {
      await openWithItemFocused()
      pressTab()
      await waitForPortalGone("menu")
      await expect(fileTrigger.getAttribute("aria-expanded")).toBe("false")
      // O próximo ponto é o vizinho da BARRA: o outro gatilho está fora da
      // ordem de tabulação, e o painel vive em portal no fim do documento.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after)
      })
    })

    await step("Shift+Tab sai para o ponto ANTERIOR à barra", async () => {
      // Sem o wrapper, o menu ficava ABERTO com o foco no gatilho: a âncora de
      // foco antes do painel manda o Shift+Tab para ele.
      await openWithItemFocused()
      pressTab(true)
      await waitForPortalGone("menu")
      await expect(fileTrigger.getAttribute("aria-expanded")).toBe("false")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before)
      })
    })

    await step("Tab dentro do submenu fecha o menu INTEIRO", async () => {
      await openSubmenuWithItemFocused()
      pressTab()
      // Nenhum painel sobra aberto — nem o do submenu, nem o do menu da barra.
      await waitForPortalGone("menu")
      await expect(fileTrigger.getAttribute("aria-expanded")).toBe("false")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after)
      })
    })

    await step("Shift+Tab dentro do submenu também fecha tudo", async () => {
      // Sem o wrapper, a lib fechava só o submenu e focava o sub-gatilho.
      await openSubmenuWithItemFocused()
      pressTab(true)
      await waitForPortalGone("menu")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before)
      })
    })
  },
}

/**
 * O gatilho do menu aberto como ÚLTIMA parada da página: não há vizinho para
 * onde levar o foco. O Tab tem de fechar do mesmo jeito, e o foco volta ao
 * gatilho pelo caminho da lib.
 */
export const TabAtPageEnd: Story = {
  parameters: { covers: ["functional.item13"], controls: { disable: true } },
  render: () => <TabBar withAfter={false} />,
  play: async ({ canvasElement, step }) => {
    const bar = within(canvasElement).getByRole("menubar")
    const [fileTrigger] = within(bar).getAllByRole("menuitem")

    await step("Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho", async () => {
      if (fileTrigger.getAttribute("aria-expanded") !== "true") await userEvent.click(fileTrigger)
      const menu = await waitForPortal("menu")
      within(menu).getAllByRole("menuitem")[0].focus()

      pressTab()
      await waitForPortalGone("menu")
      await expect(fileTrigger.getAttribute("aria-expanded")).toBe("false")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(fileTrigger)
      })
    })
  },
}
