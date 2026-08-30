import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { AspectRatio } from "./aspect-ratio";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  aspectRatioQuadradoSource,
  aspectRatioQuatroTercosSource,
  aspectRatioSource,
  aspectRatioTresQuartosSource,
  aspectRatioUltraWideSource,
} from "./aspect-ratio.source";

const LANDSCAPE_SRC =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80";
const PRODUCT_SRC =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
const SQUARE_SRC =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";
const PORTRAIT_SRC =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80";

const meta = {
  title: "Primitives/Layout/AspectRatio/Variants",
  tags: ["layout"],
  component: AspectRatio,
  parameters: {
    design: figmaDesign("aspectRatio"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: aspectRatioSource },
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
  parameters: { covers: ["functional.item1", "visual.item1"] },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "480px" }}>
      <AspectRatio ratio={16 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt="Paisagem ao entardecer"
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 16 / 9)).toBeLessThan(0.02);
  },
};

export const FourThree: Story = {
  // O `render` crava o ratio e o `meta` do arquivo continua em 16/9: sem
  // override o painel mostraria a proporção errada.
  parameters: {
    covers: ["visual.item2"],
    docs: { source: { transform: aspectRatioQuatroTercosSource } },
  },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "420px" }}>
      <AspectRatio ratio={4 / 3}>
        <ImageWithFallback
          src={PRODUCT_SRC}
          alt="Tênis de corrida"
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 4 / 3)).toBeLessThan(0.02);
  },
};

export const Square: Story = {
  // Mesmo motivo do 4/3: a proporção da story não vem dos args.
  parameters: {
    covers: ["functional.item2", "visual.item3"],
    docs: { source: { transform: aspectRatioQuadradoSource } },
  },
  render: () => (
    <div className="" style={{ width: "280px" }}>
      <AspectRatio ratio={1}>
        <ImageWithFallback
          src={SQUARE_SRC}
          alt="Avatar de Maria Silva"
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 1)).toBeLessThan(0.02);
  },
};

export const ThreeFour: Story = {
  // Idem — o retrato vertical é o assunto, e ele mora no `render`.
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: aspectRatioTresQuartosSource } },
  },
  render: () => (
    <div className="nds-w-xs">
      <AspectRatio ratio={3 / 4}>
        <ImageWithFallback
          src={PORTRAIT_SRC}
          alt="Capa de retrato vertical"
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 3 / 4)).toBeLessThan(0.02);
  },
};

export const UltraWide: Story = {
  // Idem — a panorâmica 21/9 não é descrita por arg nenhum deste arquivo.
  parameters: {
    covers: ["visual.item5"],
    docs: { source: { transform: aspectRatioUltraWideSource } },
  },
  render: () => (
    <div className="nds-w-xl" style={{ maxWidth: "100%" }}>
      <AspectRatio ratio={21 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt="Panorâmica da cordilheira"
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(box).not.toBeNull();
    // A proporção É o componente: medir a caixa renderizada prova que o ratio
    // chegou ao CSS, seja por --ratio, por padding ou pelo que a lib usar.
    const { width, height } = box!.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width / height - 21 / 9)).toBeLessThan(0.02);
  },
};
