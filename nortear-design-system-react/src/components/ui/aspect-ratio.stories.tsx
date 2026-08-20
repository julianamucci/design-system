import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { AspectRatio } from "./aspect-ratio";
import {
  descreverFalhasDeProporcao,
  medirProporcao,
  reprovasDeProporcao,
} from "@shared/testing/aspect-ratio-probe";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { AspectRatioDocs } from "@/components/docs/AspectRatioDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { aspectRatioSource } from "./aspect-ratio.source";

const LANDSCAPE_SRC =
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80";

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs", "layout"],
  parameters: {
    design: figmaDesign("aspectRatio"),
    layout: "centered",
    docs: {
      page: withAutoDocsTab(AspectRatioDocs),
      // O painel imprimia `ImageWithFallback` — andaime das stories, fora do
      // design system — e o ratio já dividido em ponto flutuante.
      source: { transform: aspectRatioSource },
    },
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
      //
      // A sonda mede mais que a razão: confere que a caixa é a `.nds-aspect-ratio`
      // do design system, que a proporção sai do `aspect-ratio` nativo da folha
      // (e não de um truque de padding embutido por uma lib), que não há altura
      // cravada e que o filho direto está sendo esticado para cobrir a caixa.
      // Medir só a razão aprovava as duas stacks que não tinham a classe.
      const falhas = reprovasDeProporcao(
        [medirProporcao(canvasElement, "playground")],
        args.ratio,
      );
      await expect(
        falhas,
        falhas.length ? `\n${descreverFalhasDeProporcao(falhas)}\n` : "",
      ).toEqual([]);
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
