import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
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

const meta = {
  title: "UI/Drawer/Estados",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Drawer: Fechado (default), Aberto (defaultOpen), Controlado (open + onOpenChange) e NaoDismissible (dismissible=false).",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 400,
  position: "relative",
};

export const Fechado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — apenas o trigger visível. Portal vazio: nenhum dialog renderizado.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
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
    await step("Apenas trigger visível", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toBeVisible();
      const dialog = body.queryByRole("dialog");
      await expect(dialog).toBeNull();
    });
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Drawer aberto via defaultOpen. Overlay ativo, focus trap funcional, ESC e overlay click fecham.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Drawer aberto com role=dialog", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("role", "dialog");
      await expect(dialog).toHaveAccessibleName();
    });
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham o drawer programaticamente.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3" style={wrapperStyle}>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar perfil</DrawerTitle>
                <DrawerDescription>Atualize seus dados.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button onClick={() => setOpen(false)}>Confirmar</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Botão externo abre o drawer", async () => {
      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
    });

    await step("ESC fecha o drawer controlado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        const dialog = body.queryByRole("dialog");
        if (dialog) throw new Error("ainda aberto");
      }, { timeout: 1000 });
    });
  },
};

export const NaoDismissible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "dismissible=false — ESC e overlay click não fecham. Usuário precisa usar o botão DrawerClose explicitamente.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen dismissible={false}>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirmação obrigatória</DrawerTitle>
            <DrawerDescription>
              Use o botão Confirmar para prosseguir.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Confirmar e fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Drawer permanece aberto após ESC", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      await userEvent.keyboard("{Escape}");
      // Aguarda um tick para garantir que ESC não fechou
      await new Promise((r) => setTimeout(r, 200));
      const stillOpen = body.queryByRole("dialog");
      await expect(stillOpen).toBeInTheDocument();
    });
  },
};
