import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { cardSource } from "./card.source";
import { CardDocs } from "@/components/docs/CardDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(CardDocs),
      source: { transform: cardSource },
    },
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["default", "sm"],
      description:
        'Tamanho do Card. "default" (padrão) para uso geral; "sm" para listas densas e dashboards — propaga via `data-size` para as partes internas.',
      table: {
        type: { summary: '"default" | "sm"' },
        defaultValue: { summary: '"default"' },
      },
    },
    className: {
      control: "text",
      description:
        "Classes utilitárias .nds-* adicionais aplicadas ao container raiz (sobrescreve padding, fundo ou raio).",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    size: "default",
    className: "nds-w-sm",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    // accessibility.item1 e item6 saem do axe, que o addon-a11y roda em toda
    // story — mas o auditor só enxerga o critério se alguma story o declarar.
    covers: [
      "functional.item1",
      "accessibility.item1",
      "accessibility.item3",
      "accessibility.item6",
      "visual.item1",
    ],
  },
  args: {
    size: "default",
    className: "nds-w-sm",
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-h4">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="nds-cluster" data-justify="end" data-spacing="md">
        <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">
          Editar
        </Button>
        <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">
          Excluir
        </Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step("As partes do Card emitem os data-slot esperados", async () => {
      // data-slot é o contrato de markup que as cinco stacks compartilham —
      // classe muda de tema para tema, o slot não.
      await expect(card).toBeInTheDocument();
      for (const slot of [
        "card-header",
        "card-title",
        "card-description",
        "card-content",
        "card-footer",
      ]) {
        await expect(card.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }
    });

    await step("Header, conteúdo e rodapé são filhos DIRETOS, nessa ordem", async () => {
      // `.nds-card:has(> .nds-card-footer)` zera o padding-bottom do card. Um
      // wrapper entre os dois mataria a regra sem mudar nada visível aqui, daí
      // medir o parentesco em vez da presença.
      const slots = [...card.children].map((el) => el.getAttribute("data-slot"));
      await expect(slots).toEqual(["card-header", "card-content", "card-footer"]);
    });

    await step("O rodapé se separa do conteúdo por uma borda superior", async () => {
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;
      await expect(
        Number.parseFloat(getComputedStyle(footer).borderTopWidth),
      ).toBeGreaterThan(0);
    });

    await step("O título é um heading de verdade", async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento.
      await expect(
        canvas.getByRole("heading", { name: "Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
    });

    await step("O tamanho escolhido chega ao DOM", async () => {
      await expect(card).toHaveAttribute("data-size", args.size!);
    });

    await step("Os botões do rodapé nomeiam o produto que editam", async () => {
      // "Excluir" sozinho vira uma fileira de botões idênticos numa lista de
      // cards para quem navega por leitor de tela.
      await expect(
        canvas.getByRole("button", { name: "Editar produto Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole("button", { name: "Excluir produto Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
    });
  },
};
