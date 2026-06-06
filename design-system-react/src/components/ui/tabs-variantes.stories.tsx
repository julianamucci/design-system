import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta = {
  title: "UI/Tabs/Variantes",
  tags: ["navigation"],
  component: Tabs,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes visuais do componente Tabs: default (fundo muted), line (linha inferior) e vertical (orientation).",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
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
          "Variante default — fundo muted arredondado e sombra suave na tab ativa.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list).toHaveAttribute("data-variant", "default");
    await expect(list).toHaveAttribute("aria-label", "Seções do componente");
  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList aria-label="Seções do componente" variant="line">
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
          'variant="line" — visual minimalista sem fundo, com linha inferior na tab ativa. Útil para sub-navegação dentro de páginas.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list).toHaveAttribute("data-variant", "line");
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => (
    <Tabs
      orientation="vertical"
      defaultValue="overview"
      className="w-full max-w-2xl"
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
  parameters: {
    docs: {
      description: {
        story:
          'orientation="vertical" — lista lateral e conteúdo à direita. ArrowUp/ArrowDown navegam entre tabs.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist");
    await expect(list).toHaveAttribute("aria-orientation", "vertical");
  },
};
