import type { Meta, StoryObj } from "@storybook/react-vite"
import { within, expect, userEvent, waitFor } from "storybook/test"
import {
  waitForPortal,
  REGRA_GUARDA_DE_FOCO,
  REGRA_FILHOS_DE_MENU,
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

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
// As stories que TERMINAM com um menu aberto desligam duas regras do axe, e as
// duas descrevem defeitos da lib, não do design system — ver os comentários em
// `wait-for-portal.ts`. A story que termina FECHADA não as desliga: é lá que
// "sem violações no estado padrão" vale inteiro.
const AXE_COM_MENU_ABERTO = {
  config: { rules: [REGRA_GUARDA_DE_FOCO, REGRA_FILHOS_DE_MENU] },
} as const

const ATALHOS = [
  { label: "Desfazer", atalho: "⌘Z" },
  { label: "Refazer", atalho: "⇧⌘Z" },
  { label: "Copiar", atalho: "⌘C" },
] as const

const EXPORTACOES = ["PDF", "CSV", "PNG"] as const

const EXIBICOES = ["Régua", "Barra lateral", "Grade"] as const

const TEMAS = [
  { valor: "light", label: "Claro" },
  { valor: "dark", label: "Escuro" },
  { valor: "system", label: "Do sistema" },
] as const

const MENUS_EDITOR = ["Arquivo", "Editar", "Exibir", "Ajuda"] as const

const meta = {
  title: "UI/Menubar/Compositions",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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
const itensDoMenu = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 360,
  position: "relative",
}

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: { a11y: AXE_COM_MENU_ABERTO, covers: ["visual.item2"] },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            {ATALHOS.map((a) => (
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
    const itens = within(menu).getAllByRole("menuitem")

    await step("Cada item leva o próprio atalho", async () => {
      await expect(itens).toHaveLength(ATALHOS.length)
      const atalhos = menu.querySelectorAll('[data-slot="menubar-shortcut"]')
      await expect(atalhos).toHaveLength(ATALHOS.length)
    })

    await step("O atalho entra no nome do item, e não fica escondido do leitor", async () => {
      // Sem `aria-hidden`: "Desfazer, ⌘Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of itens.entries()) {
        await expect(item).toHaveAccessibleName(
          `${ATALHOS[i].label} ${ATALHOS[i].atalho}`
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
        getComputedStyle(itens[0]).color
      )
    })
  },
}

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    a11y: AXE_COM_MENU_ABERTO,
    covers: ["functional.item5", "visual.item4"],
  },
  render: () => (
    <div style={wrapperStyle}>
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
    const corpo = within(document.body)
    const menu = await waitForPortal("menu")
    const subGatilho = within(menu).getByRole("menuitem", { name: "Exportar" })

    await step("O sub-gatilho anuncia que abre outro menu", async () => {
      await expect(subGatilho.getAttribute("aria-haspopup")).toBe("menu")
      await expect(subGatilho.getAttribute("data-slot")).toBe(
        "menubar-sub-trigger"
      )
    })

    await step("Seta Baixo alcança o sub-gatilho; Seta Direita abre o submenu", async () => {
      // Idempotente: só navega e abre quando ainda está fechado.
      if (subGatilho.getAttribute("aria-expanded") !== "true") {
        // Quantas setas até o sub-gatilho depende de onde a lib deixou o
        // realce ao abrir — cravar o número é o que quebra quando muda um
        // item de lugar. Anda até chegar, e falha se não chegar.
        for (let i = 0; i < itensDoMenu(menu).length + 1; i++) {
          if (document.activeElement === subGatilho) break
          await userEvent.keyboard("{ArrowDown}")
        }
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subGatilho)
        })
        await userEvent.keyboard("{ArrowRight}")
      }

      await waitFor(async () => {
        await expect(subGatilho.getAttribute("aria-expanded")).toBe("true")
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(corpo.getAllByRole("menu")).toHaveLength(2)
      })
    })

    await step("O submenu traz os próprios itens e abre AO LADO do pai", async () => {
      const submenu = corpo.getAllByRole("menu").find((m) => m !== menu)!
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
  parameters: { a11y: AXE_COM_MENU_ABERTO, covers: ["functional.item7", "visual.item3"] },
  render: () => (
    <div style={wrapperStyle}>
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
    const caixas = canvas.getAllByRole("menuitemcheckbox")

    await step("Cada linha é uma caixa de seleção independente", async () => {
      await expect(caixas).toHaveLength(EXIBICOES.length)
      for (const caixa of caixas) {
        await expect(caixa.getAttribute("data-slot")).toBe(
          "menubar-checkbox-item"
        )
        await expect(caixa.getAttribute("aria-checked")).toBeTruthy()
      }
    })

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia: o menubar era,
      // com o context-menu, o único indicador do sistema sem endereço próprio.
      for (const caixa of caixas) {
        await expect(
          caixa.querySelector('[data-slot="menubar-checkbox-item-indicator"]')
        ).not.toBeNull()
      }
    })

    await step("Alternar reflete no estado anunciado e no marcador visual", async () => {
      const alvo = caixas[EXIBICOES.indexOf("Barra lateral")]
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (alvo.getAttribute("aria-checked") !== "true") {
        await userEvent.click(alvo)
      }
      await waitFor(async () => {
        await expect(alvo.getAttribute("aria-checked")).toBe("true")
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê. Buscar
        // pelo `data-slot` prova de quebra que o atributo ficou no INVÓLUCRO do
        // marcador — se caísse no item ou no nó interno da lib, o tique não
        // estaria dentro dele.
        await expect(
          alvo.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
        ).not.toBeNull()
      })
    })

    await step("Marcar não fecha o menu — quem marca uma quer marcar a próxima", async () => {
      await expect(document.body.contains(menu)).toBe(true)
      const outra = caixas[EXIBICOES.indexOf("Grade")]
      await expect(outra.getAttribute("aria-checked")).toBe("false")
    })
  },
}

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: { a11y: AXE_COM_MENU_ABERTO, covers: ["accessibility.item5"] },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Aparência</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup defaultValue="light">
              <MenubarLabel>Tema</MenubarLabel>
              {TEMAS.map((t) => (
                <MenubarRadioItem key={t.valor} value={t.valor}>
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
    const opcoes = within(menu).getAllByRole("menuitemradio")

    await step("O grupo publica escolha única, e só uma opção está marcada", async () => {
      await expect(opcoes).toHaveLength(TEMAS.length)
      await expect(
        opcoes.filter((o) => o.getAttribute("aria-checked") === "true")
      ).toHaveLength(1)
    })

    await step("O indicador publica o data-slot do seu tipo de item", async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      for (const opcao of opcoes) {
        await expect(
          opcao.querySelector('[data-slot="menubar-radio-item-indicator"]')
        ).not.toBeNull()
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      const marcada = opcoes.find((o) => o.getAttribute("aria-checked") === "true")!
      await expect(
        marcada.querySelector('[data-slot="menubar-radio-item-indicator"] svg')
      ).not.toBeNull()
    })

    await step("Escolher outra opção transfere a marcação", async () => {
      const escuro = opcoes[TEMAS.findIndex((t) => t.valor === "dark")]
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
        opcoes.filter((o) => o.getAttribute("aria-checked") === "true")
      ).toHaveLength(1)
    })
  },
}

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 200 }}>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Documento</MenubarLabel>
              <MenubarItem>
                Novo <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Abrir <MenubarShortcut>⌘O</MenubarShortcut>
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
              Desfazer <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut>
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
    const gatilhos = within(barra).getAllByRole("menuitem")

    await step("As quatro categorias clássicas convivem na mesma barra", async () => {
      await expect(gatilhos).toHaveLength(MENUS_EDITOR.length)
      for (const [i, gatilho] of gatilhos.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS_EDITOR[i])
      }
    })

    await step("A barra é uma só parada de tabulação, com todos os menus fechados", async () => {
      await expect(gatilhos.filter((g) => g.tabIndex === 0)).toHaveLength(1)
      for (const gatilho of gatilhos) {
        await expect(gatilho.getAttribute("aria-expanded")).toBe("false")
      }
    })
  },
}
