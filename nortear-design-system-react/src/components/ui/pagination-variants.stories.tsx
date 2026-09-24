import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { minimumTargetsBelow } from "@shared/testing/pagination-probe";
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import {
  paginationAppearanceSource,
  paginationDirecionalSource,
  paginationFirstLastSource,
  paginationLinkActiveSource,
  paginationLinkInactiveSource,
  paginationSource,
  paginationWithoutPagesSource,
} from "./pagination.source";

const meta = {
  title: "Components/Navigation/Pagination/Variants",
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
          "Variantes do PaginationLink: Default (link inativo), Active (página atual, com aria-current=page) e Directional (Previous/Next com ícone e rótulo). Em seguida vêm as três formas que o rodapé de tabela pediu: Appearance (aparência dos controles não ativos), First/last (salto para as pontas) e Without the numbered range (só os direcionais).",
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
          "Controle inativo — fundo transparente. Padrão para toda página que não é a atual.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação com link inativo">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink aria-label="Ir para página 2">2</PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("O controle inativo não se anuncia como página atual", async () => {
      // Sem endereço de página a tag é `<button>` — é a regra da rota, e ela
      // vale para o número tanto quanto para o direcional.
      const link = canvas.getByRole("button", { name: "Ir para página 2" });
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
          <PaginationLink aria-label="Ir para página 1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive aria-label="Ir para página 2">
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
      const active = canvas.getByRole("button", { name: "Ir para página 2" });
      const inactive = canvas.getByRole("button", { name: "Ir para página 1" });
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
          <PaginationPrevious text="Anterior" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O nome acessível não depende do rótulo visível", async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo em tela pequena.
      const previous = canvas.getByRole("button", { name: "Ir para a página anterior" });
      const next = canvas.getByRole("button", { name: "Ir para a próxima página" });
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

// ─── Os eixos que o rodapé de tabela pediu ───────────────────────────────────
//
// `appearance` e o par PaginationFirst / PaginationLast nasceram em 2026-09-23,
// quando o rodapé do DataTable passou a compor esta faixa em vez de desenhar
// quatro botões soltos. Eixo sem story é API que ninguém prova — e a terceira
// story abaixo é a que mostra a AUSÊNCIA do terceiro eixo: aqui não existe
// `showPages`, porque a régua numerada é de quem compõe.

export const Appearance: Story = {
  name: "Appearance (outline)",
  parameters: {
    docs: {
      source: { transform: paginationAppearanceSource },
      description: {
        story:
          "Aparência dos controles não ativos. O padrão é fundo transparente; com outline todo controle ganha moldura — é a forma que o rodapé de tabela usa. A página atual continua marcada pelo aria-current, que não depende da variante.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação em outline">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious appearance="outline" />
        </PaginationItem>
        {[1, 2, 3, 4, 5].map((n) => (
          <PaginationItem key={n}>
            <PaginationLink
              appearance="outline"
              isActive={n === 2}
              aria-label={`Ir para página ${n}`}
            >
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext appearance="outline" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Nenhum controle continua na variante padrão", async () => {
      // A asserção é de AUSÊNCIA porque o eixo é justamente a troca: `ghost` é
      // o padrão, e as stories Default e Directional deste arquivo o afirmam.
      // Contar zero aqui é o que prova que a opção chegou ao `buttonVariants` —
      // só presença passaria mesmo se o `outline` viesse do realce da atual.
      await expect(canvasElement.querySelectorAll(".nds-button-ghost").length).toBe(0);
      await expect(canvasElement.querySelectorAll(".nds-button-outline").length).toBe(7);
    });

    await step("O inativo e os direcionais seguem o eixo", async () => {
      const inactive = canvas.getByRole("button", { name: "Ir para página 3" });
      await expect(inactive).toHaveClass("nds-button-outline");
      await expect(inactive).not.toHaveClass("nds-button-ghost");

      for (const name of ["Ir para a página anterior", "Ir para a próxima página"]) {
        const directional = canvas.getByRole("button", { name });
        await expect(directional).toHaveClass("nds-button-outline");
        await expect(directional).not.toHaveClass("nds-button-ghost");
      }
    });

    await step("A página atual continua marcada", async () => {
      // O realce da atual não pode sumir quando a faixa inteira vira outline:
      // quem responde "que página é esta?" em voz alta é o `aria-current`, e é
      // ele que segura a marcação quando a variante deixa de distinguir.
      const active = canvas.getByRole("button", { name: "Ir para página 2" });
      await expect(active).toHaveAttribute("aria-current", "page");
      await expect(active).toHaveAttribute("data-active", "true");
      await expect(active).toHaveClass("nds-button-outline");
    });
  },
};

/**
 * Faixa com salto, com a página atual num estado de quem compõe.
 *
 * O componente vive FORA do `render` porque é lá que o hook precisa estar: a
 * função de `render` do Storybook não é um componente, e chamar `useState`
 * dentro dela amarraria o estado à ordem de chamada do decorator.
 */
function RangeWithJump() {
  const total = 5;
  const [page, setPage] = useState(3);
  return (
    <div className="nds-stack" data-spacing="sm">
      <p className="nds-text-body nds-text-muted-foreground">
        Página {page} de {total}
      </p>
      <Pagination aria-label="Paginação com salto para as pontas">
        <PaginationContent>
          <PaginationItem>
            <PaginationFirst disabled={page === 1} onClick={() => setPage(1)} />
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            />
          </PaginationItem>
          {[1, 2, 3, 4, 5].map((n) => (
            <PaginationItem key={n}>
              <PaginationLink
                isActive={n === page}
                aria-label={`Ir para página ${n}`}
                onClick={() => setPage(n)}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={page === total}
              onClick={() => setPage(page + 1)}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLast
              disabled={page === total}
              onClick={() => setPage(total)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export const FirstLast: Story = {
  name: "First/last (jump to the ends)",
  parameters: {
    docs: {
      source: { transform: paginationFirstLastSource },
      description: {
        story:
          "Salto para as pontas, por fora dos controles de passo: primeira antes do anterior, última depois do próximo. Duplo chevron e sem texto visível — o nome acessível vem do rótulo, nunca da palavra na tela.",
      },
    },
  },
  render: () => <RangeWithJump />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Os dois controles novos existem, nomeados", async () => {
      const first = canvas.getByRole("button", { name: "Ir para a primeira página" });
      const last = canvas.getByRole("button", { name: "Ir para a última página" });
      await expect(first).toHaveAttribute("data-slot", "pagination-first");
      await expect(last).toHaveAttribute("data-slot", "pagination-last");
    });

    await step("Eles ficam nas PONTAS, por fora dos direcionais", async () => {
      // A ordem é o contrato: emitir os quatro fora de ordem passaria em
      // qualquer asserção de presença e entregaria uma faixa ilegível.
      const slots = [...canvasElement.querySelectorAll('[data-slot^="pagination"]')]
        .map((el) => el.getAttribute("data-slot"))
        .filter((slot) => slot !== "pagination-item" && slot !== "pagination-link");
      await expect(slots).toEqual([
        "pagination",
        "pagination-content",
        "pagination-first",
        "pagination-previous",
        "pagination-next",
        "pagination-last",
      ]);
    });

    await step("O salto usa DUPLO chevron, o passo usa um só", async () => {
      const linhas = (slot: string) =>
        canvasElement.querySelectorAll(`[data-slot="${slot}"] svg path`).length;
      await expect(linhas("pagination-first")).toBe(2);
      await expect(linhas("pagination-last")).toBe(2);
      await expect(linhas("pagination-previous")).toBe(1);
      await expect(linhas("pagination-next")).toBe(1);
    });

    await step("Sem texto visível, o controle é o quadrado de ícone", async () => {
      for (const slot of ["pagination-first", "pagination-last"]) {
        const control = canvasElement.querySelector(
          `[data-slot="${slot}"]`
        ) as HTMLElement;
        await expect(control).toHaveClass("nds-button-icon");
        await expect(control.querySelector(".nds-pagination-label")).toBeNull();
        // WCAG 2.5.8 (24×24 CSS px) medido AQUI e não pela sonda compartilhada:
        // `minimumTargetsBelow` colhe por `pagination-link|previous|next` e não
        // conhece os dois slots novos.
        const box = control.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step("Cada um salta para a sua ponta", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Ir para a primeira página" })
      );
      await expect(canvas.getByText("Página 1 de 5")).toBeInTheDocument();
      await userEvent.click(
        canvas.getByRole("button", { name: "Ir para a última página" })
      );
      await expect(canvas.getByText("Página 5 de 5")).toBeInTheDocument();
    });
  },
};

export const WithoutPages: Story = {
  name: "Without the numbered range",
  parameters: {
    docs: {
      source: { transform: paginationWithoutPagesSource },
      description: {
        story:
          "A faixa sem números — a forma do rodapé de tabela. Não há opção para escondê-los: a régua é de quem compõe, e o que a apaga é não escrever link numerado nenhum. Sem palavra visível, os controles de passo viram quadrados de ícone.",
      },
    },
  },
  render: () => (
    <Pagination aria-label="Paginação sem números">
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious text="" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext text="" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Nada de número nem de reticência na faixa", async () => {
      // Contar zero é o que separa "a régua é de quem compõe" de "a story
      // escolheu um total pequeno demais para mostrar a diferença".
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-link"]').length
      ).toBe(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length
      ).toBe(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-item"]').length
      ).toBe(4);
    });

    await step("Sobram os quatro direcionais, nomeados", async () => {
      const controls = canvas.getAllByRole("button");
      await expect(controls.map((c) => c.getAttribute("aria-label"))).toEqual([
        "Ir para a primeira página",
        "Ir para a página anterior",
        "Ir para a próxima página",
        "Ir para a última página",
      ]);
    });

    await step("Sem número, nada se anuncia como página atual", async () => {
      await expect(canvasElement.querySelectorAll("[aria-current]").length).toBe(0);
    });

    await step("Texto vazio não deixa um bloco oco dentro do botão", async () => {
      // `.nds-pagination-label` é `display: block` acima de 40rem: um `<span>`
      // vazio ali ocuparia uma linha inteira dentro do botão, e o quadrado
      // deixaria de ser quadrado. O recuo assimétrico sai junto, porque ele
      // existia para abrir espaço ao lado da palavra que já não há.
      await expect(canvasElement.querySelectorAll(".nds-pagination-label").length).toBe(0);
      const previous = canvas.getByRole("button", { name: "Ir para a página anterior" });
      await expect(previous).toHaveClass("nds-button-icon");
      await expect(previous).not.toHaveClass("nds-pagination-prev");
      const next = canvas.getByRole("button", { name: "Ir para a próxima página" });
      await expect(next).toHaveClass("nds-button-icon");
      await expect(next).not.toHaveClass("nds-pagination-next");
    });

    await step("Todo controle alcança o alvo de toque mínimo", async () => {
      // WCAG 2.5.8 — o quadrado de ícone é o controle mais apertado da faixa.
      const faltantes = minimumTargetsBelow(canvasElement);
      await expect(JSON.stringify(faltantes)).toBe("[]");
    });
  },
};
