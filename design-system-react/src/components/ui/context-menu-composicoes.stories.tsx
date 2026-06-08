import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/ContextMenu/Composicoes",
  tags: ["overlay"],
  component: ContextMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do ContextMenu: com checkbox, radio group, submenu e shortcuts.",
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

// ─── Com Shortcut ─────────────────────────────────────────────────────────────

export const ComShortcut: Story = {
  name: "Com Shortcut",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado e visível", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (atalhos)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (atalhos)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (atalhos)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuItem>
          Editar
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Desfazer
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Refazer
          <ContextMenuShortcut>⌘⇧Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ─── Com Checkbox ─────────────────────────────────────────────────────────────

function CheckboxDemo() {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);

  return (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (checkbox)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={showGrid}
            onCheckedChange={setShowGrid}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={showRulers}
            onCheckedChange={setShowRulers}
          >
            Mostrar réguas
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={snapToGrid}
            onCheckedChange={setSnapToGrid}
          >
            Encaixar na grade
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const ComCheckbox: Story = {
  name: "Com Checkbox",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (checkbox)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (checkbox)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => <CheckboxDemo />,
};

// ─── Com Radio ────────────────────────────────────────────────────────────────

function RadioDemo() {
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (radio)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
            <ContextMenuRadioItem value="50">50%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="200">200%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const ComRadio: Story = {
  name: "Com Radio Group",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (radio)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (radio)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => <RadioDemo />,
};

// ─── Com Submenu ──────────────────────────────────────────────────────────────

export const ComSubmenu: Story = {
  name: "Com Submenu",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (submenu)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (submenu)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (submenu)</TriggerArea>
      <ContextMenuContent>
        <ContextMenuItem>
          Editar
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Duplicar</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Por e-mail</ContextMenuItem>
            <ContextMenuItem>Por link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ─── Composição Completa ──────────────────────────────────────────────────────

function CompleteDemo() {
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState("100");

  return (
    <ContextMenu>
      <TriggerArea>Clique com o botão direito (completo)</TriggerArea>
      <ContextMenuContent className="min-w-52">
        <ContextMenuGroup>
          <ContextMenuLabel>Ações</ContextMenuLabel>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Por e-mail</ContextMenuItem>
              <ContextMenuItem>Por link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={showGrid}
            onCheckedChange={setShowGrid}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const ComposicaoCompleta: Story = {
  name: "Composição Completa",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("trigger renderizado", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (completo)");
      await expect(trigger).toBeInTheDocument();
    });
    await step("right-click abre o menu", async () => {
      const trigger = canvas.getByText("Clique com o botão direito (completo)");
      await userEvent.pointer({ target: trigger, keys: "[MouseRight]" });
    });
  },
  render: () => <CompleteDemo />,
};
