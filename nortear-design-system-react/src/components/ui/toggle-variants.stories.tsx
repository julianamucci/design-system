import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Bold, Italic, Eye, List } from "lucide-react";
import { Toggle } from "./toggle";
import {
  toggleWithLabelSource,
  toggleContornoSource,
  toggleSource,
  toggleSizesSource,
} from "./toggle.source";

const meta = {
  title: "UI/Toggle/Variants",
  tags: ["form"],
  component: Toggle,
  parameters: {
    layout: "centered",
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleSource },
      description: {
        component:
          "Variantes visuais do Toggle: default (sem borda), outline (com borda), rótulo visível e a escada de tamanhos.",
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { covers: ["accessibility.item5"] },
  render: () => (
    <Toggle aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step('A variante padrão é a AUSÊNCIA do atributo, não "default"', async () => {
      // Emitir `data-variant="default"` faria o mesmo componente ter dois
      // markups conforme a stack — o CSS já trata a ausência como padrão.
      await expect(toggle).toHaveAttribute("data-slot", "toggle");
      await expect(toggle.getAttribute("data-variant")).toBe(null);
      await expect(toggle.getAttribute("data-size")).toBe(null);
    });

    await step("Sem borda, e sem estado ativo na montagem", async () => {
      // `data-variant` correto com CSS ausente daria uma caixa idêntica à
      // outline — é o defeito que só a medida pega.
      await expect(parseFloat(getComputedStyle(toggle).borderTopWidth)).toBe(0);
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    await step("Icon-only tem nome acessível, e o ícone não é lido", async () => {
      await expect(toggle).toHaveAttribute("aria-label", "Negrito");
      await expect(toggle.textContent?.trim()).toBe("");
      await expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  },
};

export const Outline: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // O par lado a lado é vitrine da comparação; o que a story ensina é a
      // variante de contorno.
      source: { transform: toggleContornoSource },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle variant="outline" aria-label="Itálico">
        <Italic aria-hidden="true" />
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole("button", { name: "Negrito" });
    const contorno = canvas.getByRole("button", { name: "Itálico" });

    await step('"outline" vira data-variant; a padrão fica sem atributo', async () => {
      await expect(contorno).toHaveAttribute("data-variant", "outline");
      await expect(padrao.getAttribute("data-variant")).toBe(null);
    });

    await step("A borda só aparece na variante outline", async () => {
      // O que separa as duas variantes é uma regra do CSS compartilhado; sem
      // esta medida, um `data-variant` correto com CSS ausente passaria.
      await expect(parseFloat(getComputedStyle(padrao).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(contorno).borderTopWidth)).toBeGreaterThan(0);
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA de aria-label é o assunto: o texto visível já nomeia o botão.
      source: { transform: toggleWithLabelSource },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Toggle variant="outline">
        <Eye aria-hidden="true" />
        Mostrar ocultos
      </Toggle>
      <Toggle variant="outline" defaultPressed>
        <List aria-hidden="true" />
        Visão compacta
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O texto visível já é o nome acessível — aria-label seria ruído", async () => {
      const btn = canvas.getByRole("button", { name: "Mostrar ocultos" });
      await expect(btn.getAttribute("aria-label")).toBe(null);
      await expect(canvas.getByText("Mostrar ocultos")).toBeVisible();
    });

    await step("defaultPressed já nasce refletido em aria-pressed", async () => {
      const active = canvas.getByRole("button", { name: "Visão compacta" });
      await expect(active).toHaveAttribute("aria-pressed", "true");
    });

    await step("O toggle com rótulo é mais largo que alto", async () => {
      const box = canvas
        .getByRole("button", { name: "Mostrar ocultos" })
        .getBoundingClientRect();
      await expect(box.width).toBeGreaterThan(box.height);
    });
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      // A escada só significa alguma coisa com os três degraus juntos.
      source: { transform: toggleSizesSource },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Toggle variant="outline" size="sm" aria-label="Negrito pequeno">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle variant="outline" aria-label="Negrito padrão">
        <Bold aria-hidden="true" />
      </Toggle>
      <Toggle variant="outline" size="lg" aria-label="Negrito grande">
        <Bold aria-hidden="true" />
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sm = canvas.getByRole("button", { name: "Negrito pequeno" });
    const md = canvas.getByRole("button", { name: "Negrito padrão" });
    const lg = canvas.getByRole("button", { name: "Negrito grande" });

    await step("Cada degrau emite seu data-size, e o padrão não emite nenhum", async () => {
      await expect(sm).toHaveAttribute("data-size", "sm");
      await expect(md.getAttribute("data-size")).toBe(null);
      await expect(lg).toHaveAttribute("data-size", "lg");
    });

    await step("A escada cresce de verdade na tela", async () => {
      const alturas = [sm, md, lg].map((b) => b.getBoundingClientRect().height);
      await expect(alturas[0]).toBeLessThan(alturas[1]);
      await expect(alturas[1]).toBeLessThan(alturas[2]);
    });

    await step("Sem texto, o toggle é ao menos quadrado e cabe no alvo de toque", async () => {
      for (const btn of [sm, md, lg]) {
        const box = btn.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(box.height - 1);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  },
};
