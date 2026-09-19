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
  menubarCheckboxIndeterminateSource,
  menubarControlledSource,
  menubarItemDisabledSource,
  menubarItemCheckedSource,
  menubarPanelScrollsSource,
  menubarSource,
} from "./menubar.source"
import { formaDoIndicador, ehTraco, ehTique } from "@shared/testing/menu-checkbox-indicator"

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
          "Os estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, item bloqueado, item marcado e marcação mista.",
      },
    },
  },
} satisfies Meta<typeof Menubar>

export default meta
type Story = StoryObj<typeof meta>

// Só MECÂNICA no inline. A altura mínima é valor de design e mora na escada,
// em `.nds-min-h-70` (17,5rem = os mesmos 280px): inline ela vencia a folha e
// saía do tema, da densidade e da escala — vinha de uma CONSTANTE, e por isso
// o portão não a via.
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
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
    <div className="nds-min-h-70" style={wrapperStyle}>
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
    <div className="nds-min-h-70" style={wrapperStyle}>
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
    const [file, editar] = within(barra).getAllByRole("menuitem")
    const menu = await waitForPortal("menu")

    await step("O gatilho aberto se distingue dos vizinhos", async () => {
      await expect(file.getAttribute("aria-expanded")).toBe("true")
      await expect(editar.getAttribute("aria-expanded")).toBe("false")
      // O realce do gatilho aberto é fundo, não só cor de texto: o CSS
      // compartilhado casa por `[data-popup-open]` nesta stack.
      await expect(getComputedStyle(file).backgroundColor).not.toBe(
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
    docs: { source: { transform: menubarItemDisabledSource } },
  },
  render: () => (
      <div className="nds-min-h-70" style={wrapperStyle}>
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
  },
  render: () => (
    <div className="nds-min-h-70" style={wrapperStyle}>
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
      // C10: um quadro depois da troca, UM menu aberto e o MESMO nó — um
      // painel no meio do fechamento ainda estaria no documento, e só
      // `document.body.contains` não distinguiria.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const menus = within(document.body).queryAllByRole("menu")
      await expect(menus).toHaveLength(1)
      await expect(menus[0]).toBe(menu)
    })
  },
}

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação no item, de propósito. O que ela declara vale na abertura,
// e o primeiro clique num item misto o resolve para marcado — uma play que
// clicasse aqui mediria outro estado no REPLAY do painel Interactions. Os três
// itens são controlados e sem callback.

export const CheckboxIndeterminate: Story = {
  parameters: {
    a11y: AXE_WITH_MENU_OPEN,
    // O misto é do wrapper (D8): o item de marcação da base-ui é de dois
    // estados, e esta é a story que prova que o terceiro chega ao DOM.
    covers: ["functional.item9"],
    docs: { source: { transform: menubarCheckboxIndeterminateSource } },
  },
  render: () => (
    <div className="nds-min-h-70" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Mostrar na tela</MenubarLabel>
              <MenubarCheckboxItem checked={false} indeterminate>
                Colunas
              </MenubarCheckboxItem>
              <MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>
              <MenubarCheckboxItem checked={false}>Grade</MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const canvas = within(menu)
    const mixed = canvas.getByRole("menuitemcheckbox", { name: "Colunas" })
    const checked = canvas.getByRole("menuitemcheckbox", { name: "Régua" })
    const unchecked = canvas.getByRole("menuitemcheckbox", { name: "Grade" })

    await step("O estado misto é anunciado como misto, e não como marcado", async () => {
      // O item da lib escreve `aria-checked` sozinho; o `"mixed"` vem do
      // wrapper. Os dois outros estados provam que o atributo não sumiu de quem
      // não é misto.
      await expect(mixed.getAttribute("aria-checked")).toBe("mixed")
      await expect(checked.getAttribute("aria-checked")).toBe("true")
      await expect(unchecked.getAttribute("aria-checked")).toBe("false")
    })

    await step("O misto desenha traço; o marcado, tique", async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone.
      const mixedShape = formaDoIndicador(mixed)
      await expect(ehTraco(mixedShape)).toBe(true)
      await expect(ehTique(mixedShape)).toBe(false)
      await expect(ehTique(formaDoIndicador(checked))).toBe(true)
    })

    await step("O traço mora no indicador do item, como o tique", async () => {
      await expect(
        mixed.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
      ).not.toBeNull()
    })

    await step("O desmarcado continua sem glifo nenhum", async () => {
      await expect(formaDoIndicador(unchecked)).toBeNull()
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
    <div className="nds-min-h-70" style={wrapperStyle}>
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
    const [file] = within(barra).getAllByRole("menuitem")

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
      await expect(file.getAttribute("aria-expanded")).toBe("true")
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
      await expect(file.getAttribute("aria-expanded")).toBe("false")
    })
  },
}

// ─── PanelScrolls ─────────────────────────────────────────────────────────────

// Os itens do menu LONGO. São SESSENTA, o mesmo número da medição de 2026-09-18
// que fixou a D17: com eles, numa janela de 900px, o painel desta stack recorta
// em 856px e rola. Menos do que isso e o painel cabe inteiro na altura
// disponível — a asserção abaixo passaria POR ACASO, sem a rolagem existir.
const LONG_ITEMS = Array.from({ length: 60 }, (_, i) => `Ação ${i + 1}`)

/**
 * A EXCEÇÃO DO AXE NÃO ENTRA AQUI, e a premissa dela é que decidiu isso —
 * medida nesta stack em 2026-09-18, e ela contradiz a tabela da D17.
 *
 * A D17 conta que `scrollable-region-focusable` acusa o painel do react e que a
 * saída é desligar a regra declarando a premissa. A regra cobra que uma região
 * com rolagem seja alcançável por teclado, e mede isso procurando algo TABULÁVEL
 * dentro dela. E a base-ui faz foco ITINERANTE pelo livro — `tabIndex: open &&
 * highlighted ? 0 : -1`, em `menu/item/useMenuItemCommonProps.js:39` —, ou seja
 * com um item destacado existe exatamente UM item em `0`, e a regra passa
 * sozinha. Medido por plantio nos dois sentidos: com a exceção retirada a story
 * fecha limpa, e com só ela ligada o axe RODA e acusa outras duas violações, o
 * que descarta "a ferramenta não mediu".
 *
 * O que a D17 mediu, então, foi o painel aberto SEM item destacado (o caminho
 * de ponteiro do C1, em que o foco pousa no painel): ali todos os itens estão em
 * `-1` e a regra acusa de verdade. Esta story termina com um item destacado, e
 * declarar aqui uma exceção que não desliga nada seria portão sem dentes com
 * cara de cobertura.
 *
 * O que fica no lugar dela é a PREMISSA, afirmada no play abaixo, e essa vale
 * independentemente da ferramenta: navegar por tecla num menu longo traz o item
 * focado para dentro da caixa visível. É o que a base-ui resolve com
 * `scrollIntoView({ block: 'nearest' })` em
 * `floating-ui-react/hooks/useListNavigation.js:168`, e é ele que faltaria numa
 * lib que focasse com `preventScroll` — WCAG 2.4.11. Provado por plantio: sem a
 * tecla que move o foco, o passo reprova.
 */
export const PanelScrolls: Story = {
  parameters: {
    // As mesmas duas regras das outras stories que terminam com menu aberto, e
    // nenhuma terceira: ver o bloco acima.
    a11y: AXE_WITH_MENU_OPEN,
    // O menu longo não é o do meta, e é a ALTURA dele que carrega a lição.
    docs: { source: { transform: menubarPanelScrollsSource } },
  },
  render: () => (
    <div className="nds-min-h-70" style={wrapperStyle}>
      <Menubar modal={false}>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            {LONG_ITEMS.map((label) => (
              <MenubarItem key={label}>{label}</MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu")
    const items = within(menu).getAllByRole("menuitem")

    await step("O painel RECORTA na janela em vez de crescer sem fim", async () => {
      // As duas metades, e a segunda é a que tem defeito quando a cadeia de
      // `max-height` quebra: a folha declara `overflow-y: auto`, mas com
      // `max-height: none` não há o que recortar — o painel mede a lista
      // inteira e sai por baixo da janela. Comparar a altura do painel com a da
      // lista é o que separa "rola" de "cabe".
      await expect(items).toHaveLength(LONG_ITEMS.length)
      await expect(getComputedStyle(menu).overflowY).toBe("auto")
      await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight)
      await expect(menu.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight
      )
    })

    await step("A seta traz o item focado para DENTRO da caixa visível", async () => {
      // A premissa da D17, e ela é o que dá sentido a um painel que rola: o
      // menu é operável por teclado porque a rolagem ACOMPANHA o foco
      // itinerante. Sem isso o item focado ficaria FORA da caixa e ninguém
      // veria onde está — WCAG 2.4.11, e é o buraco que uma lib que foca com
      // `preventScroll` e nunca rola deixa aberto em silêncio.
      //
      // Parte do primeiro item e vai ao último pelo TECLADO — nenhum `focus()`
      // à mão no destino, que mediria o `scrollIntoView` do navegador em vez do
      // percurso das teclas.
      items[0].focus()
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0])
      })

      const lastItem = items[items.length - 1]
      await userEvent.keyboard("{End}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(lastItem)
      })

      // Leitura PURA dentro do `waitFor`: as caixas são lidas, nada é escrito
      // no DOM — sonda que mexe no DOM reagenda a si mesma pelo observador de
      // mutação e pendura a aba sem reprovar.
      await waitFor(async () => {
        const box = menu.getBoundingClientRect()
        const target = lastItem.getBoundingClientRect()
        await expect(target.top).toBeGreaterThanOrEqual(box.top - 1)
        await expect(target.bottom).toBeLessThanOrEqual(box.bottom + 1)
      })

      // E a volta: Home traz o primeiro de novo, com a rolagem no topo. Só o
      // End provaria metade — um painel que rolasse e nunca voltasse passaria.
      await userEvent.keyboard("{Home}")
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0])
      })
      await waitFor(async () => {
        const box = menu.getBoundingClientRect()
        const target = items[0].getBoundingClientRect()
        await expect(target.top).toBeGreaterThanOrEqual(box.top - 1)
        await expect(target.bottom).toBeLessThanOrEqual(box.bottom + 1)
      })
    })
  },
}
