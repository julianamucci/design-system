import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { cardCompactoSource, cardNoFooterSource, cardSource } from "./card.source";

const meta = {
  title: "UI/Card/Sizes",
  tags: ["layout"],
  component: Card,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: cardSource },
      description: {
        component:
          "Tamanhos do Card controlados pela prop `size`. A propagação ocorre via `data-size` no root; as partes internas reagem ao atributo e ajustam padding e tamanho do título.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mede a mesma propriedade com o outro `data-size` e devolve o atributo ao
 * valor original. É o único jeito de comparar os dois tamanhos numa story que
 * mostra um só — e prova que a regra de CSS existe, em vez de afirmar que o
 * atributo está escrito. Restaura o estado, então sobrevive ao replay.
 */
function medirNoOutroTamanho(
  card: HTMLElement,
  outro: "default" | "sm",
  ler: () => number,
): number {
  const original = card.getAttribute("data-size")!;
  card.setAttribute("data-size", outro);
  const valor = ler();
  card.setAttribute("data-size", original);
  return valor;
}

export const Default: Story = {
  name: 'size="default"',
  parameters: {
    covers: ["visual.item2"],
    // O padrão não se escreve — o que se compara com o `sm` é esta mesma
    // composição de duas peças, sem o rodapé que o snippet do meta traz.
    docs: { source: { transform: cardNoFooterSource } },
  },
  render: () => (
    <Card className="nds-w-sm">
      <CardHeader>
        <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-base nds-font-semibold">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step("O tamanho padrão é o declarado quando ninguém escolhe", async () => {
      await expect(card).toHaveAttribute("data-size", "default");
    });

    await step("O título continua sendo heading no tamanho padrão", async () => {
      await expect(
        canvas.getByRole("heading", { name: "Cadeira Gamer Pro" }),
      ).toBeInTheDocument();
    });
  },
};

export const Small: Story = {
  name: 'size="sm"',
  parameters: {
    covers: ["functional.item2"],
    // O arquivo desliga os controls, então o meta não tem de onde ler o
    // tamanho — e `size="sm"` é o assunto da story.
    docs: { source: { transform: cardCompactoSource } },
  },
  render: () => (
    <Card size="sm" className="nds-w-xs">
      <CardHeader>
        <CardTitle as="h3">Assinantes ativos</CardTitle>
        <CardDescription>+12% no mês</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="nds-text-h4 nds-tabular-nums">8.742</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;

    await step('data-size="sm" chega ao root', async () => {
      await expect(card).toHaveAttribute("data-size", "sm");
    });

    await step("O tamanho sm reduz o padding de verdade", async () => {
      const padSm = Number.parseFloat(getComputedStyle(card).paddingTop);
      const padDefault = medirNoOutroTamanho(card, "default", () =>
        Number.parseFloat(getComputedStyle(card).paddingTop),
      );
      await expect(padSm).toBeLessThan(padDefault);
    });

    await step("O tamanho sm reduz o título de verdade", async () => {
      const fonteSm = Number.parseFloat(getComputedStyle(title).fontSize);
      const fonteDefault = medirNoOutroTamanho(card, "default", () =>
        Number.parseFloat(getComputedStyle(title).fontSize),
      );
      await expect(fonteSm).toBeLessThan(fonteDefault);
    });
  },
};
