import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "@storybook/test";
import { Loader2 } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button/Estados",
  component: Button,
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    children: "Botão",
    variant: "default",
    size: "default",
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Critério a11y — disabled no DOM → leitores de tela anunciam "indisponível"
    await step("Botão possui atributo disabled no DOM", async () => {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("disabled");
    });

    // Critério funcional — onClick não dispara quando disabled
    await step("Clicar no botão disabled não dispara onClick", async () => {
      // Ignora o check de pointer-events pois o Tailwind desabilita via CSS
      await userEvent.click(button, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Estado desabilitado — remove pointer-events e aplica opacidade 50%. Não use como único feedback de validação; combine com mensagens de erro contextuais.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Loading",
  render: (args) => (
    <Button {...args} disabled>
      <Loader2 className="h-4 w-4 animate-spin" />
      Aguarde…
    </Button>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Verifica que o padrão loading aplica disabled corretamente
    await step("Botão em loading possui atributo disabled", async () => {
      await expect(button).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Estado de carregamento. O Shadcn/UI não possui uma prop `loading` nativa — o padrão é combinar `disabled` com um ícone `Loader2` animado via `animate-spin`. Isso impede cliques duplos e dá feedback visual ao usuário.",
      },
    },
  },
};

