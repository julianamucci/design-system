import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fireEvent, fn, userEvent } from "storybook/test";
import { alvosAbaixoDoMinimo, contrastesDaFaixa } from "@shared/testing/pagination-probe";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta = {
  title: "UI/Pagination/States",
  tags: ["navigation"],
  component: Pagination,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Pagination: Default, Hover, ActivePage, Disabled (Previous na primeira página), Focus e Contrast.",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

/** Faixa de 5 páginas com os dois extremos parametrizados. */
function faixa(rotulo: string, atual: number) {
  return (
    <Pagination aria-label={rotulo}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Anterior"
            aria-disabled={atual === 1}
            tabIndex={atual === 1 ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (atual > 1) onPageChange(atual - 1);
            }}
          />
        </PaginationItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink
              href="#"
              isActive={n === atual}
              aria-label={`Ir para página ${n}`}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(n);
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
            aria-disabled={atual === 5}
            tabIndex={atual === 5 ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (atual < 5) onPageChange(atual + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Estado padrão — sem fundo, texto em foreground e cursor de clique.",
      },
    },
  },
  render: () => faixa("Paginação em repouso", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("O link inativo está visível e não é a página atual", async () => {
      const link = canvas.getByRole("link", { name: "Ir para página 4" });
      await expect(link).toBeVisible();
      await expect(link).not.toHaveAttribute("aria-current");
      await expect(getComputedStyle(link).pointerEvents).toBe("auto");
    });
  },
};

export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Sob o ponteiro o link recebe fundo accent. A afordância é o cursor de clique, e o alvo tem que estar realmente alcançável.",
      },
    },
  },
  render: () => faixa("Paginação sob o ponteiro", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("O link é alcançável pelo ponteiro e se anuncia clicável", async () => {
      const link = canvas.getByRole("link", { name: "Ir para página 4" });
      await userEvent.hover(link);
      // Não se assere a cor do hover: `:hover` computado é frágil no harness.
      // O que prova a afordância é o cursor, e o que prova que o clique CHEGA é
      // o elemento devolvido no centro da caixa.
      await expect(getComputedStyle(link).cursor).toBe("pointer");
      const caixa = link.getBoundingClientRect();
      const alvo = document.elementFromPoint(
        caixa.left + caixa.width / 2,
        caixa.top + caixa.height / 2
      );
      await expect(link.contains(alvo)).toBe(true);
    });
  },
};

export const ActivePage: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story: "Página atual destacada no meio da faixa — o caso que o Chromatic fotografa.",
      },
    },
  },
  render: () => faixa("Paginação com página atual", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Exatamente um link é a página atual", async () => {
      // visual.item3
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent("3");
    });
    await step("O destaque é visual e não depende da posição", async () => {
      const ativo = canvas.getByRole("link", { name: "Ir para página 3" });
      await expect(ativo).toHaveClass("nds-button-outline");
      await expect(canvas.getByRole("link", { name: "Ir para página 2" })).toHaveClass(
        "nds-button-ghost"
      );
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item4"],
    docs: {
      description: {
        story:
          "Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.",
      },
    },
  },
  render: () => faixa("Paginação na primeira página", 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole("link", { name: "Ir para a página anterior" });

    await step("Anterior está marcado como desabilitado", async () => {
      // visual.item4 — em `<a>` não existe `disabled`; o par correto é
      // aria-disabled + a supressão do clique e da tabulação. A classe morta
      // `pointer-events-none` que morava aqui não fazia nada: quem barra é
      // `.nds-button[aria-disabled="true"]`, e é isso que esta asserção mede.
      await expect(anterior).toHaveAttribute("aria-disabled", "true");
      await expect(anterior).toHaveAttribute("tabindex", "-1");
      await expect(getComputedStyle(anterior).pointerEvents).toBe("none");
      await expect(Number(getComputedStyle(anterior).opacity)).toBeLessThan(1);
    });

    await step("Clicar em Anterior não navega", async () => {
      // functional.item2 — `fireEvent` e não `userEvent`: o CSS já barra o
      // ponteiro, e o que falta provar é o outro caminho, o evento que chega
      // por script ou por teclado.
      onPageChange.mockClear();
      await fireEvent.click(anterior);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step("Próxima continua ativo", async () => {
      const proxima = canvas.getByRole("link", { name: "Ir para a próxima página" });
      await expect(proxima.hasAttribute("aria-disabled")).toBe(false);
      onPageChange.mockClear();
      await userEvent.click(proxima);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Foco por teclado desenha um anel visível em qualquer link da faixa — inclusive no da página atual.",
      },
    },
  },
  render: () => faixa("Paginação com foco", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O anel de foco aparece no link numerado", async () => {
      // accessibility.item3 — medir a sombra computada é o que prova que a
      // regra do CSS compartilhado chegou ao elemento, e não só que o foco
      // chegou. `ring-2 ring-ring`, que a documentação citava, não existe.
      const link = canvas.getByRole("link", { name: "Ir para página 2" });
      link.blur();
      link.focus();
      await expect(link).toHaveFocus();
      await expect(getComputedStyle(link).boxShadow).not.toBe("none");
    });

    await step("A página atual também é focável", async () => {
      const ativo = canvas.getByRole("link", { name: "Ir para página 3" });
      ativo.blur();
      ativo.focus();
      await expect(ativo).toHaveFocus();
      await expect(getComputedStyle(ativo).boxShadow).not.toBe("none");
    });
  },
};

export const Contrast: Story = {
  parameters: {
    covers: ["accessibility.item2", "accessibility.item6"],
    docs: {
      description: {
        story:
          "O texto de todo link da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.",
      },
    },
  },
  render: () => faixa("Paginação medida por contraste", 3),
  play: async ({ canvasElement, step }) => {
    await step("Todo link passa dos 4.5:1 exigidos para texto", async () => {
      // accessibility.item2 — o texto da faixa tem 14px, tamanho normal pela
      // WCAG (grande é >=24px, ou >=18.66px em negrito), então o limite é 4.5.
      const medidas = contrastesDaFaixa(canvasElement);
      await expect(medidas.length).toBe(7);
      const reprovados = medidas.filter((m) => m.razao < 4.5);
      await expect(JSON.stringify(reprovados)).toBe("[]");
    });

    await step("Todo controle alcança o alvo de toque mínimo", async () => {
      // accessibility.item6
      await expect(JSON.stringify(alvosAbaixoDoMinimo(canvasElement))).toBe("[]");
    });
  },
};
