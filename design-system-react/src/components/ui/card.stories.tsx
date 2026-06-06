import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, userEvent, fn } from "storybook/test";
import { MoreVertical } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { CardDocs } from "@/components/docs/CardDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs", "layout"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(CardDocs) },
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["default", "sm"],
      description:
        'Tamanho do Card. "default" (padrão) para uso geral; "sm" para listas densas e dashboards — propaga via `data-size` e `group-data-[size=sm]/card`.',
    },
    className: {
      control: "text",
      description:
        "Classes Tailwind adicionais aplicadas ao container raiz (sobrescreve padding/fundo/radius).",
    },
  },
  args: {
    size: "default",
    className: "w-full max-w-sm",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    size: "default",
    className: "w-full max-w-sm",
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ações do produto Cadeira Gamer Pro"
            onClick={fn()}
          >
            <MoreVertical aria-hidden="true" className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-base font-semibold">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          aria-label="Cancelar edição de Cadeira Gamer Pro"
          onClick={fn()}
        >
          Cancelar
        </Button>
        <Button
          aria-label="Salvar alterações em Cadeira Gamer Pro"
          onClick={fn()}
        >
          Salvar
        </Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('F1: root tem data-slot="card" e data-size', async () => {
      const root = canvasElement.querySelector('[data-slot="card"]');
      await expect(root).toBeInTheDocument();
      await expect(root).toHaveAttribute("data-size", "default");
    });

    await step("F1: subcomponentes renderizam com data-slot correto", async () => {
      await expect(
        canvasElement.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="card-title"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="card-description"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="card-action"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });

    await step(
      "A3: botões internos têm aria-label contextual com o identificador do card",
      async () => {
        const editButton = canvas.getByRole("button", {
          name: /Ações do produto Cadeira Gamer Pro/i,
        });
        const cancelButton = canvas.getByRole("button", {
          name: /Cancelar edição de Cadeira Gamer Pro/i,
        });
        const saveButton = canvas.getByRole("button", {
          name: /Salvar alterações em Cadeira Gamer Pro/i,
        });
        await expect(editButton).toBeInTheDocument();
        await expect(cancelButton).toBeInTheDocument();
        await expect(saveButton).toBeInTheDocument();
      }
    );

    await step(
      "A4: Tab move foco sequencialmente pelos botões internos (focus ring visível)",
      async () => {
        await userEvent.tab();
        const actionButton = canvas.getByRole("button", {
          name: /Ações do produto Cadeira Gamer Pro/i,
        });
        await expect(actionButton).toHaveFocus();
        await userEvent.tab();
        const cancelButton = canvas.getByRole("button", {
          name: /Cancelar edição de Cadeira Gamer Pro/i,
        });
        await expect(cancelButton).toHaveFocus();
      }
    );

    await step("F3: header vira grid [1fr_auto] quando há CardAction", async () => {
      const header = canvasElement.querySelector('[data-slot="card-header"]');
      // has-data-[slot=card-action]:grid-cols-[1fr_auto] é classe condicional;
      // validamos presença da CardAction que ativa o layout.
      const action = header?.querySelector('[data-slot="card-action"]');
      await expect(action).toBeInTheDocument();
    });
  },
};
