import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn, userEvent, within, expect } from "storybook/test";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta = {
  title: "UI/Pagination/Composicoes",
  tags: ["navigation"],
  component: Pagination,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: Simples (5 páginas), ComEllipsis (12 páginas), UltimaPagina (Next desabilitado), AsButton (sem URLs reais) e ComOnPageChange (controlada com analytics).",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simples: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Paginação simples com 5 páginas, página 1 ativa e Previous desabilitado. Caso mais comum em listagens curtas.",
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
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink
              href="#"
              isActive={n === 1}
              aria-label={`Ir para página ${n}`}
            >
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="#" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("5 páginas numeradas + Previous + Next", async () => {
      const numLinks = canvas.getAllByRole("link", {
        name: /Ir para página/i,
      });
      await expect(numLinks.length).toBe(5);
    });
  },
};

export const ComEllipsis: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Lista longa (12 páginas) com janela ao redor da atual e ellipsis tipográfico (…) condensando trechos distantes.",
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
          <PaginationLink href="#" aria-label="Ir para página 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 5">
            5
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive aria-label="Ir para página 6">
            6
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 7">
            7
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 12">
            12
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ step }) => {
    await step("Dois ellipsis renderizados com aria-hidden", async () => {
      const ellipsis = document.querySelectorAll(
        "[data-slot='pagination-ellipsis']"
      );
      await expect(ellipsis.length).toBe(2);
      ellipsis.forEach((el) => {
        expect(el.getAttribute("aria-hidden")).toBe("true");
      });
    });
  },
};

export const UltimaPagina: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Última página (10/10) ativa e Next desabilitado via aria-disabled + pointer-events-none.",
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
          <PaginationLink href="#" aria-label="Ir para página 8">
            8
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" aria-label="Ir para página 9">
            9
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive aria-label="Ir para página 10">
            10
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            text="Próxima"
            aria-disabled
            tabIndex={-1}
            className="pointer-events-none opacity-50"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Next está aria-disabled=true", async () => {
      const next = canvas.getByRole("link", { name: /go to next page/i });
      await expect(next).toHaveAttribute("aria-disabled", "true");
    });
  },
};

export const AsButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Em SPAs sem URLs reais por página, renderize PaginationLink sem href e use onClick — para a11y, role=button via type prop seria ideal; aqui mantemos <a> para herdar estilos, mas com role=\"button\" explícito.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [page, setPage] = useState(2);
      const onClick = fn();
      return (
        <Pagination>
          <PaginationContent>
            {[1, 2, 3].map((n) => (
              <PaginationItem key={n}>
                <PaginationLink
                  role="button"
                  isActive={page === n}
                  aria-label={`Ir para página ${n}`}
                  onClick={() => {
                    onClick(n);
                    setPage(n);
                  }}
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Links com role=button respondem a clique", async () => {
      const buttons = canvas.getAllByRole("button");
      await expect(buttons.length).toBe(3);
      await userEvent.click(buttons[2]);
      await expect(buttons[2]).toHaveAttribute("aria-current", "page");
    });
  },
};

export const ComOnPageChange: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Composição controlada com onPageChange — ideal para integrar com tracking de analytics (page_change) e estado de URL externa.",
      },
    },
  },
  render: () => {
    const Demo = () => {
      const [page, setPage] = useState(1);
      const total = 4;
      const onPageChange = fn();
      const goTo = (next: number) => {
        if (next < 1 || next > total) return;
        setPage(next);
        onPageChange(next);
      };
      return (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            Página atual: {page} / {total}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Anterior"
                  aria-disabled={page === 1}
                  tabIndex={page === 1 ? -1 : 0}
                  className={
                    page === 1 ? "pointer-events-none opacity-50" : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page - 1);
                  }}
                />
              </PaginationItem>
              {[1, 2, 3, 4].map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink
                    href="#"
                    isActive={page === n}
                    aria-label={`Ir para página ${n}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(n);
                    }}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Próxima"
                  aria-disabled={page === total}
                  tabIndex={page === total ? -1 : 0}
                  className={
                    page === total ? "pointer-events-none opacity-50" : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      );
    };
    return <Demo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Click em Next muda a página atual", async () => {
      const next = canvas.getByRole("link", { name: /go to next page/i });
      await userEvent.click(next);
      const active = canvas
        .getAllByRole("link")
        .find((el) => el.getAttribute("aria-current") === "page");
      await expect(active).toHaveTextContent("2");
    });
  },
};
