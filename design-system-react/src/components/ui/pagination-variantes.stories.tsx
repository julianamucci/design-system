import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta = {
  title: "UI/Pagination/Variantes",
  tags: ["navigation"],
  component: Pagination,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do PaginationLink: Default (ghost, inativo), Active (outline + aria-current=page) e Directional (Previous/Next com ícone e label).",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Link inativo — variant=\"ghost\" via Button subjacente, sem fundo. Padrão para páginas que não a atual.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 2">
            2
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step(
      "Link sem aria-current e com data-active=false",
      async () => {
        const link = canvas.getByRole("link", { name: /Ir para página 2/i });
        await expect(link).not.toHaveAttribute("aria-current", "page");
        await expect(link).toHaveAttribute("data-active", "false");
      }
    );
  },
};

export const Active: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Página atual — isActive aplica variant=\"outline\" + aria-current=\"page\". Anuncia ao leitor de tela.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" isActive aria-label="Ir para página 1">
            1
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step(
      "Link tem aria-current=page e data-active=true",
      async () => {
        const link = canvas.getByRole("link", { name: /Ir para página 1/i });
        await expect(link).toHaveAttribute("aria-current", "page");
        await expect(link).toHaveAttribute("data-active", "true");
      }
    );
  },
};

export const Directional: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "PaginationPrevious e PaginationNext — link com ícone (ChevronLeft/Right) e label. Texto oculto abaixo de sm; ícone sempre visível.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" text="Anterior" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Previous e Next têm aria-label descritivo", async () => {
      const prev = canvas.getByRole("link", {
        name: /go to previous page/i,
      });
      const next = canvas.getByRole("link", { name: /go to next page/i });
      await expect(prev).toBeVisible();
      await expect(next).toBeVisible();
    });
  },
};
