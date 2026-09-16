import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton, SkeletonRegion, type SkeletonRegionProps } from "./skeleton";
import { AspectRatio } from "./aspect-ratio";
import { skeletonSource } from "./skeleton.source";
import { SkeletonDocs } from "@/components/docs/SkeletonDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { WIDTH_FRACTION, boxDesenhada } from "@shared/testing/skeleton-probe";

// A caixa do esqueleto vem de atributo, não de classe de dimensão nem de
// altura cravada: `data-shape` escolhe a forma e `data-width` a fração da
// largura do container (docs/shared/styles/nds/skeleton.css). Altura é
// resultado de padding + tipografia — guideline 12, WCAG 1.4.4.
//
// Não há control de carregamento: a região não alterna `aria-busy`, ela SAI
// quando o conteúdo chega (decisão da dona, 2026-09-14).
type PlaygroundArgs = {
  shape: "text" | "heading" | "avatar" | "fill";
  width: "full" | "3-4" | "2-3" | "1-2" | "1-3";
};

const REGION_LABEL = "Carregando conteúdo";

// O que um consumidor tentaria para "desligar" a região à mão. Fora do tipo das
// props de propósito — daí o cast —, e a play prova que nada disso chega ao DOM.
const OVERRIDE_ATTEMPT = {
  role: "alert",
  "aria-busy": false,
} as unknown as Partial<SkeletonRegionProps>;

// A mesma tentativa no placeholder: `aria-hidden` é da peça e sai marcado de
// fábrica, então um `false` espalhado não pode devolvê-lo à árvore.
const SKELETON_OVERRIDE_ATTEMPT = { "aria-hidden": false } as const;

// Sem `component: Skeleton`: os controls do Playground são a FORMA e a LARGURA,
// que o componente não recebe como prop — chegam como atributo. Declarar o
// componente aqui faria o docgen anunciar uma API que não é a que se controla.
const meta = {
  title: "Components/Feedback/Skeleton",
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(SkeletonDocs),
      source: { transform: skeletonSource },
    },
  },
  argTypes: {
    shape: {
      control: { type: "inline-radio" },
      options: ["text", "heading", "avatar", "fill"],
      description:
        "Forma do placeholder — decide a caixa que ele desenha (data-shape).",
      table: { type: { summary: '"text" | "heading" | "avatar" | "fill"' }, defaultValue: { summary: "text" } },
    },
    width: {
      control: { type: "inline-radio" },
      options: ["full", "3-4", "2-3", "1-2", "1-3"],
      description:
        "Fração da largura do container (data-width). Só se aplica às formas de texto.",
      table: { type: { summary: '"full" | "3-4" | "2-3" | "1-2" | "1-3"' }, defaultValue: { summary: "3-4" } },
    },
  },
  args: {
    shape: "text",
    width: "3-4",
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    docs: {
      // Declarada na story, e não só herdada do meta: quem lê o painel desta
      // story tem de ver o que ela monta, mesmo se o meta passar a outra forma.
      source: { transform: skeletonSource },
    },
    covers: [
      "functional.item2",
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
    ],
  },
  // `fill` preenche a caixa que o CONTAINER estabelece, e quem a estabelece é o
  // `AspectRatio` — o mesmo que o painel Code ensina e que a composição
  // `ImageInAspectRatio` usa. A classe de proporção é da docs page, não API: ela
  // daria a caixa sem aparecer no exemplo de ninguém.
  render: ({ shape, width }) =>
    shape === "fill" ? (
      <SkeletonRegion {...OVERRIDE_ATTEMPT} label={REGION_LABEL} className="nds-w-sm">
        <AspectRatio ratio={16 / 9}>
          <Skeleton {...SKELETON_OVERRIDE_ATTEMPT} data-shape="fill" />
        </AspectRatio>
      </SkeletonRegion>
    ) : (
      <SkeletonRegion {...OVERRIDE_ATTEMPT} label={REGION_LABEL}>
        <Skeleton
          {...SKELETON_OVERRIDE_ATTEMPT}
          data-shape={shape}
          data-width={shape === "text" || shape === "heading" ? width : undefined}
        />
      </SkeletonRegion>
    ),
  play: async ({ canvasElement, step, args }) => {
    const sk = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    const regiao = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton-region"]')!;

    await step("O placeholder fica fora da árvore de acessibilidade", async () => {
      // Anunciar cada barrinha é ruído: o esqueleto não tem conteúdo.
      await expect(sk).toHaveAttribute("aria-hidden", "true");
    });

    await step("Quem anuncia o carregamento é a região", async () => {
      // `aria-busy` sozinho num div sem role não é anunciado, e aria-label em
      // div sem role é violação de ARIA — o par role+label é o que faz o
      // leitor dizer "carregando conteúdo".
      await expect(regiao).toHaveAttribute("role", "status");
      await expect(regiao).toHaveAttribute("aria-busy", "true");
      await expect(regiao).toHaveAccessibleName(REGION_LABEL);
      await expect(regiao.contains(sk)).toBe(true);
    });

    await step("Papel, estado e ocultação passados às peças não sobrescrevem os delas", async () => {
      // O render espalha `role="alert"` e `aria-busy={false}` na região: se o
      // espalhamento viesse depois dos atributos fixos, a região deixaria de
      // ser `status` e anunciaria que o carregamento terminou.
      await expect(regiao).not.toHaveAttribute("role", "alert");
      await expect(regiao).toHaveAttribute("role", "status");
      await expect(regiao).toHaveAttribute("aria-busy", "true");
      // O render também espalha `aria-hidden={false}` no placeholder.
      await expect(sk).toHaveAttribute("aria-hidden", "true");
    });

    await step("O atributo desenha a caixa — medida no que foi renderizado", async () => {
      // Mede o que foi DESENHADO, não a classe: foi exatamente assim que
      // `h-4 w-[250px]` sobreviveu como texto inerte, com o esqueleto do
      // Playground renderizando altura zero.
      const box = boxDesenhada(sk, regiao);
      await expect(box.height).toBeGreaterThan(0);
      if (args.shape === "text" || args.shape === "heading") {
        await expect(
          Math.abs(box.fracaoDoContainer - WIDTH_FRACTION[args.width]),
        ).toBeLessThan(0.02);
      }
    });
  },
};
