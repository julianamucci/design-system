import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { ContextMenuDocs } from "@/components/docs/ContextMenuDocs";
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
  title: "UI/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Menu contextual ativado por right-click. Suporta itens, checkboxes, radio groups, submenus e shortcuts.",
      },
      page: withAutoDocsTab(ContextMenuDocs),
    },
  },
  argTypes: {
    onOpenChange: {
      control: false,
      description: "Callback disparado ao abrir/fechar o menu.",
    },
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <ContextMenu {...args}>
      <ContextMenuTrigger className="flex items-center justify-center rounded-lg border border-dashed border-border px-10 py-6 text-sm text-muted-foreground select-none">
        Clique com o botão direito aqui
      </ContextMenuTrigger>
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
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByText("Clique com o botão direito aqui");

    await step("right-click abre o menu e dispara onOpenChange", async () => {
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    });

    await step("Escape fecha o menu e dispara onOpenChange(false)", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    });
  },
};
