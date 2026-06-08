import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./carousel";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const meta = {
  title: "UI/Carousel/Composicoes",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do Carousel com outros componentes: dots customizados via CarouselApi e galeria de imagens em Card.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

function SlideCard({ label }: { label: string }) {
  return (
    <Card className="h-40 shadow-none">
      <CardContent className="flex h-full items-center justify-center">
        <span className="text-2xl font-semibold text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function ComDotsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="w-full max-w-md">
      <Carousel setApi={setApi} opts={{ loop: true }} aria-label="Galeria com dots">
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
      <div
        className="mt-4 flex justify-center gap-2"
        role="tablist"
        aria-label="Slides do carrossel"
      >
        {Array.from({ length: count }).map((_, i) => (
          <Button
            key={i}
            type="button"
            role="tab"
            variant="ghost"
            size="icon-sm"
            aria-selected={i === current}
            aria-label={`Ir para o slide ${i + 1} de ${count}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2 w-2 rounded-full p-0 transition-colors",
              i === current ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export const ComDots: Story = {
  render: () => <ComDotsCarousel />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Tablist com dots está presente", async () => {
      const tablist = canvas.getByRole("tablist", { name: /slides do carrossel/i });
      await expect(tablist).toBeInTheDocument();
    });

    await step("Primeiro dot começa selecionado", async () => {
      const firstDot = canvas.getAllByRole("tab")[0];
      await expect(firstDot).toHaveAttribute("aria-selected", "true");
    });

    await step("Clicar em outro dot muda o slide ativo", async () => {
      const dots = canvas.getAllByRole("tab");
      await userEvent.click(dots[2]);
      await expect(dots[2]).toHaveAttribute("aria-selected", "true");
    });
  },
};

export const Galeria: Story = {
  render: () => (
    <Carousel className="w-full max-w-md" aria-label="Galeria de fotos do produto">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <Card className="shadow-none">
              <img
                src={`https://picsum.photos/seed/carousel-${i + 1}/640/360`}
                alt={`Imagem de exemplo ${i + 1}`}
                className="block w-full aspect-[16/9] object-cover"
              />
              <CardContent>
                <p className="text-sm font-medium">Imagem {i + 1}</p>
                <p className="text-xs text-muted-foreground">
                  Exemplo de conteúdo fotográfico em slide.
                </p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Imagens da galeria têm alt descritivo", async () => {
      const imgs = canvas.getAllByRole("img");
      await expect(imgs.length).toBeGreaterThan(0);
      await expect(imgs[0]).toHaveAttribute("alt", expect.stringMatching(/exemplo/i));
    });
  },
};
