import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/ContextMenu/Estados",
  tags: ["overlay"],
  component: ContextMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados do ContextMenu: item disabled, item inset e item destrutivo.",
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Trigger wrapper compartilhado ───────────────────────────────────────────

function TriggerArea({ children }: { children: React.ReactNode }) {
  return (
    <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-10 py-6 text-sm text-muted-foreground select-none">
      {children}
    </ContextMenuTrigger>
  );
}

// ─── Item Disabled ────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  name: "Item Disabled",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (disabled)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (disabled)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (disabled)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>
            Duplicar (desabilitado)
          </ContextMenuItem>
          <ContextMenuItem disabled>
            Compartilhar (desabilitado)
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" disabled>
          Excluir (desabilitado)
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ─── Item Inset ───────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  name: "Item Inset",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (inset)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (inset)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (inset)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Grupo com inset</ContextMenuLabel>
          <ContextMenuItem inset>Editar</ContextMenuItem>
          <ContextMenuItem inset>Duplicar</ContextMenuItem>
          <ContextMenuItem inset disabled>
            Arquivar (desabilitado)
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem inset variant="destructive">
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ─── Item Destructive ─────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  name: "Item Destructive",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (destructive)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu com item destrutivo", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (destructive)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (destructive)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir permanentemente
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
