import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";

const meta = {
  title: "UI/Popover/Estados",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Popover: Closed (apenas trigger), Open (defaultOpen), Controlado (open + onOpenChange) e Modal (foco trapeado).",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — defaultOpen=false. Conteúdo desmontado; portal vazio (nenhum role=dialog no DOM).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Conteúdo oculto</PopoverTitle>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Apenas trigger visível, dialog ausente", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      const dialog = screen.queryByRole("dialog");
      await expect(dialog).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Popover aberto via defaultOpen — Content visível com role=dialog. Foco move ao primeiro elemento focável.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Configuracoes de exibição</PopoverTitle>
            <PopoverDescription>
              Ajuste a aparência do conteúdo da página.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Content aberto com role=dialog", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
    });
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham programaticamente.",
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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">Trigger</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Estado controlado</PopoverTitle>
                <PopoverDescription>
                  Aberto/fechado via prop open.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão externo abre o Popover", async () => {
      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
    });

    await step("Botão externo fecha o Popover", async () => {
      const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(closeBtn);
      await waitFor(
        () => {
          const dialog = screen.queryByRole("dialog");
          if (dialog) throw new Error("ainda aberto");
        },
        { timeout: 1500 }
      );
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "modal=true — foco trapeado dentro do Content e scroll do body bloqueado enquanto aberto.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen modal>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir modal</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Popover modal</PopoverTitle>
            <PopoverDescription>
              Interações fora do popover são bloqueadas.
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex justify-end pt-1">
            <Button size="sm">OK</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog aberto em modo modal", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
    });
  },
};
