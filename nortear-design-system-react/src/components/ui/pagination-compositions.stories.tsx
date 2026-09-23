import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, within, expect, fireEvent } from "storybook/test";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import {
  paginationControladaSource,
  paginationEllipsisSource,
  tablePaginationFooterSource,
  paginationSource,
  paginationLastPageSource,
} from "./pagination.source";

const meta = {
  title: "Components/Navigation/Pagination/Compositions",
  tags: ["navigation"],
  component: Pagination,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          "Composições típicas: Simple (5 páginas), WithEllipsis (12 páginas), LastPage (Próxima desabilitado), Controlled (estado externo) e CompleteTable (rodapé de tabela).",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

export const Simple: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "Total pequeno: todos os números aparecem em sequência, sem reticências. Previous e Next nas pontas. É a composição COM endereço de página: cada controle é um <a> de verdade, que abre em nova aba e é indexável.",
      },
    },
  },
  // A tag segue a ROTA, e esta é a faixa que tem uma: com endereço de página o
  // controle é `<a>`. O extremo desabilitado aponta para a página ATUAL — um
  // endereço que existe —, e continua marcado pelo par que um `<a>` aceita:
  // `aria-disabled` mais a saída da ordem de tabulação.
  render: () => (
    <Pagination aria-label="Paginação simples">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" text="Anterior" disabled />
        </PaginationItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink
              href={`?page=${n}`}
              isActive={n === 1}
              aria-label={`Ir para página ${n}`}
            >
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="?page=2" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A faixa mostra todos os números, sem reticências", async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numbered = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numbered.length).toBe(5);
      await expect([...numbered].map((l) => l.textContent?.trim())).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length
      ).toBe(0);
    });

    await step("Com endereço de página, todo controle é um link de verdade", async () => {
      // A tag segue a rota: é o que faz "abrir em nova aba" e indexação
      // funcionarem. Sem endereço o mesmo controle sairia `<button>`.
      const segunda = canvas.getByRole("link", { name: "Ir para página 2" });
      await expect(segunda.tagName).toBe("A");
      await expect(segunda).toHaveAttribute("href", "?page=2");
    });

    await step("A primeira página é a atual e Anterior está desabilitado", async () => {
      await expect(
        canvas.getByRole("link", { name: "Ir para página 1" })
      ).toHaveAttribute("aria-current", "page");
      // Em `<a>` não existe `disabled`: o par é `aria-disabled` mais a saída da
      // tabulação, e é ele que continua valendo quando há rota.
      const previous = canvas.getByRole("link", { name: "Ir para a página anterior" });
      await expect(previous).toHaveAttribute("aria-disabled", "true");
      await expect(previous).toHaveAttribute("tabindex", "-1");
    });
  },
};

export const WithEllipsis: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A janela de páginas visíveis é o assunto: o snippet do meta enfileira
      // todos os números e nunca chegaria às reticências.
      source: { transform: paginationEllipsisSource },
      description: {
        story:
          "Lista longa: primeira, última, atual e vizinhas ficam visíveis; o resto vira reticências decorativas.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação com reticências">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious text="Anterior" />
        </PaginationItem>
        {[1, "ellipsis-left", 5, 6, 7, "ellipsis-right", 12].map((trecho) =>
          typeof trecho === "number" ? (
            <PaginationItem key={trecho}>
              <PaginationLink
                isActive={trecho === 6}
                aria-label={`Ir para página ${trecho}`}
              >
                {trecho}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={trecho}>
              <PaginationEllipsis />
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("As páginas distantes colapsam em reticências", async () => {
      // visual.item2
      const reticencias = canvasElement.querySelectorAll(
        '[data-slot="pagination-ellipsis"]'
      );
      await expect(reticencias.length).toBe(2);
      for (const item of reticencias) {
        // notes.item3: o caractere tipográfico, não três pontos e não um ícone.
        await expect(item.textContent?.trim()).toBe("…");
        await expect(item).toHaveClass("nds-pagination-ellipsis");
      }
    });

    await step("As reticências não são lidas nem tabuladas", async () => {
      const reticencias = canvasElement.querySelectorAll(
        '[data-slot="pagination-ellipsis"]'
      );
      for (const item of reticencias) {
        await expect(item).toHaveAttribute("aria-hidden", "true");
        await expect(item.hasAttribute("tabindex")).toBe(false);
      }
      // Só os cinco números continuam navegáveis, mais Previous e Next. A
      // consulta é por `button`: esta faixa não tem endereço de página.
      await expect(canvas.getAllByRole("button").length).toBe(7);
    });
  },
};

export const LastPage: Story = {
  parameters: {
    covers: ["functional.item3"],
    docs: {
      // O extremo bloqueado é o de AVANÇO, e a faixa termina na última página —
      // composição que o snippet do meta, sempre na primeira, não alcança.
      source: { transform: paginationLastPageSource },
      description: {
        story:
          "Na última página o controle Próxima fica desabilitado, pelo mesmo mecanismo usado em Anterior.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação na última página">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious text="Anterior" />
        </PaginationItem>
        {[8, 9, 10].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink isActive={n === 10} aria-label={`Ir para página ${n}`}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            text="Próxima"
            disabled
            onClick={() => {
              onPageChange(11);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole("button", { name: "Ir para a próxima página" });

    await step("Próxima está marcado como desabilitado", async () => {
      // Sem endereço de página o controle é `<button>`, e o indisponível é o
      // `disabled` nativo — um mecanismo só, em vez de `aria-disabled` mais
      // tabindex negativo.
      await expect(next).toBeDisabled();
      await expect(next.hasAttribute("aria-disabled")).toBe(false);
      await expect(getComputedStyle(next).pointerEvents).toBe("none");
    });

    await step("Clicar em Próxima não navega", async () => {
      // functional.item3 — `fireEvent` porque o ponteiro já está barrado pelo
      // CSS; o que falta provar é que o evento por script também não passa.
      onPageChange.mockClear();
      await fireEvent.click(next);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step("A página atual é a última da faixa", async () => {
      await expect(
        canvas.getByRole("button", { name: "Ir para página 10" })
      ).toHaveAttribute("aria-current", "page");
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O contador ao lado da faixa é sub-composição: o mesmo estado alimenta o
      // destaque, o `aria-current` e o texto, e o meta imprime só a faixa.
      source: { transform: paginationControladaSource },
      description: {
        story:
          "O estado da página atual vive fora do componente. Cada clique reposiciona o destaque, o aria-current e o contador.",
      },
    },
  },
  render: function ControlledRender() {
    const [page, setPage] = useState(1);
    const total = 4;
    return (
      <div className="nds-stack" data-spacing="sm">
        <p className="nds-text-body nds-text-muted-foreground" data-slot="pagina-atual">
          Página {page} de {total}
        </p>
        <Pagination aria-label="Paginação controlada">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Anterior"
                disabled={page === 1}
                onClick={() => {
                  if (page > 1) setPage(page - 1);
                }}
              />
            </PaginationItem>
            {[1, 2, 3, 4].map((n) => (
              <PaginationItem key={n}>
                <PaginationLink
                  isActive={page === n}
                  aria-label={`Ir para página ${n}`}
                  onClick={() => {
                    setPage(n);
                  }}
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="Próxima"
                disabled={page === total}
                onClick={() => {
                  if (page < total) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const irTo = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const target = canvas.getByRole("button", { name: `Ir para página ${n}` });
      if (target.getAttribute("aria-current") !== "page") await userEvent.click(target);
      await expect(canvas.getByRole("button", { name: `Ir para página ${n}` })).toHaveAttribute(
        "aria-current",
        "page"
      );
    };

    await step("Clicar numa página move o destaque e o contador", async () => {
      await irTo(3);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        "Página 3 de 4"
      );
    });

    await step("Só uma página é a atual em qualquer momento", async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step("O estado volta ao início para a próxima rodada", async () => {
      await irTo(1);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        "Página 1 de 4"
      );
    });
  },
};

export const CompleteTable: Story = {
  parameters: {
    docs: {
      // A faixa mora dentro de um rodapé de tabela: o contêiner `nds-cluster` e
      // o `data-align="end"` são o ponto, e o meta imprime a faixa solta.
      source: { transform: tablePaginationFooterSource },
      description: {
        story:
          "Cenário canônico: rodapé de tabela com o contador de resultados à esquerda e a faixa encostada à direita, via data-align=\"end\".",
      },
    },
  },
  render: () => (
    // `nds-cluster` e não `nds-stack`: só o cluster tem data-align/data-justify,
    // e é ele que quebra a linha sozinho quando a largura aperta. A marcação
    // anterior usava um stack com atributos que nenhuma regra lê, mais três
    // classes de força de um framework que saiu — o rodapé nunca virou linha.
    <div
      className="nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4"
      data-spacing="sm"
      data-align="center"
      data-justify="between"
    >
      <span className="nds-text-body nds-text-muted-foreground">
        Mostrando 11–20 de 120 resultados
      </span>
      <Pagination aria-label="Paginação do rodapé da tabela" data-align="end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious text="Anterior" />
          </PaginationItem>
          {[1, 2, 3].map((n) => (
            <PaginationItem key={n}>
              <PaginationLink isActive={n === 2} aria-label={`Ir para página ${n}`}>
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink aria-label="Ir para página 12">12</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext text="Próxima" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A faixa encosta na borda direita do rodapé", async () => {
      // O alinhamento é o PONTO desta composição, e antes ele era escrito com
      // classes inertes: a faixa ocupava a linha inteira e ficava centrada.
      const nav = canvas.getByRole("navigation", { name: "Paginação do rodapé da tabela" });
      const style = getComputedStyle(nav);
      await expect(style.justifyContent).toBe("flex-end");
      await expect(nav.getBoundingClientRect().width).toBeLessThan(
        (nav.parentElement as HTMLElement).getBoundingClientRect().width
      );
    });

    await step("O contador e a faixa dividem a mesma linha", async () => {
      const footer = canvasElement.querySelector(".nds-cluster") as HTMLElement;
      await expect(getComputedStyle(footer).justifyContent).toBe("space-between");
      await expect(
        canvas.getByRole("button", { name: "Ir para página 2" })
      ).toHaveAttribute("aria-current", "page");
    });
  },
};
