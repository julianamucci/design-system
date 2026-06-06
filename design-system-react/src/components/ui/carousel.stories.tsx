import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";
import { Card, CardContent } from "./card";
import { CarouselDocs } from "@/components/docs/CarouselDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Carousel",
  component: Carousel,
  tags: ["autodocs", "display"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(CarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Direção do deslize dos slides",
    },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Carousel {...args} className="w-full max-w-md" aria-label="Galeria de exemplos">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <Card className="h-40 shadow-none">
              <CardContent className="flex h-full items-center justify-center">
                <span className="text-2xl font-semibold text-muted-foreground">
                  Slide {i + 1}
                </span>
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

    await step("Região com role region e aria-roledescription", async () => {
      const region = canvas.getByRole("region");
      await expect(region).toBeInTheDocument();
      await expect(region).toHaveAttribute("aria-roledescription", "carousel");
    });

    await step("Botão Previous começa disabled no primeiro slide", async () => {
      const prev = canvas.getByRole("button", { name: /item anterior/i });
      await expect(prev).toBeDisabled();
    });

    await step("Botão Next está habilitado e recebe foco", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      await expect(next).toBeEnabled();
      next.focus();
      await expect(next).toHaveFocus();
    });

    await step("Clique em Next avança um slide e habilita Previous", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      await userEvent.click(next);
      const prev = canvas.getByRole("button", { name: /item anterior/i });
      await expect(prev).toBeEnabled();
    });

    await step("Enter no Next avança mais um slide", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      next.focus();
      await userEvent.keyboard("{Enter}");
      await expect(next).toHaveFocus();
    });

    await step("Space no Next avança o slide quando em foco", async () => {
      const next = canvas.getByRole("button", { name: /próximo item/i });
      next.focus();
      await userEvent.keyboard(" ");
      await expect(next).toHaveFocus();
    });
  },
};
