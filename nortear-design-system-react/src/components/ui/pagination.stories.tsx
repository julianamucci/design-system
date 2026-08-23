import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { paginationSource } from "./pagination.source";
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
    docs: {
      page: withAutoDocsTab(PaginationDocs),
      // O painel imprimia o invólucro declarado neste arquivo — um componente
      // que não existe fora dele. A transform devolve o que o invólucro faz.
      source: { transform: paginationSource },
    },
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

  // Em <a> não existe `disabled`: o par correto é aria-disabled + tabindex="-1".
  // O `pointer-events-none opacity-50` que morava aqui era do framework
  // utilitário que saiu — inerte. Quem barra o ponteiro e reduz a opacidade é
  // `.nds-button[aria-disabled="true"]`, no CSS compartilhado.
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text={previousText}
            aria-disabled={prevDisabled}
            tabIndex={prevDisabled ? -1 : 0}
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
  parameters: {
    covers: [
      "functional.item1",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: (args) => (
    // key força re-mount quando initialPage muda no painel de controls
    <PaginationDemo
      key={`${args.initialPage}-${args.totalPages}-${String(args.withEllipsis)}`}
      {...args}
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step("A paginação é um landmark de navegação nomeado", async () => {
      // accessibility.item1 — sem nome o leitor de tela anuncia só "navegação",
      // e o axe acusa `landmark-unique` quando a página mostra mais de uma.
      const nav = canvas.getByRole("navigation", { name: "Paginação" });
      await expect(nav).toHaveAttribute("data-slot", "pagination");
      await expect(nav.tagName).toBe("NAV");
      await expect(nav).toHaveClass("nds-pagination");
    });

    await step("Todo controle tem rótulo com contexto", async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta.
      for (let n = 1; n <= Math.min(args.totalPages, 5); n++) {
        const link = canvas.getByRole("link", { name: `Ir para página ${n}` });
        await expect(link).toHaveAttribute("data-slot", "pagination-link");
      }
      await expect(
        canvas.getByRole("link", { name: "Ir para a página anterior" })
      ).toHaveAttribute("data-slot", "pagination-previous");
      await expect(
        canvas.getByRole("link", { name: "Ir para a próxima página" })
      ).toHaveAttribute("data-slot", "pagination-next");
    });

    await step("A página atual é marcada e o extremo é desabilitado", async () => {
      // accessibility.item4
      const active = canvas.getByRole("link", {
        name: `Ir para página ${args.initialPage}`,
      });
      await expect(active).toHaveAttribute("aria-current", "page");
      await expect(active).toHaveAttribute("data-active", "true");

      const prev = canvas.getByRole("link", { name: "Ir para a página anterior" });
      await expect(prev).toHaveAttribute("aria-disabled", "true");
      await expect(prev).toHaveAttribute("tabindex", "-1");
    });

    await step("Clicar numa página avisa quem controla o estado", async () => {
      // functional.item1 — a story guarda a página num state, então o passo
      // VOLTA ao valor inicial no fim: o painel Interactions reexecuta a play no
      // mesmo DOM, e sem isso a segunda rodada partiria de outra página e
      // inverteria as asserções acima.
      const target = args.initialPage === 1 ? 2 : 1;
      const spy = args.onPageChange as unknown as { mockClear: () => void };
      spy.mockClear();
      await userEvent.click(canvas.getByRole("link", { name: `Ir para página ${target}` }));
      await expect(args.onPageChange).toHaveBeenLastCalledWith(target);
      await expect(
        canvas.getByRole("link", { name: `Ir para página ${target}` })
      ).toHaveAttribute("aria-current", "page");

      await userEvent.click(
        canvas.getByRole("link", { name: `Ir para página ${args.initialPage}` })
      );
      await expect(
        canvas.getByRole("link", { name: `Ir para página ${args.initialPage}` })
      ).toHaveAttribute("aria-current", "page");
    });

    await step("Tab percorre os controles na ordem visual", async () => {
      // functional.item4 — a ordem de foco é a do DOM, e o DOM é a ordem em que
      // a faixa é lida: anterior, 1, 2… A lista esperada é DERIVADA do DOM (o
      // controle fora da tabulação é filtrado), senão a asserção só valeria com
      // os controls no valor padrão.
      const esperados = [
        canvas.getByRole("link", { name: "Ir para a página anterior" }),
        canvas.getByRole("link", { name: "Ir para página 1" }),
        canvas.getByRole("link", { name: "Ir para página 2" }),
      ].filter((el) => el.getAttribute("tabindex") !== "-1");

      (document.activeElement as HTMLElement | null)?.blur();
      for (const target of esperados) {
        await userEvent.tab();
        await expect(target).toHaveFocus();
      }
    });
  },
};
