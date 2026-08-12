import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";

const meta = {
  title: "UI/Carousel/Variants",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Variações de orientação do Carousel: horizontal (padrão) e vertical.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Slide sem medida cravada. Em horizontal a altura vem da proporção 16:9; em
 * vertical o slide já tem altura própria (a base `flex: 0 0 100%` resolvida
 * contra o trilho), então o cartão só precisa preenchê-la.
 */
function SlideCard({ label, preencher = false }: { label: string; preencher?: boolean }) {
  return (
    <div className={preencher ? "nds-h-full" : "nds-aspect-16-9"}>
      <div
        className="nds-cluster nds-h-full nds-bg-muted-soft nds-rounded-lg"
        data-align="center"
        data-justify="center"
      >
        <span className="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/** Ver a nota em carousel-estados: o Embla move o trilho, não o `scrollLeft`. */
function visivelNoViewport(slide: Element, viewport: Element): boolean {
  const s = slide.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  return s.right > v.left + 1 && s.left < v.right - 1 && s.bottom > v.top + 1 && s.top < v.bottom - 1;
}

export const Horizontal: Story = {
  parameters: {
    covers: ["accessibility.item5", "visual.item2"],
    docs: {
      description: {
        story:
          "Orientação padrão: os slides deitam em linha e as setas ficam nas laterais, fora da área recortada.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria na horizontal">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole("region");
    const trilho = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;

    await step("A região se anuncia como carrossel e tem nome próprio", async () => {
      await expect(regiao).toHaveAttribute("aria-roledescription", "carousel");
      await expect(regiao).toHaveAccessibleName("Galeria na horizontal");
    });

    await step("O trilho deita os slides em linha", async () => {
      await expect(trilho).toHaveAttribute("data-orientation", "horizontal");
      await expect(getComputedStyle(trilho).flexDirection).toBe("row");
    });

    await step("As setas ficam nas laterais, fora da área dos slides", async () => {
      // É o que `.nds-carousel-arrow-*[data-orientation="horizontal"]` faz. Se
      // o atributo não chegasse, os botões empilhariam SOBRE o primeiro slide,
      // sem erro nenhum no console — e o contraste que o axe mede deixaria de
      // ser contra o fundo da página para ser contra a arte do slide.
      const area = regiao.getBoundingClientRect();
      const anterior = canvas
        .getByRole("button", { name: /item anterior/i })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole("button", { name: /próximo item/i })
        .getBoundingClientRect();
      await expect(anterior.left).toBeLessThan(area.left);
      await expect(proximo.right).toBeGreaterThan(area.right);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item2"],
    docs: {
      description: {
        story:
          "Os slides empilham e as setas passam para cima e para baixo do viewport, que recebe altura por classe de proporção.",
      },
    },
  },
  render: () => (
    <Carousel
      orientation="vertical"
      className="nds-w-full nds-max-w-xs"
      aria-label="Galeria na vertical"
    >
      {/* `nds-aspect-4-3` dá ao trilho a altura DEFINIDA que a base
          `flex: 0 0 100%` do slide precisa para resolver. Sem ela o carrossel
          vertical empilha os slides e nada é recortado. */}
      <CarouselContent className="nds-aspect-4-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i} className="nds-basis-full">
            <SlideCard label={`Slide ${i + 1}`} preencher />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole("region");
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const trilho = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;

    await step("O trilho empilha os slides em coluna", async () => {
      await expect(trilho).toHaveAttribute("data-orientation", "vertical");
      await expect(getComputedStyle(trilho).flexDirection).toBe("column");
    });

    await step("Cada slide ocupa a altura do viewport", async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e o slide encolhe até o conteúdo.
      const slides = canvas.getAllByRole("group");
      await expect(slides[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(
        viewport.clientHeight,
      );
      // E o recorte é real: o segundo slide já está fora do enquadramento.
      await expect(visivelNoViewport(slides[0], viewport)).toBe(true);
      await expect(visivelNoViewport(slides[1], viewport)).toBe(false);
    });

    await step("As setas ficam acima e abaixo do viewport", async () => {
      const area = regiao.getBoundingClientRect();
      const anterior = canvas
        .getByRole("button", { name: /item anterior/i })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole("button", { name: /próximo item/i })
        .getBoundingClientRect();
      await expect(anterior.top).toBeLessThan(area.top);
      await expect(proximo.bottom).toBeGreaterThan(area.bottom);
    });
  },
};
