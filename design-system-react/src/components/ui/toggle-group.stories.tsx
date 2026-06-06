import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { ToggleGroupDocs } from "@/components/docs/ToggleGroupDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleGroupDocs) },
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Direção da navegação por setas",
    },
    variant: {
      control: "inline-radio",
      options: ["default", "outline"],
      description: "Estilo visual herdado pelos items",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Altura herdada pelos items",
    },
    spacing: {
      control: { type: "number", min: 0, max: 4, step: 1 },
      description: "Distância entre items (0 = segmented)",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita todos os items",
    },
  },
  args: {
    orientation: "horizontal",
    variant: "default",
    size: "default",
    spacing: 0,
    disabled: false,
    onValueChange: fn(),
    "aria-label": "Alinhamento do texto",
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ToggleGroup
      {...args}
      defaultValue={["left"]}
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });
    const right = canvas.getByRole("button", { name: "Alinhar à direita" });

    await step("ToggleGroup com aria-label do grupo está presente", async () => {
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group).toBeInTheDocument();
      await expect(group).toHaveAttribute("aria-label", "Alinhamento do texto");
    });

    await step("Cada item icon-only tem aria-label próprio", async () => {
      await expect(left).toHaveAttribute("aria-label", "Alinhar à esquerda");
      await expect(center).toHaveAttribute("aria-label", "Centralizar");
      await expect(right).toHaveAttribute("aria-label", "Alinhar à direita");
    });

    await step("Inicia com 'left' pressionado (defaultValue)", async () => {
      await expect(left).toHaveAttribute("aria-pressed", "true");
      await expect(center).toHaveAttribute("aria-pressed", "false");
    });

    await step("Roving tabindex — apenas 1 item com tabIndex=0", async () => {
      const items = canvas.getAllByRole("button");
      const focusable = items.filter((el) => el.getAttribute("tabindex") === "0" || el.tabIndex === 0);
      // O item pressionado ou o primeiro deve ser o único focável via Tab
      await expect(focusable.length).toBeLessThanOrEqual(1);
    });

    await step("Clique em item dispara onValueChange e atualiza aria-pressed", async () => {
      await userEvent.click(center);
      await expect(args.onValueChange).toHaveBeenCalled();
      await expect(center).toHaveAttribute("aria-pressed", "true");
      await expect(left).toHaveAttribute("aria-pressed", "false");
    });

    await step("ArrowRight move o foco para o próximo item (roving)", async () => {
      center.focus();
      await expect(center).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(right).toHaveFocus();
    });

    await step("Space alterna o item focado", async () => {
      right.focus();
      await userEvent.keyboard(" ");
      await expect(right).toHaveAttribute("aria-pressed", "true");
    });
  },
};
