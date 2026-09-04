import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { within, expect, fn, userEvent, waitFor } from "storybook/test"
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
  MenubarTrigger,
} from "./menubar"
import {
  menubarOpenSource,
  menubarControlledSource,
  menubarItemBloqueadoSource,
  menubarItemCheckedSource,
  menubarSource,
} from "./menubar.source"

// As stories que TERMINAM com um menu aberto desligam duas regras do axe, e as
// duas descrevem defeitos da lib, não do design system — ver os comentários em
// `wait-for-portal.ts`. A story que termina FECHADA não as desliga: é lá que
// "sem violações no estado padrão" vale inteiro.
const AXE_WITH_MENU_OPEN = {
  config: { rules: [FOCUS_RULE_GUARDA, MENU_RULE_CHILDREN] },
} as const

const MENUS_FECHADOS = ["Arquivo", "Editar", "Exibir", "Ajuda"] as const

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pelo `play`, e a aba Actions abriria vazia.
const selectionSpy = fn()

const ITEMS_WITH_BLOCK = [
  { label: "Novo", disabled: false },
  { label: "Salvar", disabled: false },
  { label: "Enviar para revisão", disabled: true },
] as const

const meta = {
  title: "Components/Navigation/Menubar/States",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: menubarSource },
      description: {
        component:
          "Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, item bloqueado e item marcado.",
      },
    },
  },
} satisfies Meta<typeof Menubar>

export default meta
type Story = StoryObj<typeof meta>

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
}

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem nada portalizado — e por isso a única em que o
// axe roda com TODAS as regras, inclusive a das âncoras de foco que o resto da
// família precisa desligar. É aqui que "sem violações no estado padrão" vale.

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item2", "visual.item1"],
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        {MENUS_FECHADOS.map((m) => (
          <MenubarMenu key={m}>
            <MenubarTrigger>{m}</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>{m} — first ação</MenubarItem>
              <MenubarItem>{m} — segunda ação</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        ))}
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const barra = canvas.getByRole("menubar")
    const triggers = within(barra).getAllByRole("menuitem")

    await step("A barra publica o papel e a orientação", async () => {
      await expect(barra.getAttribute("data-slot")).toBe("menubar")
      await expect(barra.getAttribute("aria-orientation")).toBe("horizontal")
      await expect(triggers).toHaveLength(MENUS_FECHADOS.length)
    })

    await step("Fechado é ausência: nenhum painel existe no DOM", async () => {
      for (const trigger of triggers) {
        await expect(trigger.getAttribute("aria-expanded")).toBe("false")
      }
      // Portal desmontado, não escondido: um painel só oculto continuaria
      // sendo lido por leitor de tela e encontrável pela busca da página.
      await expect(within(document.body).queryAllByRole("menu")).toHaveLength(0)
    })
  },
}

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    covers: ["accessibility.item4"],
    // `defaultOpen` mora no MENU, não na barra — é o assunto desta story, e
    // nenhum arg do meta o descreve.
    docs: { source: { transform: menubarOpenSource } },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const barra = canvas.getByRole("menubar")
    const [arquivo, editar] = within(barra).getAllByRole("menuitem")
    const menu = await waitForPortal("menu")

    await step("O gatilho aberto se distingue dos vizinhos", async () => {
      await expect(arquivo.getAttribute("aria-expanded")).toBe("true")
      await expect(editar.getAttribute("aria-expanded")).toBe("false")
      // O realce do gatilho aberto é fundo, não só cor de texto: o CSS
      // compartilhado casa por `[data-popup-open]` nesta stack.
      await expect(getComputedStyle(arquivo).backgroundColor).not.toBe(
        getComputedStyle(editar).backgroundColor
      )
    })

    await step("O painel é um menu de verdade, ancorado abaixo do gatilho", async () => {
      await expect(menu.getAttribute("data-slot")).toBe("menubar-content")
      await waitFor(async () => {
        // O positioner mede DEPOIS de o painel entrar no DOM: no primeiro
        // quadro o retângulo ainda é (0,0), e ler daí é corrida.
        const barRect = barra.getBoundingClientRect()
        const menuRect = menu.getBoundingClientRect()
        await expect(menuRect.top).toBeGreaterThanOrEqual(barRect.bottom - 1)
      })
    })
  },
}

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ["accessibility.item8"],
    a11y: AXE_WITH_MENU_OPEN,
    // O `disabled` de um item só existe nesta composição; o snippet do meta
    // mostraria três itens todos disponíveis.
    docs: { source: { transform: menubarItemBloqueadoSource } },
  },
  render: () => (
      <div style={wrapperStyle}>
        <Menubar modal={false}>
          <MenubarMenu defaultOpen>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              {ITEMS_WITH_BLOCK.map((i) => (
                <MenubarItem
                  key={i.label}
                  disabled={i.disabled}
                  onClick={() => selectionSpy(i.label)}
                >
                  {i.label}
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
    const bloqueado = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled)]

    await step("O item bloqueado se anuncia como tal", async () => {
      await expect(items).toHaveLength(ITEMS_WITH_BLOCK.length)
      await expect(bloqueado.getAttribute("aria-disabled")).toBe("true")
      // `aria-disabled`, e não o atributo `disabled`: o item continua
      // alcançável pela seta, para ser ANUNCIADO como indisponível em vez de
      // sumir sem explicação de quem navega por teclado.
      await expect(bloqueado.hasAttribute("disabled")).toBe(false)
    })

    await step("O bloqueio é visível sem depender de cor", async () => {
      await expect(Number(getComputedStyle(bloqueado).opacity)).toBeLessThan(
        Number(getComputedStyle(items[0]).opacity)
      )
    })

    await step("A seta POUSA no item bloqueado", async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O comentário do primeiro passo já dizia "continua alcançável pela seta",
      // e nada aqui apertava tecla nenhuma — `aria-disabled` sozinho não prova
      // percurso. Este passo é quem cobra a promessa.
      const previous = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled) - 1]
      previous.focus()
      await userEvent.keyboard("{ArrowDown}")
      await expect(document.activeElement).toBe(bloqueado)
    })

    await step("Escolher o item bloqueado não executa nada", async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 })
      await expect(selectionSpy).not.toHaveBeenCalledWith(
        bloqueado.textContent?.trim()
      )
    })
  },
}

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    covers: ["functional.item7"],
    // Item de marcação dentro de grupo rotulado: três peças que o snippet do
    // meta não tem, e o par marcado/desmarcado é justamente o que se ensina.
    docs: { source: { transform: menubarItemCheckedSource } },
    // Medido na tipagem do primitivo: o item de marcação do menu é de DOIS
    // estados. `checked` é booleano, o payload da mudança é booleano, o estado
    // exposto ao indicador é booleano e os únicos atributos de dado são
    // `data-checked` e `data-unchecked` — não existe terceiro valor. A caixa de
    // seleção avulsa da MESMA lib tem `indeterminate`; o item de menu não.
    // Sem terceiro estado não há o que anunciar como misto nem o que desenhar
    // como traço, e declarar cobertura aqui faria o auditor mentir.
    coversNotApplicable: {
      "functional.item9":
        "o item de marcação do menu neste primitivo é de dois estados — prop, payload e estado do indicador são booleanos, sem terceiro valor para anunciar como misto",
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem defaultChecked={false}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const canvas = within(menu)
    const regua = canvas.getByRole("menuitemcheckbox", { name: "Régua" })
    const grid = canvas.getByRole("menuitemcheckbox", { name: "Grade" })

    await step("O estado inicial chega marcado ao markup", async () => {
      await expect(regua.getAttribute("aria-checked")).toBe("true")
      await expect(grid.getAttribute("aria-checked")).toBe("false")
    })

    await step("O marcado mostra o tique; o desmarcado, não", async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve.
      const tique = (item: HTMLElement) =>
        item.querySelector(".nds-dropdown-menu-item-indicator svg") !== null
      await expect(tique(regua)).toBe(true)
      await expect(tique(grid)).toBe(false)
    })

    await step("Desmarcar o que estava marcado mantém o menu aberto", async () => {
      // Idempotente: o clique só acontece com a caixa ainda marcada.
      if (regua.getAttribute("aria-checked") !== "false") {
        await userEvent.click(regua)
      }
      await waitFor(async () => {
        await expect(regua.getAttribute("aria-checked")).toBe("false")
      })
      await expect(document.body.contains(menu)).toBe(true)
    })
  },
}

// ─── ControlledOpen ───────────────────────────────────────────────────────────
//
// O menu CONTROLADO: quem consome guarda a abertura, e a barra obedece.
//
// Nesta stack o par mora no MENU, não na barra — `open` e `onOpenChange` no
// `MenubarMenu` —, e é isso que permite controlar um menu deixando os vizinhos
// se governarem sozinhos. É a forma que `props.extensibilityCode` ensina, e até
// aqui nenhuma story a exercitava: o snippet prometia uma prop que o design
// system não demonstrava.
//
// A story prova os DOIS sentidos, e o segundo é o que importa. Menu controlado
// sem o retorno ligado abre e nunca mais fecha, porque a lib PEDE o fechamento e
// não há quem atenda — armadilha de teclado, WCAG 2.1.2. Por isso o último passo
// aperta Escape e cobra que o painel suma E que o estado externo tenha
// acompanhado.

const CONTROLLED_ITEMS = ["Novo", "Abrir"] as const

/** O estado vive AQUI, fora da barra — é esse o assunto da story. */
function MenubarWithExternalState() {
  const [open, setOpen] = useState(false)

  return (
    <div style={wrapperStyle}>
      <div className="nds-stack" data-spacing="sm">
        <div className="nds-cluster" data-align="center">
          <button
            type="button"
            className="nds-button nds-button-outline nds-button-sm"
            data-testid="external-open"
            onClick={() => setOpen(true)}
          >
            Abrir Arquivo
          </button>
          <span data-testid="external-state">{open ? "aberto" : "fechado"}</span>
        </div>

        <Menubar modal={false}>
          <MenubarMenu open={open} onOpenChange={(next) => setOpen(next)}>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              {CONTROLLED_ITEMS.map((label) => (
                <MenubarItem key={label}>{label}</MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  )
}

export const ControlledOpen: Story = {
  parameters: {
    // Sem `args` próprios: sem isto o painel Controls abre vazio e a aba
    // Actions lista espião que esta story não usa.
    controls: { disable: true },
    actions: { disable: true },
    // A barra do meta é fechada e não controlada; o par `open`/`onOpenChange` é
    // justamente o que esta story ensina.
    docs: { source: { transform: menubarControlledSource } },
  },
  render: () => <MenubarWithExternalState />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const externalControl = canvas.getByTestId("external-open")
    const readout = canvas.getByTestId("external-state")
    const barra = canvas.getByRole("menubar")
    const [arquivo] = within(barra).getAllByRole("menuitem")

    // O painel Interactions reexecuta a `play` no MESMO DOM, sem remontar: este
    // passo não SUPÕE o estado inicial, ele o estabelece.
    await step("Precondição: o estado externo começa fechado", async () => {
      if (readout.textContent?.trim() !== "fechado") {
        await userEvent.keyboard("{Escape}")
      }
      await waitFor(async () => {
        await expect(readout.textContent?.trim()).toBe("fechado")
      })
      await expect(within(document.body).queryAllByRole("menu")).toHaveLength(0)
    })

    await step("Quem abre o menu é o estado externo, não o gatilho", async () => {
      await userEvent.click(externalControl)
      const menu = await waitForPortal("menu")
      await expect(readout.textContent?.trim()).toBe("aberto")
      await expect(arquivo.getAttribute("aria-expanded")).toBe("true")
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(
        CONTROLLED_ITEMS.length
      )
    })

    await step("Fechar pelo teclado devolve a mudança ao estado externo", async () => {
      await userEvent.keyboard("{Escape}")
      await waitFor(async () => {
        // Leitura PURA dentro do `waitFor`: sonda que mexe no DOM reagenda a si
        // mesma pelo observador de mutação e pendura a aba sem reprovar.
        await expect(within(document.body).queryAllByRole("menu")).toHaveLength(0)
      })
      // O retorno ligado é o que separa "controlado" de armadilha de teclado:
      // sem ele o estado externo continuaria dizendo "aberto" — e o painel nem
      // teria saído do DOM.
      await expect(readout.textContent?.trim()).toBe("fechado")
      await expect(arquivo.getAttribute("aria-expanded")).toBe("false")
    })
  },
}
