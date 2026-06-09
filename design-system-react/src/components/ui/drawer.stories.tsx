import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { Button } from "./button";
import { DrawerDocs } from "@/components/docs/DrawerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  tags: ["autodocs", "disclosure"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(DrawerDocs) },
  },
  argTypes: {
    direction: {
      control: { type: "radio" },
      options: ["bottom", "top", "left", "right"],
      description: "Direção de entrada do painel.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
    dismissible: {
      control: "boolean",
      description: "Permite fechar via ESC, swipe ou clique no overlay.",
    },
    modal: {
      control: "boolean",
      description: "Bloqueia interação com o resto da página quando aberto.",
    },
  },
  args: {
    direction: "bottom",
    defaultOpen: false,
    dismissible: true,
    modal: true,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    onOpenChange: fn(),
  },
  render: (args) => (
    <div style={{ contain: "layout", minHeight: 400, position: "relative" }}>
      <Drawer {...args}>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>
              Atualize seus dados pessoais e foto.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 text-sm text-muted-foreground">
            Conteúdo do drawer.
          </div>
          <DrawerFooter>
            <Button>Confirmar</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole("dialog");
          if (dialog) {
            throw new Error("drawer still open");
          }
        },
        { timeout: 1000 }
      );
    };

    await step("1. Abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir Drawer/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("role", "dialog");
      await expect(dialog).toHaveAccessibleName();
    });

    await step("2. ESC fecha o drawer", async () => {
      await userEvent.keyboard("{Escape}");
      await waitForClose();
    });
  },
};
