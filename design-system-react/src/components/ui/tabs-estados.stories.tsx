import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta = {
  title: "UI/Tabs/Estados",
  tags: ["navigation"],
  component: Tabs,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados visuais e comportamentais do componente Tabs: default, active, focus e disabled.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default + Active ─────────────────────────────────────────────────────────

export const DefaultEActive: Story = {
  name: "Default e Active",
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
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
  parameters: {
    docs: {
      description: {
        story:
          'Primeira tab ativa via defaultValue — recebe data-active, aria-selected="true" e visual destacado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await step("Tab ativa tem aria-selected=true", async () => {
      await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    await step("Tabs inativas têm aria-selected=false", async () => {
      await expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      await expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    });
  },
};

// ─── Focus visible ────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
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
  parameters: {
    docs: {
      description: {
        story:
          "Navegação por teclado. Tab move foco para a tab ativa; ArrowRight/Left percorrem; Home/End vão aos extremos. Focus ring ring-[3px] visível.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await step("ArrowRight ativa próxima tab (mode automatic)", async () => {
      tabs[0].focus();
      await expect(tabs[0]).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(tabs[1]).toHaveAttribute("aria-selected", "true")
      );
    });

    await step("Home volta para a primeira tab", async () => {
      await userEvent.keyboard("{Home}");
      await waitFor(() =>
        expect(tabs[0]).toHaveAttribute("aria-selected", "true")
      );
    });

    await step("End vai para a última tab", async () => {
      await userEvent.keyboard("{End}");
      await waitFor(() =>
        expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true")
      );
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties" disabled>
          Propriedades
        </TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tab disabled — opacity-50 e pointer-events-none. Não recebe foco nem ativa por clique.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await step("Tab desabilitada expõe estado disabled", async () => {
      await expect(tabs[1]).toBeDisabled();
    });

    await step("Clicar em tab disabled não ativa o painel", async () => {
      await userEvent.click(tabs[1], { pointerEventsCheck: 0 });
      await expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });
  },
};
