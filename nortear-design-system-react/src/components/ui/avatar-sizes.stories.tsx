import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import {
  avatar2xlSource,
  avatarLgSource,
  avatarSmSource,
  avatarSource,
  avatarXlSource,
} from "./avatar.source";

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
      source: { transform: avatarSource },
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
const boxOf = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector('[data-slot="avatar"]');
  if (!root) throw new Error('avatar não renderizou');
  return root.getBoundingClientRect();
};

export const Sm: Story = {
  name: "sm (24px)",
  // O preset está cravado no `render` e o arquivo desliga os controls: sem
  // override o painel mostraria o md do padrão.
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: { source: { transform: avatarSmSource } },
  },
  render: () => (
    <Avatar size="sm">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="avatar"]'),
    ).toHaveAttribute("data-size", "sm");
    const { width, height } = boxOf(canvasElement);
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
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    // Sem passar size: o padrão do componente é o preset md, e não um valor
    // que não casa com seletor nenhum.
    await expect(
      canvasElement.querySelector('[data-slot="avatar"]'),
    ).toHaveAttribute("data-size", "md");
    const { width, height } = boxOf(canvasElement);
    await expect(Math.abs(width - 32)).toBeLessThan(0.5);
    await expect(Math.abs(height - 32)).toBeLessThan(0.5);
  },
};

export const Lg: Story = {
  name: "lg (40px)",
  // Mesmo motivo do sm: o preset não vem dos args.
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: { source: { transform: avatarLgSource } },
  },
  render: () => (
    <Avatar size="lg">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = boxOf(canvasElement);
    await expect(Math.abs(width - 40)).toBeLessThan(0.5);
    await expect(Math.abs(height - 40)).toBeLessThan(0.5);
  },
};

export const Xl: Story = {
  name: "xl (48px)",
  // Idem — xl e 2xl nem existiam na API antes, e o snippet precisa dizê-lo.
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: { source: { transform: avatarXlSource } },
  },
  render: () => (
    <Avatar size="xl">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = boxOf(canvasElement);
    await expect(Math.abs(width - 48)).toBeLessThan(0.5);
    await expect(Math.abs(height - 48)).toBeLessThan(0.5);
  },
};

export const TwoXl: Story = {
  name: "2xl (64px)",
  // Idem.
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: { source: { transform: avatar2xlSource } },
  },
  render: () => (
    <Avatar size="2xl">
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = boxOf(canvasElement);
    await expect(Math.abs(width - 64)).toBeLessThan(0.5);
    await expect(Math.abs(height - 64)).toBeLessThan(0.5);
  },
};
