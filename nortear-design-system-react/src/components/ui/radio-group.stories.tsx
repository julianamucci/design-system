import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { RadioGroupDocs } from "@/components/docs/RadioGroupDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(RadioGroupDocs) },
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Desabilita todos os itens do grupo",
    },
    orientation: {
      control: { type: "radio" },
      options: ["vertical", "horizontal"],
      description: "Direção da navegação por setas",
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML",
    },
  },
  args: {
    disabled: false,
    orientation: "vertical",
    onValueChange: fn(),
  },
} as Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>("");
    return (
      <RadioGroup
        {...args}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          args.onValueChange?.(v, undefined as never);
        }}
        aria-label="Forma de pagamento"
      >
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="cartao" id="pg-cartao" disabled={args.disabled} />
          <Label htmlFor="pg-cartao">Cartão de crédito</Label>
        </div>
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="pix" id="pg-pix" disabled={args.disabled} />
          <Label htmlFor="pg-pix">Pix</Label>
        </div>
        <div className="nds-cluster" data-spacing="sm">
          <RadioGroupItem value="boleto" id="pg-boleto" disabled={args.disabled} />
          <Label htmlFor="pg-boleto">Boleto bancário</Label>
        </div>
      </RadioGroup>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole("radio");

    await step("Grupo tem role=radiogroup", async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toBeInTheDocument();
    });

    await step("Cada item tem role=radio e Label associado", async () => {
      await expect(radios).toHaveLength(3);
      await expect(canvas.getByText("Cartão de crédito")).toBeVisible();
      await expect(canvas.getByText("Pix")).toBeVisible();
      await expect(canvas.getByText("Boleto bancário")).toBeVisible();
    });

    if (!args.disabled) {
      await step("Clique no primeiro item dispara onValueChange", async () => {
        await userEvent.click(radios[0]);
        // base-ui ≥1.6 passa (value, eventDetails) — asserta só no value
        await expect(args.onValueChange).toHaveBeenCalled();
        const mock = args.onValueChange as unknown as { mock: { lastCall?: unknown[] } };
        await expect(mock.mock.lastCall?.[0]).toBe("cartao");
      });

      await step("Primeiro item fica com aria-checked=true", async () => {
        await expect(radios[0]).toHaveAttribute("aria-checked", "true");
        await expect(radios[1]).toHaveAttribute("aria-checked", "false");
      });

      await step("ArrowDown move e seleciona o próximo item", async () => {
        radios[0].focus();
        await userEvent.keyboard("{ArrowDown}");
        await expect(radios[1]).toHaveAttribute("aria-checked", "true");
        await expect(radios[0]).toHaveAttribute("aria-checked", "false");
      });
    }
  },
};
