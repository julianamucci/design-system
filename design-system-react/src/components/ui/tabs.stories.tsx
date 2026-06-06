import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { TabsDocs } from "@/components/docs/TabsDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs", "navigation"],
  parameters: {
    docs: { page: withAutoDocsTab(TabsDocs) },
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Direção da navegação por setas e do layout.",
    },
    defaultValue: {
      control: "text",
      description: "Valor inicial da tab ativa (não-controlado).",
    },
  },
  args: {
    orientation: "horizontal",
    defaultValue: "overview",
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <Tabs
      key={`${args.orientation}-${String(args.defaultValue)}`}
      {...args}
      className="w-full max-w-lg"
    >
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("TabsList expõe role=tablist com aria-label", async () => {
      const list = canvas.getByRole("tablist");
      await expect(list).toHaveAttribute("aria-label", "Seções do componente");
    });

    await step("Primeira tab inicia selecionada via defaultValue", async () => {
      const tabs = canvas.getAllByRole("tab");
      await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      await expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    await step("Clicar em uma tab ativa o painel correspondente", async () => {
      const tabs = canvas.getAllByRole("tab");
      await userEvent.click(tabs[1]);
      await waitFor(() =>
        expect(tabs[1]).toHaveAttribute("aria-selected", "true")
      );
      const panel = canvas.getByRole("tabpanel");
      await expect(panel).toHaveTextContent(/propriedades/i);
    });

    await step("ArrowRight move para a próxima tab (mode automatic)", async () => {
      const tabs = canvas.getAllByRole("tab");
      tabs[1].focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(tabs[2]).toHaveAttribute("aria-selected", "true")
      );
    });

    await step("Home/End vão para primeira/última tab", async () => {
      const tabs = canvas.getAllByRole("tab");
      await userEvent.keyboard("{Home}");
      await waitFor(() =>
        expect(tabs[0]).toHaveAttribute("aria-selected", "true")
      );
      await userEvent.keyboard("{End}");
      await waitFor(() =>
        expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true")
      );
    });
  },
};
