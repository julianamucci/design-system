import type { Meta, StoryObj } from "@storybook/react-vite"
import { within, expect, userEvent, waitFor } from "storybook/test"
import {
  waitForPortal,
  FOCUS_RULE_GUARDA,
  MENU_RULE_CHILDREN,
} from "@/lib/wait-for-portal"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar"
import {
  selectionMenubarBoxesSource,
  menubarEditorSource,
  menubarChoiceUnicaSource,
  menubarSource,
  menubarSubmenuSource,
} from "./menubar.source"

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
// As stories que TERMINAM com um menu aberto desligam duas regras do axe, e as
// duas descrevem defeitos da lib, não do design system — ver os comentários em
// `wait-for-portal.ts`. A story que termina FECHADA não as desliga: é lá que
// "sem violações no estado padrão" vale inteiro.
const AXE_WITH_MENU_OPEN = {
  config: { rules: [FOCUS_RULE_GUARDA, MENU_RULE_CHILDREN] },
} as const

const SHORTCUTS = [
  { label: "Desfazer", atalho: "Ctrl+Z" },
  { label: "Refazer", atalho: "Ctrl+Shift+Z" },
  { label: "Copiar", atalho: "Ctrl+C" },
] as const

const EXPORTACOES = ["PDF", "CSV", "PNG"] as const

const EXIBICOES = ["Régua", "Barra lateral", "Grade"] as const

const THEMES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Do sistema" },
] as const

const MENUS_EDITOR = ["Arquivo", "Editar", "Exibir", "Ajuda"] as const

const meta = {
  title: "Components/Navigation/Menubar/Compositions",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para WithShortcuts, cuja composição é exatamente a do meta:
      // item com atalho visível à direita do rótulo.
      source: { transform: menubarSource },
      description: {
        component:
          "As composições canônicas de um menu da barra: atalhos visíveis, submenu, alternadores independentes, escolha única e a barra completa de um editor.",
      },
    },
  },
} satisfies Meta<typeof Menubar>

export default meta
type Story = StoryObj<typeof meta>

/** Itens do nível raiz do menu, sem os que já vieram do submenu aberto. */
const menuItems = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))

// Só MECÂNICA no inline. A altura mínima é valor de design e mora na escada:
// `.nds-min-h-90` (22,5rem = 360px) para as molduras altas, `.nds-min-h-50`
// (12,5rem = 200px) para a baixa. Inline a declaração vence a folha e sai do
// tema, da densidade e da escala.
//
// A de 360 vinha de uma CONSTANTE, e por isso o portão não a via — só a de 200,
// escrita no ponto de uso, aparecia no `audit.mjs`.
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
}

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: { a11y: AXE_WITH_MENU_OPEN, covers: ["visual.item2"] },
  render: () => (
    <div className="nds-min-h-90" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            {SHORTCUTS.map((a) => (
              <MenubarItem key={a.label}>
                {a.label}
                <MenubarShortcut>{a.atalho}</MenubarShortcut>
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const items = within(menu).getAllByRole("menuitem")

    await step("Cada item leva o próprio atalho", async () => {
      await expect(items).toHaveLength(SHORTCUTS.length)
      const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]')
      await expect(shortcuts).toHaveLength(SHORTCUTS.length)
    })

    await step("O atalho entra no nome do item, e não fica escondido do leitor", async () => {
      // Sem `aria-hidden`: "Desfazer, Ctrl+Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of items.entries()) {
        await expect(item).toHaveAccessibleName(
          `${SHORTCUTS[i].label} ${SHORTCUTS[i].atalho}`
        )
      }
    })

    await step("O atalho é secundário — cor esmaecida à direita do rótulo", async () => {
      const atalho = menu.querySelector<HTMLElement>(
        '[data-slot="menubar-shortcut"]'
      )!
      await expect(atalho.classList.contains("nds-dropdown-menu-shortcut")).toBe(
        true
      )
      await expect(getComputedStyle(atalho).color).not.toBe(
        getComputedStyle(items[0]).color
      )
    })
  },
}

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    covers: ["functional.item5", "visual.item4"],
    // O submenu é outro par de gatilho e painel DENTRO do painel: uma
    // sub-composição que o snippet do meta esconderia por inteiro.
    docs: { source: { transform: menubarSubmenuSource } },
  },
  render: () => (
    <div className="nds-min-h-90" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar</MenubarSubTrigger>
              <MenubarSubContent>
                {EXPORTACOES.map((e) => (
                  <MenubarItem key={e}>{e}</MenubarItem>
                ))}
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body)
    const menu = await waitForPortal("menu")
    const subTrigger = within(menu).getByRole("menuitem", { name: "Exportar" })

    await step("O sub-gatilho anuncia que abre outro menu", async () => {
      await expect(subTrigger.getAttribute("aria-haspopup")).toBe("menu")
      await expect(subTrigger.getAttribute("data-slot")).toBe(
        "menubar-sub-trigger"
      )
    })

    await step("Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu", async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subTrigger.getAttribute("aria-expanded") !== "true") {
        // Quantas setas até o sub-gatilho depende de onde a lib deixou o
        // realce ao abrir — cravar o número é o que quebra quando muda um
        // item de lugar. Anda até chegar, e falha se não chegar.
        for (let i = 0; i < menuItems(menu).length + 1; i++) {
          if (document.activeElement === subTrigger) break
          await userEvent.keyboard("{ArrowDown}")
        }
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subTrigger)
        })
        await userEvent.keyboard("{ArrowRight}")
      }

      await waitFor(async () => {
        await expect(subTrigger.getAttribute("aria-expanded")).toBe("true")
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(body.getAllByRole("menu")).toHaveLength(2)
      })
    })

    await step("O submenu traz os próprios itens e abre AO LADO do pai", async () => {
      const submenu = body.getAllByRole("menu").find((m) => m !== menu)!
      await expect(within(submenu).getAllByRole("menuitem")).toHaveLength(
        EXPORTACOES.length
      )
      await expect(submenu.getAttribute("data-slot")).toBe("menubar-sub-content")
      // Um submenu que nascesse embaixo cobriria os irmãos do item que o abriu.
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        menu.getBoundingClientRect().left
      )
    })
  },
}

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    covers: ["functional.item7", "visual.item3"],
    // Alternadores dentro de grupo rotulado — peças que o meta não usa, e a
    // independência entre as linhas só aparece com três delas juntas.
    docs: { source: { transform: selectionMenubarBoxesSource } },
  },
  render: () => (
    <div className="nds-min-h-90" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              {EXIBICOES.map((e) => (
                <MenubarCheckboxItem key={e} defaultChecked={e === "Régua"}>
                  {e}
                </MenubarCheckboxItem>
              ))}
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const canvas = within(menu)
    const boxes = canvas.getAllByRole("menuitemcheckbox")

    await step("Cada linha é uma caixa de seleção independente", async () => {
      await expect(boxes).toHaveLength(EXIBICOES.length)
      for (const box of boxes) {
        await expect(box.getAttribute("data-slot")).toBe(
          "menubar-checkbox-item"
        )
        await expect(box.getAttribute("aria-checked")).toBeTruthy()
      }
    })

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia: o menubar era,
      // com o context-menu, o único indicador do sistema sem endereço próprio.
      for (const box of boxes) {
        await expect(
          box.querySelector('[data-slot="menubar-checkbox-item-indicator"]')
        ).not.toBeNull()
      }
    })

    await step("Alternar reflete no estado anunciado e no marcador visual", async () => {
      const target = boxes[EXIBICOES.indexOf("Barra lateral")]
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (target.getAttribute("aria-checked") !== "true") {
        await userEvent.click(target)
      }
      await waitFor(async () => {
        await expect(target.getAttribute("aria-checked")).toBe("true")
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê. Buscar
        // pelo `data-slot` prova de quebra que o atributo ficou no INVÓLUCRO do
        // marcador — se caísse no item ou no nó interno da lib, o tique não
        // estaria dentro dele.
        await expect(
          target.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
        ).not.toBeNull()
      })
    })

    await step("Marcar não fecha o menu — quem marca uma quer marcar a próxima", async () => {
      await expect(document.body.contains(menu)).toBe(true)
      const other = boxes[EXIBICOES.indexOf("Grade")]
      await expect(other.getAttribute("aria-checked")).toBe("false")
    })
  },
}

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    covers: ["accessibility.item5"],
    // Escolha única: quem guarda o valor é o GRUPO, e é essa relação — não o
    // item isolado — que o snippet precisa mostrar.
    docs: { source: { transform: menubarChoiceUnicaSource } },
  },
  render: () => (
    <div className="nds-min-h-90" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Aparência</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup defaultValue="light">
              <MenubarLabel>Tema</MenubarLabel>
              {THEMES.map((t) => (
                <MenubarRadioItem key={t.value} value={t.value}>
                  {t.label}
                </MenubarRadioItem>
              ))}
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const options = within(menu).getAllByRole("menuitemradio")

    await step("O grupo publica escolha única, e só uma opção está marcada", async () => {
      await expect(options).toHaveLength(THEMES.length)
      await expect(
        options.filter((o) => o.getAttribute("aria-checked") === "true")
      ).toHaveLength(1)
    })

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      for (const opcao of options) {
        await expect(
          opcao.querySelector('[data-slot="menubar-radio-item-indicator"]')
        ).not.toBeNull()
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      const marcada = options.find((o) => o.getAttribute("aria-checked") === "true")!
      await expect(
        marcada.querySelector('[data-slot="menubar-radio-item-indicator"] svg')
      ).not.toBeNull()
    })

    await step("Escolher outra opção transfere a marcação", async () => {
      const escuro = options[THEMES.findIndex((t) => t.value === "dark")]
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute("aria-checked") !== "true") {
        await userEvent.click(escuro)
      }
      await waitFor(async () => {
        await expect(escuro.getAttribute("aria-checked")).toBe("true")
      })
      await expect(
        options.filter((o) => o.getAttribute("aria-checked") === "true")
      ).toHaveLength(1)
    })
  },
}

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  parameters: {
    // A barra inteira é o assunto: grupo, separador, ação destrutiva, atalhos e
    // alternadores CONVIVENDO. Cada peça sozinha esconde o custo de arrumar a
    // hierarquia dentro de um painel só.
    docs: { source: { transform: menubarEditorSource } },
  },
  render: () => (
    <div className="nds-min-h-50" style={wrapperStyle}>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Documento</MenubarLabel>
              <MenubarItem>
                Novo <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Ajuda</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Documentação</MenubarItem>
            <MenubarItem>Atalhos de teclado</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const barra = canvas.getByRole("menubar")
    const triggers = within(barra).getAllByRole("menuitem")

    await step("As quatro categorias clássicas convivem na mesma barra", async () => {
      await expect(triggers).toHaveLength(MENUS_EDITOR.length)
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS_EDITOR[i])
      }
    })

    await step("A barra é uma só parada de tabulação, com todos os menus fechados", async () => {
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1)
      for (const trigger of triggers) {
        await expect(trigger.getAttribute("aria-expanded")).toBe("false")
      }
    })
  },
}
