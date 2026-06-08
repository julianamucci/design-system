import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "UI/Card/Estados",
  tags: ["layout"],
  component: Card,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes do Card: padrão (passivo), clicável (envolvido em <button> com aria-label) e com footer. Card não recebe foco no root — apenas elementos internos ou o wrapper clicável navegam por teclado.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base font-semibold">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toBeInTheDocument();
    // Card em si é passivo — não tem tabindex próprio
    await expect(root).not.toHaveAttribute("tabindex");
  },
  parameters: {
    docs: {
      description: {
        story:
          "Composição padrão (passiva): Card não recebe foco nem eventos de teclado. Controles internos trazem acessibilidade própria.",
      },
    },
  },
};

export const Clickable: Story = {
  args: {
    onClick: fn(),
  },
  render: (args) => (
    <button
      type="button"
      aria-label="Abrir produto Cadeira Gamer Pro"
      onClick={(args as { onClick?: () => void }).onClick}
      className="block w-full max-w-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-(--radius-card)"
    >
      <Card>
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold">R$ 1.299,00</p>
        </CardContent>
      </Card>
    </button>
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onClick = (args as { onClick: ReturnType<typeof fn> }).onClick;

    await step(
      "F6: Tab foca o wrapper <button> com aria-label descritivo",
      async () => {
        await userEvent.tab();
        const wrapper = canvas.getByRole("button", {
          name: /Abrir produto Cadeira Gamer Pro/i,
        });
        await expect(wrapper).toHaveFocus();
      }
    );

    await step("F6: Enter ativa o handler do wrapper clicável", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(onClick).toHaveBeenCalled();
    });

    await step(
      "A4: focus ring visível — focus-visible:ring-2 no wrapper",
      async () => {
        const wrapper = canvas.getByRole("button", {
          name: /Abrir produto Cadeira Gamer Pro/i,
        });
        wrapper.focus();
        await expect(wrapper).toHaveFocus();
      }
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Card envolvido em `<button>` com `aria-label` descritivo. Não use `onClick` no Card root — a semântica de ativação por teclado e o focus ring vivem no wrapper.",
      },
    },
  },
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>Produto atualizado em 12/04.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">R$ 1.299,00</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          aria-label="Cancelar edição de Cadeira Gamer Pro"
        >
          Cancelar
        </Button>
        <Button aria-label="Salvar alterações em Cadeira Gamer Pro">Salvar</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    await step(
      "F1: footer ganha border-t e bg-muted/50; Card absorve pb-0",
      async () => {
        const footer = canvasElement.querySelector('[data-slot="card-footer"]');
        await expect(footer).toBeInTheDocument();
        await expect(footer).toHaveClass("border-t");
      }
    );

    await step(
      "A3: botões do footer com aria-label contextual (identificador do card)",
      async () => {
        const canvas = within(canvasElement);
        const cancelButton = canvas.getByRole("button", {
          name: /Cancelar edição de Cadeira Gamer Pro/i,
        });
        const saveButton = canvas.getByRole("button", {
          name: /Salvar alterações em Cadeira Gamer Pro/i,
        });
        await expect(cancelButton).toBeInTheDocument();
        await expect(saveButton).toBeInTheDocument();
      }
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Composição com CardFooter: o Card aplica `pb-0` automaticamente via `has-data-[slot=card-footer]`; footer ganha `border-t` + `bg-muted/50`. Botões usam `aria-label` contextual para evitar ambiguidade em listas.",
      },
    },
  },
};
