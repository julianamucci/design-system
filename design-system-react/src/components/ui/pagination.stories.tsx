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
import { PaginationDocs } from "@/components/docs/PaginationDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  totalPages: number;
  initialPage: number;
  withEllipsis: boolean;
  previousText: string;
  nextText: string;
  onPageChange: (page: number) => void;
};

const meta = {
  title: "UI/Pagination",
  component: Pagination as never,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(PaginationDocs) },
  },
  argTypes: {
    totalPages: {
      control: { type: "number", min: 1, max: 50 },
      description: "Total de páginas exibidas na paginação.",
    },
    initialPage: {
      control: { type: "number", min: 1, max: 50 },
      description:
        "Página ativa inicial (re-monta a story quando o control muda).",
    },
    withEllipsis: {
      control: "boolean",
      description:
        "Quando true e totalPages > 7, exibe ellipsis condensando páginas distantes.",
    },
    previousText: {
      control: "text",
      description: "Texto do PaginationPrevious (oculto em telas < sm).",
    },
    nextText: {
      control: "text",
      description: "Texto do PaginationNext (oculto em telas < sm).",
    },
    onPageChange: { action: "page-change" },
  },
  args: {
    totalPages: 5,
    initialPage: 1,
    withEllipsis: false,
    previousText: "Anterior",
    nextText: "Próxima",
    onPageChange: fn(),
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

function PaginationDemo({
  totalPages,
  initialPage,
  withEllipsis,
  previousText,
  nextText,
  onPageChange,
}: PlaygroundArgs) {
  const [page, setPage] = useState(initialPage);

  const goTo = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    onPageChange(next);
  };

  const renderPages = () => {
    const items: React.ReactNode[] = [];
    if (!withEllipsis || totalPages <= 7) {
      for (let n = 1; n <= totalPages; n++) {
        items.push(
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
        );
      }
      return items;
    }

    // Janela com ellipsis
    const showLeftEllipsis = page > 3;
    const showRightEllipsis = page < totalPages - 2;
    const windowStart = Math.max(2, page - 1);
    const windowEnd = Math.min(totalPages - 1, page + 1);

    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href="#"
          isActive={page === 1}
          aria-label="Ir para página 1"
          onClick={(e) => {
            e.preventDefault();
            goTo(1);
          }}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    if (showLeftEllipsis) {
      items.push(
        <PaginationItem key="ell-left">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    for (let n = windowStart; n <= windowEnd; n++) {
      items.push(
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
      );
    }
    if (showRightEllipsis) {
      items.push(
        <PaginationItem key="ell-right">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          href="#"
          isActive={page === totalPages}
          aria-label={`Ir para página ${totalPages}`}
          onClick={(e) => {
            e.preventDefault();
            goTo(totalPages);
          }}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
    return items;
  };

  const prevDisabled = page === 1;
  const nextDisabled = page === totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text={previousText}
            aria-disabled={prevDisabled}
            tabIndex={prevDisabled ? -1 : 0}
            className={prevDisabled ? "pointer-events-none opacity-50" : ""}
            onClick={(e) => {
              e.preventDefault();
              goTo(page - 1);
            }}
          />
        </PaginationItem>
        {renderPages()}
        <PaginationItem>
          <PaginationNext
            href="#"
            text={nextText}
            aria-disabled={nextDisabled}
            tabIndex={nextDisabled ? -1 : 0}
            className={nextDisabled ? "pointer-events-none opacity-50" : ""}
            onClick={(e) => {
              e.preventDefault();
              goTo(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export const Playground: Story = {
  render: (args) => (
    // key força re-mount quando initialPage muda no painel de controls
    <PaginationDemo
      key={`${args.initialPage}-${args.totalPages}-${String(args.withEllipsis)}`}
      {...args}
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step("nav com aria-label=pagination está visível", async () => {
      const nav = canvas.getByRole("navigation", { name: /pagination/i });
      await expect(nav).toBeVisible();
    });

    await step(
      "página inicial tem aria-current=page e Previous está aria-disabled",
      async () => {
        const active = canvas.getByRole("link", {
          name: new RegExp(`Ir para página ${args.initialPage}`, "i"),
        });
        await expect(active).toHaveAttribute("aria-current", "page");

        const prev = canvas.getByRole("link", { name: /previous page/i });
        await expect(prev).toHaveAttribute("aria-disabled", "true");
      }
    );

    await step(
      "clique em uma página seguinte dispara onPageChange",
      async () => {
        const target = args.initialPage + 1;
        if (target > args.totalPages) return;
        const link = canvas.getByRole("link", {
          name: new RegExp(`Ir para página ${target}`, "i"),
        });
        await userEvent.click(link);
        await expect(args.onPageChange).toHaveBeenCalledWith(target);
      }
    );
  },
};
