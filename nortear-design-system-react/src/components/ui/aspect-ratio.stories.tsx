import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { AspectRatio } from "./aspect-ratio";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { AspectRatioDocs } from "@/components/docs/AspectRatioDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const LANDSCAPE_SRC =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80";

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs", "layout"],
  parameters: {
    design: figmaDesign("aspectRatio"),
    layout: "centered",
    docs: { page: withAutoDocsTab(AspectRatioDocs) },
  },
  argTypes: {
    ratio: {
      control: { type: "number", step: 0.01 },
      description:
        "Proporção largura/altura (ex.: 16/9 ≈ 1.778, 4/3 ≈ 1.333, 1, 3/4 = 0.75).",
    },
  },
  args: {
    ratio: 16 / 9,
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ["functional.item1", "functional.item3", "accessibility.item1"],
  },
  render: (args) => (
    <div className="" style={{maxWidth: "100%", width: "480px" }} >
      <AspectRatio {...args}>
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const img = await canvas.findByRole("img", {
      name: /Paisagem ao entardecer/i,
    });

    await step("Caixa respeita a proporção do control", async () => {
      // functional.item1 — medir contra args.ratio prova que o control chega ao
      // CSS. O passo anterior verificava só que a imagem tinha um elemento pai.
      const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
      await expect(caixa).not.toBeNull();
      const { width, height } = caixa!.getBoundingClientRect();
      await expect(width).toBeGreaterThan(0);
      await expect(Math.abs(width / height - args.ratio)).toBeLessThan(0.02);
    });

    await step("Imagem tem alt descritivo não vazio", async () => {
      // accessibility.item1
      await expect(img).toHaveAttribute("alt", "Paisagem ao entardecer");
    });

    await step("Imagem preenche a caixa sem distorcer", async () => {
      // functional.item3 — comportamento, não classe.
      await expect(getComputedStyle(img).objectFit).toBe("cover");
      const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]')!;
      await expect(img.getBoundingClientRect().width).toBeCloseTo(
        caixa.getBoundingClientRect().width,
        0,
      );
      await expect(img).toBeVisible();
    });
  },
};
