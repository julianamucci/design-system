import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "./chart";
import { ChartDocs } from "@/components/docs/ChartDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const chartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--primary))" },
  mobile: { label: "Mobile", color: "hsl(var(--secondary))" },
} satisfies ChartConfig;

const meta = {
  title: "UI/Chart",
  component: ChartContainer,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(ChartDocs) },
    layout: "centered",
  },
  argTypes: {
    config: {
      control: false,
      description: "ChartConfig mapping data keys to color, label and icon",
    },
    className: {
      control: "text",
      description: "Additional Tailwind classes (use for height: h-[300px] w-full)",
    },
  },
  args: {
    config: chartConfig,
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    config: chartConfig,
    className: "h-[300px] w-[500px]",
  },
  render: (args) => (
    <ChartContainer
      {...args}
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("ChartContainer renderiza com data-slot=chart", async () => {
      const chart = canvasElement.querySelector("[data-slot=chart]");
      await expect(chart).toBeInTheDocument();
    });

    await step("ChartContainer tem aria-label acessível", async () => {
      const chart = canvasElement.querySelector("[data-slot=chart]");
      await expect(chart).toHaveAttribute(
        "aria-label",
        "Gráfico de barras: acessos mensais por dispositivo"
      );
    });

    await step("SVG do gráfico é renderizado dentro do container", async () => {
      const svg = canvasElement.querySelector("svg");
      await expect(svg).toBeInTheDocument();
    });

    await step("ChartStyle injeta CSS vars no documento", async () => {
      const style = canvasElement.querySelector("style");
      await expect(style).toBeInTheDocument();
    });

    await step("Legenda exibe labels Desktop e Mobile", async () => {
      const desktopLabel = canvas.getByText("Desktop");
      const mobileLabel = canvas.getByText("Mobile");
      await expect(desktopLabel).toBeVisible();
      await expect(mobileLabel).toBeVisible();
    });
  },
};
