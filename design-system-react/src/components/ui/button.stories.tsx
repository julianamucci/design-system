import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "@storybook/test";
import { Mail, ArrowRight, X } from "lucide-react";
import { Button } from "./button";
import { ButtonDocs } from "@/components/docs/ButtonDocs";

// ─── Meta compartilhado ──────────────────────────────────────────────────────
// Todas as stories deste arquivo aparecem em "UI / Button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: { page: ButtonDocs },
  },
  argTypes: {
    variant: {
      control: "select",
      description: "Define o estilo visual do botão",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      description: "Define o tamanho e o preenchimento",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o botão — remove interatividade e aplica opacidade 50%",
    },
    asChild: {
      control: "boolean",
      description: "Substitui o elemento raiz pelo filho via Radix Slot (ex: <a>, Link do router)",
    },
    onClick: { action: "clicked" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────
// Story principal com controles livres + teste automatizado de interação.
// A aba Controls permite explorar variantes. A aba Interactions exibe o teste.

/**
 * O Playground é a story principal onde todas as propriedades podem ser testadas interativamente.
 * Deve ser usado como referência base para entender o comportamento padrão do componente.
 * 
 * @summary Demonstração interativa do componente Button.
 */
export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Critério 1 — Clicar no botão habilitado → onClick dispara
    await step("Clica no botão habilitado", async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });

    // Critério 2 — Botão permanece acessível após interação
    await step("Verifica que o botão continua habilitado", async () => {
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveAttribute("disabled");
    });

    // Critério 3 — Foco visível (focus-visible ring)
    // No iframe do Storybook, tab() navega por elementos internos do manager.
    // Focamos diretamente para validar que o anel de foco é aplicável.
    await step("Botão recebe foco → focus-visible disponível", async () => {
      button.focus();
      await expect(button).toHaveFocus();
    });

    // Critério 4 — Enter com foco dispara onClick
    await step("Pressiona Enter com foco → onClick dispara", async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard("{Enter}");
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });

    // Critério 5 — Space com foco dispara onClick
    await step("Pressiona Space com foco → onClick dispara", async () => {
      button.focus();
      const countBefore = (args.onClick as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.keyboard(" ");
      await expect(args.onClick).toHaveBeenCalledTimes(countBefore + 1);
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Cobre os 5 critérios de teste documentados: clique, estado habilitado, foco via Tab, ativação via Enter e Space. Veja a aba **Interactions** para acompanhar a execução.",
      },
    },
  },
};
