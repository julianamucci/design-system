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
  title: "UI/Carousel/Variantes",
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

function SlideCard({ label }: { label: string }) {
  return (
    <Card className="" style={{boxShadow: "none", height: "10rem" }} >
      <CardContent className="nds-cluster" data-justify="center" style={{ height: "100%" }}>
        <span className="nds-font-semibold nds-text-muted-foreground" style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>{label}</span>
      </CardContent>
    </Card>
  );
}

export const Horizontal: Story = {
  render: () => (
    <Carousel className="nds-w-full nds-max-w-md" aria-label="Galeria de exemplos">
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
    await step("Container é um region com aria-roledescription", async () => {
      const region = canvas.getByRole("region");
      await expect(region).toHaveAttribute("aria-roledescription", "carousel");
    });
  },
};

export const Vertical: Story = {
  render: () => (
    <Carousel
      orientation="vertical"
      className="nds-w-full nds-max-w-xs"
      aria-label="Galeria vertical"
    >
      <CarouselContent className="" style={{ height: "200px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i} className="nds-basis-full">
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
    await step("Slides existem com role group e aria-roledescription slide", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBeGreaterThan(0);
      await expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    });
  },
};
