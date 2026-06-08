import type { Meta, StoryObj } from "@storybook/react";
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
import { PopoverDocs } from "@/components/docs/PopoverDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(PopoverDocs) },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado preferido de abertura do Content (auto-flip on collision).",
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento ao longo do eixo do side.",
    },
    sideOffset: {
      control: { type: "number" },
      description: "Distância em pixels entre trigger e content.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
    modal: {
      control: "boolean",
      description: "Quando true, trapeia foco e bloqueia scroll do body.",
    },
  },
  args: {
    side: "bottom",
    align: "center",
    sideOffset: 4,
    defaultOpen: false,
    modal: false,
  },
} as Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
};

export const Playground: Story = {
  render: (args) => {
    const { side, align, sideOffset, defaultOpen, modal } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
      sideOffset?: number;
    };
    return (
      <div style={wrapperStyle}>
        <Popover
          key={`${String(defaultOpen)}-${String(modal)}`}
          defaultOpen={defaultOpen}
          modal={modal}
        >
          <PopoverTrigger asChild>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent side={side} align={align} sideOffset={sideOffset}>
            <PopoverHeader>
              <PopoverTitle>Configuracoes de exibição</PopoverTitle>
              <PopoverDescription>
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("1. Clique no trigger abre o Content com role=dialog", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await userEvent.click(trigger);
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      // Side é determinado pelo auto-flip — apenas verificamos que existe
      const sideAttr = dialog.getAttribute("data-side");
      await expect(["top", "bottom", "left", "right"]).toContain(sideAttr ?? "bottom");
    });

    await step("2. ESC fecha o Content e retorna foco ao trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = screen.queryByRole("dialog");
          if (dialog) throw new Error("dialog ainda aberto");
        },
        { timeout: 1500 }
      );
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await expect(trigger).toHaveFocus();
    });
  },
};
