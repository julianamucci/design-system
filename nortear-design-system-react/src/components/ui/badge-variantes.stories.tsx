import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge/Variantes",
  tags: ["feedback"],
  component: Badge,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Cada variante do Badge reflete um nível de hierarquia visual: default destaca, secondary informa, destructive alerta e outline oferece baixa ênfase.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O que a variante promete é o desenho, e desenho se mede: cor de fundo, cor de
 * texto e borda. As plays antigas só perguntavam se o texto estava na tela —
 * passavam com as quatro variantes renderizando idênticas.
 */
const pintura = (el: HTMLElement) => {
  const s = getComputedStyle(el);
  return {
    fundo: s.backgroundColor,
    texto: s.color,
    borda: s.borderTopColor,
    larguraBorda: s.borderTopWidth,
  };
};
const transparente = (cor: string) => cor === "rgba(0, 0, 0, 0)" || cor === "transparent";

export const Default: Story = {
  parameters: { covers: ["functional.item1", "visual.item2"] },
  render: () => <Badge variant="default">Novo</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Novo");
    await expect(badge).toHaveAttribute("data-variant", "default");
    // functional.item1 — fundo preenchido, texto contrastante, borda invisível.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(fundo).not.toBe(texto);
    await expect(transparente(borda)).toBe(true);
  },
};

export const Secondary: Story = {
  parameters: { covers: ["functional.item2", "visual.item2"] },
  render: () => <Badge variant="secondary">Beta</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Beta");
    await expect(badge).toHaveAttribute("data-variant", "secondary");
    // functional.item2 — preenchida como a default, mas em outra cor: é isso
    // que faz a hierarquia entre as duas existir.
    const { fundo, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(true);

    const referencia = document.createElement("span");
    referencia.className = "nds-badge nds-badge-default";
    canvasElement.appendChild(referencia);
    const fundoDefault = getComputedStyle(referencia).backgroundColor;
    referencia.remove();
    await expect(fundo).not.toBe(fundoDefault);
  },
};

export const Destructive: Story = {
  parameters: { covers: ["functional.item3", "accessibility.item3", "visual.item2"] },
  render: () => <Badge variant="destructive">Urgente</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Urgente");
    await expect(badge).toHaveAttribute("data-variant", "destructive");
    // functional.item3 — fundo suave E borda colorida, com o texto no
    // --foreground. É a combinação que sustenta os 4.5:1 documentados: cor
    // sinaliza, contraste vem do texto neutro.
    const { fundo, texto, borda } = pintura(badge);
    await expect(transparente(fundo)).toBe(false);
    await expect(transparente(borda)).toBe(false);

    const referencia = document.createElement("span");
    referencia.className = "nds-badge nds-badge-outline";
    canvasElement.appendChild(referencia);
    const textoNeutro = getComputedStyle(referencia).color;
    referencia.remove();
    await expect(texto).toBe(textoNeutro);
  },
};

export const Outline: Story = {
  parameters: { covers: ["functional.item4", "visual.item2"] },
  render: () => <Badge variant="outline">Rascunho</Badge>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText("Rascunho");
    await expect(badge).toHaveAttribute("data-variant", "outline");
    // functional.item4 — só borda: sem fundo é o que a diferencia das outras.
    const { fundo, borda, larguraBorda } = pintura(badge);
    await expect(transparente(fundo)).toBe(true);
    await expect(transparente(borda)).toBe(false);
    await expect(parseFloat(larguraBorda)).toBeGreaterThan(0);
  },
};
