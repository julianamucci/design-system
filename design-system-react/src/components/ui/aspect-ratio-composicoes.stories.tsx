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

const meta = {
  title: "UI/AspectRatio/Composicoes",
  tags: ["layout"],
  component: AspectRatio,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes canônicas: imagem com ImageWithFallback, iframe de mapa, vídeo com legendas e grid de cards mantendo a mesma proporção.",
      },
    },
  },
  args: { ratio: 16 / 9 },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComImagem: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Imagem responsiva com `ImageWithFallback` — exibe placeholder se a URL falhar. Aplicar `object-cover` e `rounded-md` no filho, nunca no AspectRatio.",
      },
    },
  },
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
    await expect(img).toHaveAttribute("alt", "Paisagem ao entardecer");
  },
};

export const ComIframe: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Iframe de mapa com `title` obrigatório descrevendo o conteúdo embedado (requisito WCAG 2.1 — 4.1.2).",
      },
    },
  },
  render: () => (
    <div className="w-[520px] max-w-full">
      <AspectRatio ratio={16 / 9}>
        <iframe
          title="Mapa do escritório em São Paulo"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.57%2C-46.62%2C-23.54&layer=mapnik"
          className="w-full h-full rounded-md border-0"
          loading="lazy"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Iframe tem atributo title não vazio (WCAG 4.1.2)", async () => {
      const iframe = canvasElement.querySelector("iframe");
      await expect(iframe).toBeInTheDocument();
      await expect(iframe).toHaveAttribute("title", "Mapa do escritório em São Paulo");
    });
  },
};

export const ComVideo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Elemento `<video>` nativo. Para produção, inclua `<track kind=\"captions\">` com legendas sincronizadas (WCAG 2.1 AA — 1.2.2).",
      },
    },
  },
  render: () => (
    <div className="w-[520px] max-w-full">
      <AspectRatio ratio={16 / 9}>
        <video
          controls
          preload="metadata"
          className="rounded-md object-cover w-full h-full bg-black"
          aria-label="Vídeo demonstrativo"
        >
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            type="video/mp4"
          />
          Seu navegador não suporta a tag de vídeo.
        </video>
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const video = canvasElement.querySelector("video");
    await expect(video).toBeInTheDocument();
    await expect(video).toHaveAttribute("aria-label", "Vídeo demonstrativo");
  },
};

export const GridConsistente: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Grid de cards em que todos os itens preservam a mesma proporção — resolve o problema de alturas desiguais em listagens com imagens de dimensões variáveis.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-[760px] max-w-full">
      {[
        { src: LANDSCAPE_SRC, alt: "Paisagem ao entardecer" },
        { src: PRODUCT_SRC, alt: "Tênis de corrida" },
        { src: SQUARE_SRC, alt: "Avatar de Maria Silva" },
      ].map((item, i) => (
        <div key={i} className="space-y-2">
          <AspectRatio ratio={4 / 3}>
            <ImageWithFallback
              src={item.src}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="rounded-md object-cover w-full h-full"
            />
          </AspectRatio>
          <p className="text-sm font-medium">{item.alt}</p>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const imgs = canvasElement.querySelectorAll("img");
    await expect(imgs.length).toBe(3);
  },
};

export const ComImagemDecorativa: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Imagem decorativa usa `alt=""` (string vazia) para ser ignorada por leitores de tela — nunca omita o atributo.',
      },
    },
  },
  render: () => (
    <div className="w-[420px] max-w-full">
      <AspectRatio ratio={16 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt=""
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
    await expect(img).toHaveAttribute("alt", "");
  },
};
