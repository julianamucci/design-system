import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fireEvent, fn, userEvent } from "storybook/test";
import { minimumTargetsBelow, rangeContrastes } from "@shared/testing/pagination-probe";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { paginationDisabledSource, paginationSource } from "./pagination.source";

const meta = {
  title: "UI/Pagination/States",
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
function range(label: string, current: number) {
  return (
    <Pagination aria-label={label}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Anterior"
            aria-disabled={current === 1}
            tabIndex={current === 1 ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (current > 1) onPageChange(current - 1);
            }}
          />
        </PaginationItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink
              href="#"
              isActive={n === current}
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
            aria-disabled={current === 5}
            tabIndex={current === 5 ? -1 : 0}
            onClick={(e) => {
              e.preventDefault();
              if (current < 5) onPageChange(current + 1);
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
  render: () => range("Paginação em repouso", 3),
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
  render: () => range("Paginação sob o ponteiro", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("O link é alcançável pelo ponteiro e se anuncia clicável", async () => {
      const link = canvas.getByRole("link", { name: "Ir para página 4" });
      await userEvent.hover(link);
      // Não se assere a cor do hover: `:hover` computado é frágil no harness.
      // O que prova a afordância é o cursor, e o que prova que o clique CHEGA é
      // o elemento devolvido no centro da caixa.
      await expect(getComputedStyle(link).cursor).toBe("pointer");
      const box = link.getBoundingClientRect();
      const target = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2
      );
      await expect(link.contains(target)).toBe(true);
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
  render: () => range("Paginação com página atual", 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Exatamente um link é a página atual", async () => {
      // visual.item3
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent("3");
    });
    await step("O destaque é visual e não depende da posição", async () => {
      const active = canvas.getByRole("link", { name: "Ir para página 3" });
      await expect(active).toHaveClass("nds-button-outline");
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
      // O par `aria-disabled` + `tabIndex={-1}` escrito à mão no extremo é o
      // assunto; o meta o deriva do estado e nunca o mostra fixado.
      source: { transform: paginationDisabledSource },
      description: {
        story:
          "Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.",
      },
    },
  },
  render: () => range("Paginação na primeira página", 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("link", { name: "Ir para a página anterior" });

    await step("Anterior está marcado como desabilitado", async () => {
      // visual.item4 — em `<a>` não existe `disabled`; o par correto é
      // aria-disabled + a supressão do clique e da tabulação. A classe morta
      // `pointer-events-none` que morava aqui não fazia nada: quem barra é
      // `.nds-button[aria-disabled="true"]`, e é isso que esta asserção mede.
      await expect(previous).toHaveAttribute("aria-disabled", "true");
      await expect(previous).toHaveAttribute("tabindex", "-1");
      await expect(getComputedStyle(previous).pointerEvents).toBe("none");
      await expect(Number(getComputedStyle(previous).opacity)).toBeLessThan(1);
    });

    await step("Clicar em Anterior não navega", async () => {
      // functional.item2 — `fireEvent` e não `userEvent`: o CSS já barra o
      // ponteiro, e o que falta provar é o outro caminho, o evento que chega
      // por script ou por teclado.
      onPageChange.mockClear();
      await fireEvent.click(previous);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step("Próxima continua ativo", async () => {
      const next = canvas.getByRole("link", { name: "Ir para a próxima página" });
      await expect(next.hasAttribute("aria-disabled")).toBe(false);
      onPageChange.mockClear();
      await userEvent.click(next);
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
  render: () => range("Paginação com foco", 3),
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
      const active = canvas.getByRole("link", { name: "Ir para página 3" });
      active.blur();
      active.focus();
      await expect(active).toHaveFocus();
      await expect(getComputedStyle(active).boxShadow).not.toBe("none");
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
  render: () => range("Paginação medida por contraste", 3),
  play: async ({ canvasElement, step }) => {
    await step("Todo link passa dos 4.5:1 exigidos para texto", async () => {
      // accessibility.item2 — o texto da faixa tem 14px, tamanho normal pela
      // WCAG (grande é >=24px, ou >=18.66px em negrito), então o limite é 4.5.
      const measurements = rangeContrastes(canvasElement);
      await expect(measurements.length).toBe(7);
      const reprovados = measurements.filter((m) => m.ratio < 4.5);
      await expect(JSON.stringify(reprovados)).toBe("[]");
    });

    await step("Todo controle alcança o alvo de toque mínimo", async () => {
      // accessibility.item6
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe("[]");
    });
  },
};
