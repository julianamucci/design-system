import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { AspectRatio } from "./aspect-ratio";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

const LANDSCAPE_SRC =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80";
const PRODUCT_SRC =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
const SQUARE_SRC =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";
const PORTRAIT_SRC =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80";

const meta = {
  title: "UI/AspectRatio/Variantes",
  tags: ["layout"],
  component: AspectRatio,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Ratios canônicos adotados pelo design system: 16/9, 4/3, 1/1, 3/4 e 21/9. AspectRatio não tem variantes via cva() — os ratios são presets de uso, não variantes CSS.",
      },
    },
  },
  args: { ratio: 16 / 9 },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixteenNine: Story = {
  render: () => (
    <div className="w-[480px] max-w-full">
      <AspectRatio ratio={16 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt="Paisagem ao entardecer"
          loading="lazy"
          decoding="async"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img");
    await expect(img).toBeInTheDocument();
  },
};

export const FourThree: Story = {
  render: () => (
    <div className="w-[420px] max-w-full">
      <AspectRatio ratio={4 / 3}>
        <ImageWithFallback
          src={PRODUCT_SRC}
          alt="Tênis de corrida"
          loading="lazy"
          decoding="async"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img");
    await expect(img).toBeInTheDocument();
  },
};

export const Square: Story = {
  render: () => (
    <div className="w-[280px]">
      <AspectRatio ratio={1}>
        <ImageWithFallback
          src={SQUARE_SRC}
          alt="Avatar de Maria Silva"
          loading="lazy"
          decoding="async"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img");
    await expect(img).toBeInTheDocument();
  },
};

export const ThreeFour: Story = {
  render: () => (
    <div className="w-[320px]">
      <AspectRatio ratio={3 / 4}>
        <ImageWithFallback
          src={PORTRAIT_SRC}
          alt="Capa de retrato vertical"
          loading="lazy"
          decoding="async"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img");
    await expect(img).toBeInTheDocument();
  },
};

export const UltraWide: Story = {
  render: () => (
    <div className="w-[640px] max-w-full">
      <AspectRatio ratio={21 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt="Panorâmica da cordilheira"
          loading="lazy"
          decoding="async"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("img");
    await expect(img).toBeInTheDocument();
  },
};
