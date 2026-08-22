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
  paginationRodapeDeTabelaSource,
  paginationSource,
  paginationUltimaPaginaSource,
} from "./pagination.source";

const meta = {
  title: "UI/Pagination/Compositions",
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
          "Total pequeno: todos os números aparecem em sequência, sem reticências. Previous e Next nas pontas.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação simples">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" text="Anterior" aria-disabled tabIndex={-1} />
        </PaginationItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href="#" isActive={n === 1} aria-label={`Ir para página ${n}`}>
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

    await step("A faixa mostra todos os números, sem reticências", async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numerados = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numerados.length).toBe(5);
      await expect([...numerados].map((l) => l.textContent?.trim())).toEqual([
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

    await step("A primeira página é a atual e Anterior está desabilitado", async () => {
      await expect(
        canvas.getByRole("link", { name: "Ir para página 1" })
      ).toHaveAttribute("aria-current", "page");
      await expect(
        canvas.getByRole("link", { name: "Ir para a página anterior" })
      ).toHaveAttribute("aria-disabled", "true");
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
          <PaginationPrevious href="#" text="Anterior" />
        </PaginationItem>
        {[1, "ellipsis-left", 5, 6, 7, "ellipsis-right", 12].map((trecho) =>
          typeof trecho === "number" ? (
            <PaginationItem key={trecho}>
              <PaginationLink
                href="#"
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
          <PaginationNext href="#" text="Próxima" />
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
      // Só os cinco números continuam navegáveis, mais Previous e Next.
      await expect(canvas.getAllByRole("link").length).toBe(7);
    });
  },
};

export const LastPage: Story = {
  parameters: {
    covers: ["functional.item3"],
    docs: {
      // O extremo bloqueado é o de AVANÇO, e a faixa termina na última página —
      // composição que o snippet do meta, sempre na primeira, não alcança.
      source: { transform: paginationUltimaPaginaSource },
      description: {
        story:
          "Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação na última página">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" text="Anterior" />
        </PaginationItem>
        {[8, 9, 10].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href="#" isActive={n === 10} aria-label={`Ir para página ${n}`}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="Próxima"
            aria-disabled
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(11);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const proxima = canvas.getByRole("link", { name: "Ir para a próxima página" });

    await step("Próxima está marcado como desabilitado", async () => {
      await expect(proxima).toHaveAttribute("aria-disabled", "true");
      await expect(proxima).toHaveAttribute("tabindex", "-1");
      await expect(getComputedStyle(proxima).pointerEvents).toBe("none");
    });

    await step("Clicar em Próxima não navega", async () => {
      // functional.item3 — `fireEvent` porque o ponteiro já está barrado pelo
      // CSS; o que falta provar é que o evento por script também não passa.
      onPageChange.mockClear();
      await fireEvent.click(proxima);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step("A página atual é a última da faixa", async () => {
      await expect(
        canvas.getByRole("link", { name: "Ir para página 10" })
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
                href="#"
                text="Anterior"
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : 0}
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
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
                    setPage(n);
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
                onClick={(e) => {
                  e.preventDefault();
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
    const irPara = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const alvo = canvas.getByRole("link", { name: `Ir para página ${n}` });
      if (alvo.getAttribute("aria-current") !== "page") await userEvent.click(alvo);
      await expect(canvas.getByRole("link", { name: `Ir para página ${n}` })).toHaveAttribute(
        "aria-current",
        "page"
      );
    };

    await step("Clicar numa página move o destaque e o contador", async () => {
      await irPara(3);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        "Página 3 de 4"
      );
    });

    await step("Só uma página é a atual em qualquer momento", async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step("O estado volta ao início para a próxima rodada", async () => {
      await irPara(1);
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
      source: { transform: paginationRodapeDeTabelaSource },
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
            <PaginationPrevious href="#" text="Anterior" />
          </PaginationItem>
          {[1, 2, 3].map((n) => (
            <PaginationItem key={n}>
              <PaginationLink href="#" isActive={n === 2} aria-label={`Ir para página ${n}`}>
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
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
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A faixa encosta na borda direita do rodapé", async () => {
      // O alinhamento é o PONTO desta composição, e antes ele era escrito com
      // classes inertes: a faixa ocupava a linha inteira e ficava centrada.
      const nav = canvas.getByRole("navigation", { name: "Paginação do rodapé da tabela" });
      const estilo = getComputedStyle(nav);
      await expect(estilo.justifyContent).toBe("flex-end");
      await expect(nav.getBoundingClientRect().width).toBeLessThan(
        (nav.parentElement as HTMLElement).getBoundingClientRect().width
      );
    });

    await step("O contador e a faixa dividem a mesma linha", async () => {
      const rodape = canvasElement.querySelector(".nds-cluster") as HTMLElement;
      await expect(getComputedStyle(rodape).justifyContent).toBe("space-between");
      await expect(
        canvas.getByRole("link", { name: "Ir para página 2" })
      ).toHaveAttribute("aria-current", "page");
    });
  },
};
