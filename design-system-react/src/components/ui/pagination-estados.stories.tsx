import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent } from "storybook/test";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta = {
  title: "UI/Pagination/Estados",
  tags: ["navigation"],
  component: Pagination,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Pagination: Default, Hover, ActivePage (página atual), Disabled (Previous na 1ª página) e Focus.",
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
          "Estado padrão — sem fundo, texto em foreground. Cursor pointer ao passar.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 3">
            3
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Link visível e sem aria-current", async () => {
      const link = canvas.getByRole("link", { name: /Ir para página 3/i });
      await expect(link).toBeVisible();
      await expect(link).not.toHaveAttribute("aria-current", "page");
    });
  },
};

export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Hover — fundo bg-accent e texto text-accent-foreground. Estado disparado por hover via userEvent.hover.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 4">
            4
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Hover sobre o link", async () => {
      const link = canvas.getByRole("link", { name: /Ir para página 4/i });
      await userEvent.hover(link);
      await expect(link).toBeVisible();
    });
  },
};

export const ActivePage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Página atual — isActive aplica variant=\"outline\" e aria-current=\"page\". Borda visível para destacar a posição.",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive aria-label="Ir para página 2">
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 3">
            3
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Exatamente um link com aria-current=page", async () => {
      const links = canvas.getAllByRole("link");
      const active = links.filter(
        (el) => el.getAttribute("aria-current") === "page"
      );
      await expect(active.length).toBe(1);
      await expect(active[0]).toHaveTextContent("2");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Previous na primeira página — aria-disabled + pointer-events-none + opacity-50. Como é <a>, não usa atributo disabled (HTML inválido em links).",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Anterior"
            aria-disabled
            tabIndex={-1}
            className="pointer-events-none opacity-50"
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive aria-label="Ir para página 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Previous com aria-disabled=true e tabIndex=-1", async () => {
      const prev = canvas.getByRole("link", { name: /go to previous page/i });
      await expect(prev).toHaveAttribute("aria-disabled", "true");
      await expect(prev).toHaveAttribute("tabindex", "-1");
    });
  },
};

export const Focus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Anel de foco visível — ring-2 ring-ring ao receber foco via Tab. Cumpre WCAG 2.4.7 (Focus Visible).",
      },
    },
  },
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 5">
            5
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Link recebe foco via Tab", async () => {
      const link = canvas.getByRole("link", { name: /Ir para página 5/i });
      link.focus();
      await expect(link).toHaveFocus();
    });
  },
};
