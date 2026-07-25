import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Skeleton } from "./skeleton";
import { SkeletonDocs } from "@/components/docs/SkeletonDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(SkeletonDocs) },
  },
  argTypes: {
    className: {
      control: { type: "text" },
      description:
        "Classes utilitárias .nds-* para definir dimensões e arredondamento do placeholder.",
    },
  },
  args: {
    className: "h-4 w-[250px]",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div role="status" aria-busy="true" aria-label="Carregando exemplo">
      <Skeleton {...args} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const skeleton = canvasElement.querySelector(
      "[data-slot='skeleton']"
    ) as HTMLElement | null;
    const container = skeleton?.parentElement as HTMLElement | null;

    await step("Skeleton está no DOM", async () => {
      await expect(skeleton).toBeInTheDocument();
      await expect(canvas).toBeTruthy();
    });

    await step("Skeleton tem estilo base (pulso, radius, bg)", async () => {
      await expect(skeleton).toHaveClass("nds-skeleton");
      const style = getComputedStyle(skeleton!);
      await expect(style.animationName).toBe("nds-skeleton-pulse");
      await expect(style.borderRadius).not.toBe("0px");
    });

    await step("Skeleton tem aria-hidden=true", async () => {
      await expect(skeleton).toHaveAttribute("aria-hidden", "true");
    });

    await step("Container tem aria-busy=true", async () => {
      await expect(container).toHaveAttribute("aria-busy", "true");
    });
  },
};
