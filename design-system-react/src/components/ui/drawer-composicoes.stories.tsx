import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
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
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Drawer/Composicoes",
  tags: ["disclosure"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas do Drawer — Formulário (Label+Input+Footer), Confirmação simples (botões Confirmar/Cancelar) e Scroll (lista longa testando overflow).",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 480,
  position: "relative",
};

async function assertSemanticStructure(step: (label: string, fn: () => Promise<void>) => Promise<unknown>) {
  const body = within(document.body);
  await step("Drawer com role=dialog, Title e Description", async () => {
    const dialog = await waitForPortal("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("role", "dialog");
    await expect(dialog).toHaveAccessibleName();
    await expect(dialog).toHaveAccessibleDescription();
  });

  await step("Footer contém botões de ação", async () => {
    const footer = document.querySelector(
      "[data-slot='drawer-footer']"
    ) as HTMLElement | null;
    await expect(footer).not.toBeNull();
    const buttons = footer?.querySelectorAll("button") ?? [];
    await expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
}

export const ComFormulario: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Drawer com formulário (Label + Input) e DrawerFooter com botões Confirmar/Cancelar. Padrão para edição em mobile.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>
              Atualize seu nome e e-mail.
            </DrawerDescription>
          </DrawerHeader>
          <form className="grid gap-3 px-4 pb-2">
            <div className="grid gap-1.5">
              <Label htmlFor="drawer-name">Nome</Label>
              <Input id="drawer-name" defaultValue="Juliana" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="drawer-email">E-mail</Label>
              <Input id="drawer-email" type="email" defaultValue="juliana@example.com" />
            </div>
          </form>
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
  play: async ({ step }) => {
    await assertSemanticStructure(step as never);
    await step("Inputs do formulário presentes", async () => {
      const body = within(document.body);
      const nameInput = await body.findByLabelText(/Nome/i);
      const emailInput = await body.findByLabelText(/E-mail/i);
      await expect(nameInput).toBeInTheDocument();
      await expect(emailInput).toBeInTheDocument();
    });
  },
};

export const ComConfirmacao: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Drawer simples para confirmar uma ação — Title + Description + Footer com Confirmar/Cancelar.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Excluir item</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Excluir item?</DrawerTitle>
            <DrawerDescription>
              Esta ação não pode ser desfeita.
            </DrawerDescription>
          </DrawerHeader>
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
  play: async ({ step }) => {
    await assertSemanticStructure(step as never);
    await step("Botões Confirmar e Cancelar presentes", async () => {
      const body = within(document.body);
      await expect(body.getByRole("button", { name: /Confirmar/i })).toBeInTheDocument();
      await expect(body.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    });
  },
};

export const ComScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Drawer com conteúdo longo dentro — lista de 30 itens testando overflow vertical (max-height 80vh em direction=bottom).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Ver lista</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Lista de itens</DrawerTitle>
            <DrawerDescription>
              30 itens — role o conteúdo para ver mais.
            </DrawerDescription>
          </DrawerHeader>
          <ul className="px-4 pb-2 overflow-y-auto space-y-2 text-sm">
            {Array.from({ length: 30 }).map((_, i) => (
              <li
                key={i}
                className="border rounded-md px-3 py-2 flex justify-between"
              >
                <span>Item {i + 1}</span>
                <span className="text-muted-foreground">#{i + 1}</span>
              </li>
            ))}
          </ul>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    await assertSemanticStructure(step as never);
    await step("30 itens renderizados na lista", async () => {
      const items = document.querySelectorAll("[data-slot='drawer-content'] li");
      await expect(items.length).toBe(30);
    });
  },
};
