import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { minimumTargetsBelow } from "@shared/testing/pagination-probe";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import {
  paginationDirecionalSource,
  paginationLinkActiveSource,
  paginationLinkInactiveSource,
  paginationSource,
} from "./pagination.source";

const meta = {
  title: "UI/Pagination/Variants",
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
          "Variantes do PaginationLink: Default (link inativo), Active (página atual, com aria-current=page) e Directional (Previous/Next com ícone e rótulo).",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA de `isActive` é o assunto: um link só, sem estado nem faixa
      // em volta, é o que deixa a ausência visível.
      source: { transform: paginationLinkInactiveSource },
      description: {
        story:
          "Link inativo — fundo transparente. Padrão para toda página que não é a atual.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação com link inativo">
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
    await step("O link inativo não se anuncia como página atual", async () => {
      const link = canvas.getByRole("link", { name: "Ir para página 2" });
      await expect(link).not.toHaveAttribute("aria-current");
      // `data-active` só existe quando é verdade — atributo presente com valor
      // "false" faria `[data-active]` casar o item errado.
      await expect(link.hasAttribute("data-active")).toBe(false);
      await expect(link).toHaveClass("nds-button-ghost");
    });
  },
};

export const Active: Story = {
  parameters: {
    covers: ["accessibility.item4"],
    docs: {
      // `isActive` só se lê no par com o vizinho inativo, que não carrega
      // `aria-current` de jeito nenhum.
      source: { transform: paginationLinkActiveSource },
      description: {
        story:
          "Página atual — destaque visual permanente e aria-current=\"page\" para o leitor de tela.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação com página atual">
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
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Exatamente um link se anuncia como página atual", async () => {
      // accessibility.item4 — o contrato é o atributo, não a classe: é ele que
      // o leitor de tela lê.
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent("2");
    });
    await step("O destaque acompanha a marcação", async () => {
      const active = canvas.getByRole("link", { name: "Ir para página 2" });
      const inactive = canvas.getByRole("link", { name: "Ir para página 1" });
      await expect(active).toHaveAttribute("data-active", "true");
      await expect(active).toHaveClass("nds-button-outline");
      await expect(inactive).toHaveClass("nds-button-ghost");
    });
  },
};

export const Directional: Story = {
  parameters: {
    covers: ["accessibility.item5", "accessibility.item6"],
    docs: {
      // Override: a story mostra SÓ os controles de direção, sem a régua de
      // páginas que o snippet do meta traz — é a ausência que ela documenta.
      source: { transform: paginationDirecionalSource },
      description: {
        story:
          "Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação direcional">
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

    await step("O nome acessível não depende do rótulo visível", async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o link ficaria mudo em tela pequena.
      const previous = canvas.getByRole("link", { name: "Ir para a página anterior" });
      const next = canvas.getByRole("link", { name: "Ir para a próxima página" });
      await expect(previous.querySelector(".nds-pagination-label")).toHaveTextContent("Anterior");
      await expect(next.querySelector(".nds-pagination-label")).toHaveTextContent("Próxima");
      await expect(previous).toHaveClass("nds-pagination-prev");
      await expect(next).toHaveClass("nds-pagination-next");
    });

    await step("Todo controle alcança o alvo de toque mínimo", async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px. O direcional é o
      // controle mais apertado: quando o rótulo textual não aparece, sobra só o
      // ícone, e sem padding a caixa desaba para a altura dele.
      const faltantes = minimumTargetsBelow(canvasElement);
      await expect(JSON.stringify(faltantes)).toBe("[]");
    });
  },
};
