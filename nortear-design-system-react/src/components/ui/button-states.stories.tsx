import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  buttonCarregandoSource,
  buttonDesabilitadoSource,
  buttonInvalidoSource,
  buttonSource,
} from "./button.source";
import { falhasDeAnel } from "@shared/testing/button-probe";

const meta = {
  title: "UI/Button/States",
  tags: ["form"],
  component: Button,
  parameters: {
    design: figmaDesign("button"),
    docs: {
      source: { transform: buttonSource },
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  render: (args) => (
    <Button {...args} disabled>
      Salvar
    </Button>
  ),
  parameters: {
    covers: ["functional.item2", "visual.item4"],
    docs: {
      // O `disabled` do render não passa pelos args do `meta`, e é ele — o
      // atributo nativo — que tira o botão da tabulação e mata o clique.
      source: { transform: buttonDesabilitadoSource },
      description: {
        story: "Estado desabilitado. Previne cliques e reduz opacidade para 50%.",
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão possui atributo disabled", async () => {
      await expect(button).toBeDisabled();
    });

    await step("Tab pula o botão desabilitado", async () => {
      // accessibility.keyboard.disabled afirma isso e nada verificava.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).not.toHaveFocus();
    });

    await step("Clique não dispara onClick quando disabled", async () => {
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};

export const Loading: Story = {
  render: (args) => (
    <Button {...args} disabled aria-busy="true">
      {/* .nds-spin (button.css) tem guarda de prefers-reduced-motion;
          .nds-animate-spin (utilities.css) não tem. */}
      <Loader2 aria-hidden="true" className="nds-button-icon-svg nds-spin" />
      Salvando…
    </Button>
  ),
  parameters: {
    docs: {
      // Carregar é disabled + aria-busy + rótulo em progresso, com o ícone
      // girando por `.nds-spin`: nada disso cabe nos args do `meta`.
      source: { transform: buttonCarregandoSource },
      description: {
        story: "Estado de carregamento. Use disabled + aria-busy e substitua o label por estado progressivo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão tem aria-busy durante loading", async () => {
      await expect(button).toHaveAttribute("aria-busy", "true");
    });

    await step("Botão está desabilitado durante loading", async () => {
      await expect(button).toBeDisabled();
    });
  },
};

export const FocusVisible: Story = {
  render: (args) => <Button {...args}>Foco visível</Button>,
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      // Sem override: o anel é regra de CSS em :focus-visible, não marcação —
      // um snippet próprio teria de inventar atributo que ninguém escreve.
      description: {
        story: "Estado de foco por teclado. Navegue com Tab: o anel só aparece em :focus-visible, não no clique.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Tab leva o foco ao botão", async () => {
      // .focus() programático não é navegação por teclado: passaria até com
      // tabindex="-1". E é o Tab que caracteriza a modalidade de entrada,
      // sem a qual o :focus-visible desta story não existe.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(button).toHaveFocus();
    });

    await step("O anel de foco por teclado está aplicado", async () => {
      // accessibility.item3 — o item promete anel VISÍVEL ao navegar por
      // teclado; toHaveFocus sozinho não distingue foco de mouse.
      await expect(button.matches(":focus-visible")).toBe(true);
      // E o anel tem de ser PERCEPTÍVEL, não só existir. Medido antes desta
      // rodada, a banda colorida compunha 1.87:1 a 2.42:1 contra a superfície
      // do app nos seis pares tema×modo — a meia opacidade de `--ring` comia
      // o indicador inteiro. WCAG 1.4.11 (Non-text Contrast, AA) pede 3:1.
      // `matches(:focus-visible)` sozinho passava com o anel invisível.
      await expect(falhasDeAnel(canvasElement, 3)).toEqual([]);
    });
  },
};

export const Invalid: Story = {
  render: (args) => (
    <Button {...args} variant="outline" aria-invalid="true">
      Formulário inválido
    </Button>
  ),
  parameters: {
    docs: {
      // `aria-invalid` é o que o leitor de tela anuncia, e ele não é arg do
      // `meta`; a borda de erro é consequência dele no CSS, não uma variante.
      source: { transform: buttonInvalidoSource },
      description: {
        story: "Estado inválido. Use aria-invalid=\"true\" para sinalizar problemas de validação.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await step("Botão tem aria-invalid=true", async () => {
      await expect(button).toHaveAttribute("aria-invalid", "true");
    });
  },
};
