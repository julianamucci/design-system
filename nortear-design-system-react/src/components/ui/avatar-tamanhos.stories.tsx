import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const IMG_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "UI/Avatar/Sizes",
  tags: ["display"],
  component: Avatar,
  parameters: {
    design: figmaDesign("avatar"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Presets de tamanho da prop `size`: sm (24px), md (32px, padrão), lg (40px), xl (48px) e 2xl (64px).",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O diâmetro é o contrato do preset. Medir o elemento renderizado prova que
 * `data-size` chegou ao CSS — as stories antigas fixavam a altura por estilo
 * inline na própria story e depois conferiam esse mesmo estilo, então passavam
 * mesmo com o preset quebrado.
 */
const caixaDo = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector('[data-slot="avatar"]');
  if (!root) throw new Error('avatar não renderizou');
  return root.getBoundingClientRect();
};

export const Sm: Story = {
  name: "sm (24px)",
  parameters: { covers: ["functional.item6", "visual.item3"] },
  render: () => (
    <Avatar size="sm">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="avatar"]'),
    ).toHaveAttribute("data-size", "sm");
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 24)).toBeLessThan(0.5);
    await expect(Math.abs(height - 24)).toBeLessThan(0.5);
  },
};

export const Md: Story = {
  name: "md (32px · default)",
  parameters: { covers: ["functional.item6", "visual.item3"] },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    // Sem passar size: o padrão do componente é o preset md, e não um valor
    // que não casa com seletor nenhum.
    await expect(
      canvasElement.querySelector('[data-slot="avatar"]'),
    ).toHaveAttribute("data-size", "md");
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 32)).toBeLessThan(0.5);
    await expect(Math.abs(height - 32)).toBeLessThan(0.5);
  },
};

export const Lg: Story = {
  name: "lg (40px)",
  parameters: { covers: ["functional.item6", "visual.item3"] },
  render: () => (
    <Avatar size="lg">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 40)).toBeLessThan(0.5);
    await expect(Math.abs(height - 40)).toBeLessThan(0.5);
  },
};

export const Xl: Story = {
  name: "xl (48px)",
  parameters: { covers: ["functional.item6", "visual.item3"] },
  render: () => (
    <Avatar size="xl">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 48)).toBeLessThan(0.5);
    await expect(Math.abs(height - 48)).toBeLessThan(0.5);
  },
};

export const TwoXl: Story = {
  name: "2xl (64px)",
  parameters: { covers: ["functional.item6", "visual.item3"] },
  render: () => (
    <Avatar size="2xl">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback aria-hidden="true">MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = caixaDo(canvasElement);
    await expect(Math.abs(width - 64)).toBeLessThan(0.5);
    await expect(Math.abs(height - 64)).toBeLessThan(0.5);
  },
};
