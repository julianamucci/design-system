import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Label } from "./label";
import { Input } from "./input";
import { labelSource } from "./label.source";
import { LabelDocs } from "@/components/docs/LabelDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs", "form"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(LabelDocs),
      // O painel imprimia a árvore do `render`, com o andaime da coluna e os
      // ids da story. A transform devolve o par rótulo + campo que compila
      // colado, e cascateia para todas as stories do arquivo.
      source: { transform: labelSource },
    },
  },
  argTypes: {
    children: {
      control: "text",
      description: "Texto do rótulo. Use substantivo ou frase nominal curta.",
      table: { type: { summary: "React.ReactNode" }, defaultValue: { summary: "—" } },
    },
    className: {
      control: "text",
      description: "Classes utilitárias .nds-* adicionais para personalização do rótulo.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
  },
  args: {
    children: "Nome completo",
    className: "",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ["functional.item1", "accessibility.item2"],
  },
  render: (args) => (
    <div className="nds-stack nds-w-xs" data-spacing="xs">
      <Label htmlFor="playground-label" {...args} />
      <Input id="playground-label" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector<HTMLLabelElement>('label[data-slot="label"]')!;

    await step("O rótulo é um <label> com a classe do design system", async () => {
      await expect(label.tagName.toLowerCase()).toBe("label");
      await expect(label).toHaveClass("nds-label");
    });

    await step("O campo é alcançável pelo texto do rótulo", async () => {
      // É o que `accessibility.item2` promete: `getByLabelText` só encontra o
      // campo se a associação `for`/`id` estiver de pé. Conferir o atributo
      // sozinho passaria com um id que não aponta para nada.
      const campo = canvas.getByLabelText("Nome completo");
      await expect(campo).toBe(canvasElement.querySelector("#playground-label"));
    });

    await step("Clicar no rótulo move o foco para o campo", async () => {
      // Precondição própria: o replay reexecuta no mesmo DOM, e sem tirar o
      // foco daqui a asserção passaria pelo estado que a rodada anterior deixou.
      const campo = canvasElement.querySelector<HTMLInputElement>("#playground-label")!;
      campo.blur();
      await expect(campo).not.toHaveFocus();
      await userEvent.click(label);
      await expect(campo).toHaveFocus();
    });
  },
};
