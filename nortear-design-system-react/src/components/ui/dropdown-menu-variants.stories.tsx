import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { waitForPortal, FOCUS_RULE_GUARDA } from "@/lib/wait-for-portal";
import { itemContrast } from "@shared/testing/dropdown-menu-probe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  dropdownMenuItemDestructiveSource,
  dropdownMenuItemDefaultSource,
  dropdownMenuSource,
} from "./dropdown-menu.source";
import { Button } from "./button";

const meta = {
  title: "Primitives/Overlay/DropdownMenu/Variants",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: dropdownMenuSource },
      description: {
        component:
          "As duas ênfases de item. `default` é o item neutro; `destructive` marca a ação " +
          "irreversível com a cor de perigo, e existe para que \"Excluir conta\" não pareça " +
          "\"Editar perfil\".",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Andaime do canvas: o menu abre em portal e o cartão da story precisa
// reservar a altura. O degrau vem da escada `.nds-min-h-*`, e não de um valor
// cravado — inline vence a folha e sairia do tema e da densidade.
const wrapperClass = "nds-min-h-80";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const Default: Story = {
  parameters: {
    covers: ["accessibility.item4", "accessibility.item6"],
    // A forma mínima do menu — lista de ações sem grupo nem rótulo. O snippet
    // do meta traz o grupo, e esconderia justamente o que esta story mostra.
    docs: { source: { transform: dropdownMenuItemDefaultSource } },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Conta</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuracoes</DropdownMenuItem>
          <DropdownMenuItem>Equipe</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const items = within(menu).getAllByRole("menuitem");

    await step("A variante default é escrita no markup", async () => {
      await expect(items).toHaveLength(3);
      for (const item of items) {
        await expect(item).toHaveAttribute("data-variant", "default");
        await expect(item.classList.contains("nds-dropdown-menu-item")).toBe(true);
      }
    });

    await step("O item neutro herda a cor do popup, sem cor semântica", async () => {
      // O item destacado troca de cor de propósito — a comparação tem que ser
      // com um item em repouso, senão ela mede o realce e não a variante.
      const inRest = items.filter((i) => !i.hasAttribute("data-highlighted"));
      await expect(inRest.length).toBeGreaterThan(0);
      await expect(getComputedStyle(inRest[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step("O texto do item atinge 4.5:1 sobre o fundo do popup", async () => {
      // O item de contrato dizia "verificar por axe-core" — verificação que
      // ninguém rodava: o axe do test-runner mede o que está na tela, e comparar
      // nome de token não responde a pergunta. A razão é aritmética. 14px em
      // peso normal é texto normal pela WCAG: o limite é 4.5, não 3.
      const inRest = items.filter((i) => !i.hasAttribute("data-highlighted"));
      const measurement = itemContrast(inRest[0]);
      await expect(measurement).not.toBeNull();
      await expect(measurement!.ratio).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ["visual.item5"],
    // A variante é do ITEM, não da raiz: nenhum control do arquivo a descreve,
    // e o par neutro/destrutivo lado a lado é o que a story afirma.
    docs: { source: { transform: dropdownMenuItemDestructiveSource } },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Conta</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const menu = await waitForPortal("menu");
    const canvas = within(menu);
    const neutro = canvas.getByRole("menuitem", { name: "Perfil" });
    const perigoso = canvas.getByRole("menuitem", { name: "Excluir conta" });

    await step("A variante chega ao markup", async () => {
      await expect(perigoso).toHaveAttribute("data-variant", "destructive");
    });

    await step("A cor do texto distingue a ação irreversível", async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro.
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step("O destaque não depende só da cor: o realce pinta o fundo", async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      // O ponteiro é o que realça: o primitivo marca `data-highlighted`, e é
      // esse atributo (não `:hover`) que o CSS usa.
      const antes = getComputedStyle(perigoso).backgroundColor;
      await userEvent.hover(perigoso);
      await waitFor(async () => {
        await expect(perigoso.hasAttribute("data-highlighted")).toBe(true);
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });
  },
};
