import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { Card, CardContent } from "./card";

const meta = {
  title: "UI/Carousel/Estados",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Estados de extremidade: primeiro slide (Previous disabled) e último slide (Next disabled) quando não há loop.",
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

function SlideCard({ label }: { label: string }) {
  return (
    <Card className="" style={{boxShadow: "none", height: "10rem" }} >
      <CardContent className="nds-cluster" data-justify="center" style={{ height: "100%" }}>
        <span className="nds-font-semibold nds-text-muted-foreground" style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>{label}</span>
      </CardContent>
    </Card>
  );
}

export const PrimeiroSlide: Story = {
  render: () => (
    <Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria no primeiro slide">
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Previous começa disabled no primeiro slide", async () => {
      const prev = canvas.getByRole("button", { name: /item anterior/i });
      await expect(prev).toBeDisabled();
    });

    await step("Next está habilitado quando há próximos itens", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      await expect(next).toBeEnabled();
    });
  },
};

export const UltimoSlide: Story = {
  render: () => (
    <Carousel
      className="nds-w-full nds-max-w-md"
      aria-label="Galeria no último slide"
      opts={{ startIndex: 2 }}
    >
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Next fica disabled no último slide sem loop", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      await expect(next).toBeDisabled();
    });

    await step("Previous está habilitado quando há item anterior", async () => {
      const prev = canvas.getByRole("button", { name: /item anterior/i });
      await expect(prev).toBeEnabled();
    });
  },
};
