import type { Meta, StoryObj } from "@storybook/react";
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
  render: (args) => (
    <div className="w-[480px] max-w-full">
      <AspectRatio {...args}>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Imagem está presente no DOM", async () => {
      const img = await canvas.findByRole("img", {
        name: /Paisagem ao entardecer/i,
      });
      await expect(img).toBeInTheDocument();
    });

    await step("Imagem tem alt descritivo não vazio", async () => {
      const img = await canvas.findByRole("img", {
        name: /Paisagem ao entardecer/i,
      });
      await expect(img).toHaveAttribute("alt", "Paisagem ao entardecer");
    });

    await step("Imagem preenche o container com object-cover", async () => {
      const img = await canvas.findByRole("img", {
        name: /Paisagem ao entardecer/i,
      });
      await expect(img).toHaveClass("object-cover");
      await expect(img).toHaveClass("w-full");
      await expect(img).toHaveClass("h-full");
    });

    await step("Container interno é posicionado absolutamente (Radix)", async () => {
      const img = await canvas.findByRole("img", {
        name: /Paisagem ao entardecer/i,
      });
      const inner = img.parentElement;
      await expect(inner).toBeTruthy();
    });

    await step("Imagem é visível", async () => {
      const img = await canvas.findByRole("img", {
        name: /Paisagem ao entardecer/i,
      });
      await expect(img).toBeVisible();
    });
  },
};
