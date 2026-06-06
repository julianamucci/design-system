import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, screen, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { SelectDocs } from "@/components/docs/SelectDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(SelectDocs) },
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Desabilita o trigger e impede abertura do dropdown",
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML",
    },
  },
  args: {
    disabled: false,
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>("");
    return (
      <div style={{ contain: "layout", minHeight: 200, position: "relative" }}>
        <Select
          {...args}
          value={value}
          onValueChange={(v) => {
            setValue((v ?? "") as string);
            args.onValueChange?.(v as never, {} as never);
          }}
        >
          <SelectTrigger aria-label="Selecionar estado" disabled={args.disabled}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
            <SelectItem value="es">Espírito Santo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    await step("Trigger expõe role=combobox com aria-label", async () => {
      await expect(trigger).toHaveAttribute("aria-label", "Selecionar estado");
    });

    await step("Placeholder 'Selecione...' visível inicialmente", async () => {
      await expect(trigger).toHaveTextContent(/Selecione/);
    });

    if (args.disabled) {
      await step("Disabled — trigger não abre", async () => {
        await expect(trigger).toBeDisabled();
      });
      return;
    }

    await step("Clique no trigger abre o dropdown", async () => {
      await userEvent.click(trigger);
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    await step("Listbox visível em portal (document.body)", async () => {
      // Portal: usar screen, não within(canvasElement)
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
    });

    await step("Selecionar item atualiza SelectValue e fecha dropdown", async () => {
      const option = await waitForPortal("option", { name: "Rio de Janeiro" });
      await userEvent.click(option);
      await expect(args.onValueChange).toHaveBeenCalledWith("rj");
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    });
  },
};
