import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { Card, CardContent } from "./card";

const meta = {
  title: "UI/Carousel/Configuracoes",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Configuracoes funcionais do Carousel: item único, múltiplos itens responsivos e autoplay via plugin.",
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

export const Single: Story = {
  render: () => (
    <Carousel className="w-full max-w-md" aria-label="Galeria de item único">
      <CarouselContent>
        {Array.from({ length: 3 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /item anterior/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeInTheDocument();
  },
};

export const MultiResponsive: Story = {
  render: () => (
    <Carousel className="w-full max-w-2xl" aria-label="Galeria de múltiplos itens">
      <CarouselContent>
        {Array.from({ length: 6 }).map((_, i) => (
          <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("group").length).toBeGreaterThan(0);
  },
};

export const Autoplay_: Story = {
  name: "Autoplay",
  render: () => (
    <Carousel
      className="w-full max-w-md"
      aria-label="Galeria com autoplay"
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
    >
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeInTheDocument();
  },
};
