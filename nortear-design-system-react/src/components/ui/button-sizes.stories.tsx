import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Plus } from "lucide-react";
import { Button } from "./button";
import {
  buttonIconLgSource,
  buttonIconSmSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonSource,
  buttonSizeLgSource,
  buttonSizeDefaultSource,
  buttonSizeSmSource,
  buttonSizeXsSource,
} from "./button.source";

const meta = {
  title: "Components/Form/Button/Sizes",
  tags: ["form"],
  component: Button,
  parameters: {
    design: figmaDesign("button"),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: buttonSource },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Button>Padrão</Button>,
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // O arquivo desliga os controls: sem args, o `meta` não sabe o tamanho —
      // cada story diz o seu, ou as oito imprimiriam o mesmo snippet.
      source: { transform: buttonSizeDefaultSource },
      description: {
        story: "Tamanho padrão. Use em formulários e diálogos como default.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /padrão/i });
    await expect(btn).toHaveClass("nds-button");
    await expect(btn).not.toHaveClass("nds-button-xs");
    await expect(btn).not.toHaveClass("nds-button-sm");
    await expect(btn).not.toHaveClass("nds-button-lg");
  },
};

export const ExtraSmall: Story = {
  render: () => <Button size="xs">Mínimo</Button>,
  parameters: {
    docs: {
      // Controls desligados: o tamanho é o assunto e precisa vir da story.
      source: { transform: buttonSizeXsSource },
      description: {
        story: "Tamanho mínimo. Use em densidades máximas: chips de filtro e ações dentro de linha de tabela.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /mínimo/i });
    await expect(btn).toHaveClass("nds-button-xs");
  },
};

export const Small: Story = {
  render: () => <Button size="sm">Pequeno</Button>,
  parameters: {
    docs: {
      // Controls desligados: o tamanho é o assunto e precisa vir da story.
      source: { transform: buttonSizeSmSource },
      description: {
        story: "Tamanho pequeno. Use em toolbars e áreas densas.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /pequeno/i });
    await expect(btn).toHaveClass("nds-button-sm");
  },
};

export const Large: Story = {
  render: () => <Button size="lg">Grande</Button>,
  parameters: {
    docs: {
      // Controls desligados: o tamanho é o assunto e precisa vir da story.
      source: { transform: buttonSizeLgSource },
      description: {
        story: "Tamanho grande. Use em CTAs de destaque e hero sections.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole("button", { name: /grande/i });
    await expect(btn).toHaveClass("nds-button-lg");
  },
};

// Os quatro botões icon-only provam a mesma coisa: o nome acessível vem do
// aria-label, não do ícone. Uma função só, como nas outras stacks.
// Os quatro botões icon-only repetem a mesma play de propósito: cada story
// afirma o próprio tamanho. Uma play compartilhada cobriria os quatro com uma
// asserção só, e trocar icon-lg por icon-xs passaria em todas.

export const Icon: Story = {
  render: () => (
    <Button size="icon" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    covers: ["functional.item6", "accessibility.item4"],
    docs: {
      // Sem texto dentro, quem nomeia é o aria-label e o ícone sai da árvore de
      // acessibilidade: composição que o snippet de rótulo do `meta` esconderia.
      source: { transform: buttonIconSource },
      description: {
        story: "Botão ícone padrão. Sempre forneça aria-label descritivo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Adicionar item" });

    await step("Botão icon-only é acessível via aria-label", async () => {
      await expect(button).toBeInTheDocument();
    });

    await step("O tamanho pedido é a classe aplicada", async () => {
      await expect(button).toHaveClass("nds-button-icon");
    });
  },
};

export const IconExtraSmall: Story = {
  render: () => (
    <Button size="icon-xs" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      // Mesma composição de ícone sem rótulo, no tamanho que esta story afirma.
      source: { transform: buttonIconXsSource },
      description: {
        story: "Botão ícone mínimo. Use em linhas de tabela e listas densas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Adicionar item" });

    await step("Botão icon-only é acessível via aria-label", async () => {
      await expect(button).toBeInTheDocument();
    });

    await step("O tamanho pedido é a classe aplicada", async () => {
      await expect(button).toHaveClass("nds-button-icon-xs");
    });
  },
};

export const IconSmall: Story = {
  render: () => (
    <Button size="icon-sm" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      // Mesma composição de ícone sem rótulo, no tamanho que esta story afirma.
      source: { transform: buttonIconSmSource },
      description: {
        story: "Botão ícone pequeno. Use em toolbars compactas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Adicionar item" });

    await step("Botão icon-only é acessível via aria-label", async () => {
      await expect(button).toBeInTheDocument();
    });

    await step("O tamanho pedido é a classe aplicada", async () => {
      await expect(button).toHaveClass("nds-button-icon-sm");
    });
  },
};

export const IconLarge: Story = {
  render: () => (
    <Button size="icon-lg" aria-label="Adicionar item">
      <Plus aria-hidden="true" />
    </Button>
  ),
  parameters: {
    docs: {
      // Mesma composição de ícone sem rótulo, no tamanho que esta story afirma.
      source: { transform: buttonIconLgSource },
      description: {
        story: "Botão ícone grande. Use como FAB ou CTAs visuais.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Adicionar item" });

    await step("Botão icon-only é acessível via aria-label", async () => {
      await expect(button).toBeInTheDocument();
    });

    await step("O tamanho pedido é a classe aplicada", async () => {
      await expect(button).toHaveClass("nds-button-icon-lg");
    });
  },
};
