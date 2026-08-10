import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
  title: "UI/AspectRatio/Compositions",
  tags: ["layout"],
  component: AspectRatio,
  parameters: {
    design: figmaDesign("aspectRatio"),
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

export const WithImage: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item1"],
    docs: {
      description: {
        story:
          "Imagem responsiva com `ImageWithFallback` — exibe placeholder se a URL falhar. Aplicar `object-cover` e `rounded-md` no filho, nunca no AspectRatio.",
      },
    },
  },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "480px" }} >
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
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const img = canvasElement.querySelector("img");
    await expect(img).not.toBeNull();
    // accessibility.item1 — imagem informativa precisa de alt não vazio.
    await expect(img!.getAttribute("alt")).not.toBe("");
    // functional.item3 — o filho cobre a caixa sem distorcer.
    await expect(getComputedStyle(img!).objectFit).toBe("cover");
  },
};

export const WithIframe: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Iframe de mapa com `title` obrigatório descrevendo o conteúdo embedado (requisito WCAG 2.2 — 4.1.2).",
      },
    },
  },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "520px" }} >
      <AspectRatio ratio={16 / 9}>
        <iframe
          title="Mapa do escritório em São Paulo"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.57%2C-46.62%2C-23.54&layer=mapnik"
          className="nds-w-full nds-rounded-md" style={{ height: "100%", border: 0 }}
          loading="lazy"
        />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const frame = canvasElement.querySelector("iframe");
    await expect(frame).not.toBeNull();
    // accessibility.item3 — sem title o iframe não tem nome acessível.
    await expect(frame!.getAttribute("title")).toBeTruthy();
  },
};

export const WithVideo: Story = {
  parameters: {
    covers: ["accessibility.item4", "accessibility.item5"],
    docs: {
      description: {
        story:
          "Elemento `<video>` nativo. Para produção, inclua `<track kind=\"captions\">` com legendas sincronizadas (WCAG 2.2 AA — 1.2.2).",
      },
    },
  },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "520px" }} >
      <AspectRatio ratio={16 / 9}>
        <video
          controls
          preload="metadata"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%", background: "black" }}
          aria-label="Vídeo demonstrativo"
        >
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            type="video/mp4"
          />
          {/* accessibility.item4 — o contrato pede faixa de legendas; a cue vem
              em data: URI para não depender de arquivo servido. */}
          <track kind="captions" src="data:text/vtt,WEBVTT%0A%0A00:00:00.000 --> 00:00:05.000%0AV%C3%ADdeo de demonstra%C3%A7%C3%A3o do AspectRatio" srcLang="pt-BR" label="Português" default />
          Seu navegador não suporta a tag de vídeo.
        </video>
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    const video = canvasElement.querySelector("video");
    await expect(video).not.toBeNull();
    // accessibility.item4 — a faixa de legendas é o que o contrato promete.
    const legenda = video!.querySelector('track[kind="captions"]');
    await expect(legenda).not.toBeNull();
    await expect(legenda!.getAttribute("src")).toBeTruthy();
    // accessibility.item5 — o controle de mídia é alcançável pelo teclado.
    // focus() em vez de tab(): a ordem de tabulação parte do documento inteiro,
    // e o que o critério promete é que o vídeo aceita foco — se não aceitasse,
    // activeElement continuaria no body e a asserção reprovaria.
    await expect(video!.hasAttribute("controls")).toBe(true);
    video!.focus();
    await expect(document.activeElement).toBe(video);
  },
};

export const EmptyPlaceholder: Story = {
  parameters: {
    covers: ["functional.item5"],
    docs: {
      description: {
        story:
          "Sem mídia dentro, o container já reserva o espaço na proporção — é o que evita o salto de layout quando o conteúdo termina de carregar.",
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: "100%", width: "480px" }}>
      <AspectRatio ratio={16 / 9}>
        <div
          className="nds-cluster nds-w-full nds-bg-muted nds-rounded-md nds-text-body nds-text-muted-foreground"
          data-align="center"
          data-justify="center"
          style={{ height: "100%" }}
          role="img"
          aria-label="Conteúdo carregando"
        >
          Carregando…
        </div>
      </AspectRatio>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const caixa = canvasElement.querySelector('[data-slot="aspect-ratio"]');
    await expect(caixa).not.toBeNull();
    // functional.item5 — sem mídia dentro, a caixa ainda reserva o espaço.
    await expect(caixa!.querySelector("img, video, iframe")).toBeNull();
    await expect(caixa!.getBoundingClientRect().height).toBeGreaterThan(0);
  },
};

export const InGrid: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      description: {
        story:
          "Grid de cards em que todos os itens preservam a mesma proporção — resolve o problema de alturas desiguais em listagens com imagens de dimensões variáveis.",
      },
    },
  },
  render: () => (
    <div className="nds-grid nds-sm-grid-3" style={{maxWidth: "100%", width: "760px" }} data-spacing="md" >
      {[
        { src: LANDSCAPE_SRC, alt: "Paisagem ao entardecer" },
        { src: PRODUCT_SRC, alt: "Tênis de corrida" },
        { src: SQUARE_SRC, alt: "Avatar de Maria Silva" },
      ].map((item, i) => (
        <div key={i} className="nds-stack" data-spacing="sm">
          <AspectRatio ratio={4 / 3}>
            <ImageWithFallback
              src={item.src}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
            />
          </AspectRatio>
          <p className="nds-text-body nds-font-medium">{item.alt}</p>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const caixas = Array.from(
      canvasElement.querySelectorAll('[data-slot="aspect-ratio"]'),
    );
    await expect(caixas.length).toBeGreaterThan(1);
    // functional.item4 — larguras diferentes, mesma proporção: é o que garante
    // que a altura é recalculada a partir da largura, e não fixada.
    const proporcoes = caixas.map((c) => {
      const r = c.getBoundingClientRect();
      return r.width / r.height;
    });
    for (const p of proporcoes) {
      await expect(Math.abs(p - proporcoes[0])).toBeLessThan(0.02);
    }
  },
};

export const WithDecorativeImage: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    docs: {
      description: {
        story:
          'Imagem decorativa usa `alt=""` (string vazia) para ser ignorada por leitores de tela — nunca omita o atributo.',
      },
    },
  },
  render: () => (
    <div className="" style={{maxWidth: "100%", width: "420px" }} >
      <AspectRatio ratio={16 / 9}>
        <ImageWithFallback
          src={LANDSCAPE_SRC}
          alt=""
          loading="lazy"
          decoding="async"
          className="nds-rounded-md nds-w-full" style={{ objectFit: "cover", height: "100%" }}
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
