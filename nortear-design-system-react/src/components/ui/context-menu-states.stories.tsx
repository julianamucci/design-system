import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { FOCUS_RULE_GUARDA, waitForPortal } from "@/lib/wait-for-portal";
import { gestoOpen, brilho } from "@shared/testing/context-menu-area";
import { AreaTrigger } from "./context-menu.fixtures";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  contextMenuItemDisabledSource,
  contextMenuItemRecuadoSource,
  contextMenuSource,
} from "./context-menu.source";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Components/Overlay/ContextMenu/States",
  tags: ["overlay"],
  component: ContextMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: contextMenuSource },
      description: {
        component:
          "Estados do ContextMenu: item desabilitado, item recuado, item destrutivo e a paleta escura.",
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

// ─── Item desabilitado ────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ["functional.item9", "accessibility.item6", "accessibility.item9", "visual.item5"],
    // `disabled` é prop do ITEM: sem o override o snippet não mostraria onde a
    // prop entra, que é o assunto da story.
    docs: { source: { transform: contextMenuItemDisabledSource } },
    // Medido na tipagem do primitivo: o item de marcação do menu é de DOIS
    // estados. `checked` é booleano, o payload da mudança é booleano, o estado
    // exposto ao indicador é booleano e os únicos atributos de dado são
    // `data-checked` e `data-unchecked` — não existe terceiro valor. A caixa de
    // seleção avulsa da MESMA lib tem `indeterminate`; o item de menu não.
    coversNotApplicable: {
      "functional.item11":
        "o item de marcação do menu neste primitivo é de dois estados — prop, payload e estado do indicador são booleanos, sem terceiro valor para anunciar como misto",
    },
  },
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem data-testid="primeiro">
            Editar
            <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled data-testid="off">
            Duplicar
          </ContextMenuItem>
          <ContextMenuItem data-testid="ultimo">Renomear</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" disabled data-testid="perigo-off">
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O item desabilitado é anunciado como tal", async () => {
      await gestoOpen(area());
      await expect(target("off").getAttribute("aria-disabled")).toBe("true");
      await expect(target("perigo-off").getAttribute("aria-disabled")).toBe("true");
    });

    await step("Ele está atenuado, e não só marcado", async () => {
      // A cor sozinha não chega a quem não a distingue; a opacidade é o sinal
      // que sobra quando o contraste falha.
      await expect(Number(getComputedStyle(target("off")).opacity)).toBeLessThan(1);
    });

    await step("A seta POUSA no item desabilitado", async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O que prova isso é APERTAR a seta e ver onde o foco pousa. Afirmar a
      // presença de `tabindex` não provaria: o atributo está em todo item,
      // desabilitado ou não, e por isso não reprovaria nunca.
      target("primeiro").focus()
      await userEvent.keyboard("{ArrowDown}")
      await expect(document.activeElement).toBe(target("off"))
    })

    await step("Enter nele não escolhe nada e o menu segue aberto", async () => {
      // Ativar um item desabilitado é o caso raro em que a play pode repetir sem
      // preparo: ele não muda de estado em rodada nenhuma.
      target("off").focus();
      await userEvent.keyboard("{Enter}");
      await expect(await waitForPortal("menu")).toBeVisible();
    });

    await step("O ponteiro também não o alcança", async () => {
      // Aqui a asserção é a folha de estilo, e não um clique: `userEvent` se
      // recusa a clicar em elemento com `pointer-events: none` e derruba a play
      // com erro em vez de falha — o que provaria o mesmo, mas sem dizer o quê.
      await expect(getComputedStyle(target("off")).pointerEvents).toBe("none");
    });
  },
};

// ─── Item recuado ─────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  // `inset` no item e no rótulo do grupo: o recuo alinha com itens que têm
  // indicador à esquerda, e nada disso aparece no snippet do `meta`.
  parameters: {
    docs: { source: { transform: contextMenuItemRecuadoSource } },
  },
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
          <ContextMenuItem data-testid="normal">Editar</ContextMenuItem>
          <ContextMenuItem inset data-testid="recuado">
            Duplicar
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem inset variant="destructive">
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O recuo é geometria, não classe", async () => {
      // O que o recuo entrega é o alinhamento com itens que têm indicador à
      // esquerda. Afirmar o nome da classe não protegeria isso: a classe pode
      // continuar aplicada com a regra vazia.
      await gestoOpen(area());
      const recuo = parseFloat(getComputedStyle(target("recuado")).paddingLeft);
      const normal = parseFloat(getComputedStyle(target("normal")).paddingLeft);
      await expect(recuo).toBeGreaterThan(normal);
    });

    await step("Os dois itens continuam alinhados à direita", async () => {
      // O recuo empurra só a borda esquerda: se empurrasse a caixa inteira, o
      // menu ganharia um degrau à direita.
      const recuo = target("recuado").getBoundingClientRect();
      const normal = target("normal").getBoundingClientRect();
      await expect(Math.abs(recuo.right - normal.right)).toBeLessThan(2);
    });
  },
};

// ─── Item destrutivo ──────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  parameters: {
    covers: ["functional.item10", "visual.item2"],
  },
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem data-testid="normal">
            Editar
            <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" data-testid="perigo">
          Excluir permanentemente
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("O item destrutivo se declara pelo atributo, não só pela cor", async () => {
      // `data-variant` é o que o CSS lê e o que a auditoria compara entre
      // stacks; a cor é consequência dele.
      await gestoOpen(area());
      await expect(target("perigo").getAttribute("data-variant")).toBe("destructive");
      await expect(target("normal").getAttribute("data-variant")).toBe("default");
    });

    await step("E a cor do texto realmente muda", async () => {
      await expect(getComputedStyle(target("perigo")).color).not.toBe(
        getComputedStyle(target("normal")).color,
      );
    });
  },
};

// ─── Paleta escura ────────────────────────────────────────────────────────────

export const DarkPalette: Story = {
  parameters: {
    covers: ["visual.item6"],
    // `themeOverride` é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, sem precisar de limpeza manual que envenenaria a foto vizinha.
    themes: { themeOverride: "dark" },
  },
  render: () => (
    <ContextMenu>
      <AreaTrigger>Clique com o botão direito aqui</AreaTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Editar</ContextMenuItem>
        <ContextMenuItem disabled>Duplicar</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId("area");

    await step("A paleta escura está aplicada no documento", async () => {
      await waitFor(() =>
        expect(document.documentElement.classList.contains("dark")).toBe(true),
      );
    });

    await step("O menu é mais escuro que o texto que ele recebe", async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const menu = await gestoOpen(area());
      const cs = getComputedStyle(menu);
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });
  },
};
