import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Separator } from "./separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import {
  separatorEmCardSource,
  separatorEmMenuSource,
  separatorEnfaseForteSource,
  separatorSource,
} from "./separator.source";

const meta = {
  title: "Components/Layout/Separator/Compositions",
  tags: ["layout"],
  component: Separator,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          "Composições do Separator: dentro de um Card, dentro de um menu vertical e com a ênfase forte.",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InCard: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // Sub-composição: o divisor mora ENTRE cabeçalho e conteúdo do Card, e o
      // snippet do meta esconderia essa posição.
      source: { transform: separatorEmCardSource },
    },
  },
  render: () => (
    <Card className="nds-max-w-md">
      <CardHeader>
        <CardTitle>Resumo do pedido</CardTitle>
        <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
      </CardHeader>
      <Separator orientation="horizontal" />
      <CardContent>
        <p className="nds-text-body">Total: R$ 249,90</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>(".nds-card")!;
    const sep = card.querySelector<HTMLElement>(".nds-separator");

    await step("Separa o cabeçalho do conteúdo dentro do Card", async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute("data-orientation", "horizontal");
    });

    await step("Não estoura a largura do Card", async () => {
      // Separador dentro de um contêiner com padding é onde a largura costuma
      // vazar — medir o par prova que ele respeita a caixa.
      const box = sep!.getBoundingClientRect();
      await expect(box.width).toBeGreaterThan(0);
      await expect(box.width).toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const InMenu: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // Sub-composição dentro de um menu, e com `decorative={false}` afirmado no
      // `render`: a divisão entre grupos faz parte da estrutura da informação.
      source: { transform: separatorEmMenuSource },
    },
  },
  render: () => (
    <div
      className="nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1"
      data-spacing="xs"
    >
      <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Perfil</div>
      <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Conta</div>
      {/* A divisão entre grupos de um menu FAZ parte da estrutura da informação:
          é o caso em que o separador deixa de ser decorativo. */}
      <Separator orientation="horizontal" decorative={false} />
      <div className="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Sair</div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const menu = canvasElement.querySelector<HTMLElement>(".nds-stack")!;
    const sep = menu.querySelector<HTMLElement>(".nds-separator")!;
    const items = [...menu.children].filter((c) => !c.classList.contains("nds-separator"));

    await step("A divisão entre grupos é anunciada", async () => {
      await expect(sep).toHaveAttribute("role", "separator");
      await expect(sep).toHaveAttribute("aria-orientation", "horizontal");
    });

    await step("Fica ENTRE os dois grupos, não dentro de um deles", async () => {
      const meio = sep.getBoundingClientRect().top;
      await expect(items).toHaveLength(3);
      await expect(items[1].getBoundingClientRect().bottom).toBeLessThanOrEqual(meio + 1);
      await expect(items[2].getBoundingClientRect().top).toBeGreaterThanOrEqual(meio - 1);
    });
  },
};

export const EmphasisStrong: Story = {
  parameters: {
    covers: ["functional.item5", "functional.item6", "visual.item5"],
    docs: {
      // `emphasis="strong"` vem do `render`, sem control, e só se lê ao lado da
      // linha padrão — o par é a composição que a story ensina.
      source: { transform: separatorEnfaseForteSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="md">
      <p className="nds-text-body nds-text-muted-foreground">Fim da seção</p>
      <Separator orientation="horizontal" data-testid="padrao" />
      <p className="nds-text-body nds-text-muted-foreground">Continuação do mesmo assunto</p>
      {/* A classe extra entra junto com a ênfase: é o mesmo par que a docs page
          documenta em Extensibilidade, e prova que ela convive com a base. */}
      <Separator orientation="horizontal" emphasis="strong" className="nds-mt-4" data-testid="forte" />
      <p className="nds-text-body nds-font-medium">Troca de assunto</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const padrao = canvasElement.querySelector<HTMLElement>('[data-testid="padrao"]')!;
    const forte = canvasElement.querySelector<HTMLElement>('[data-testid="forte"]')!;

    await step("A ênfase forte dobra a espessura", async () => {
      await expect(forte).toHaveAttribute("data-emphasis", "strong");
      await expect(padrao.getBoundingClientRect().height).toBeCloseTo(1, 1);
      await expect(forte.getBoundingClientRect().height).toBeCloseTo(2, 1);
    });

    await step("A ênfase forte troca o token de cor da linha", async () => {
      // Comparar com o separador padrão renderizado ao lado, e não com um valor
      // literal: o token muda por tema, a diferença entre os dois não.
      await expect(getComputedStyle(forte).backgroundColor).not.toBe(
        getComputedStyle(padrao).backgroundColor,
      );
    });

    await step("A classe extra convive com a classe base", async () => {
      await expect(forte).toHaveClass("nds-separator");
      await expect(forte).toHaveClass("nds-mt-4");
    });
  },
};
