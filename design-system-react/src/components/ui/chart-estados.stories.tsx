import type { Meta, StoryObj } from "@storybook/react";
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

const chartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const singleConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const multiConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--primary))" },
  mobile: { label: "Mobile", color: "hsl(var(--secondary))" },
} satisfies ChartConfig;

const meta = {
  title: "UI/Chart/Estados",
  component: ChartContainer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Estados do Chart: vazio (data=[]), série única e múltiplas séries.",
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vazio: Story = {
  render: () => (
    <ChartContainer
      config={singleConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico sem dados disponíveis"
    >
      <BarChart data={[]} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const UmaSerie: Story = {
  render: () => (
    <ChartContainer
      config={singleConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico de barras: acessos desktop mensais"
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const MultiplasSeries: Story = {
  render: () => (
    <ChartContainer
      config={multiConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico de barras: acessos mensais desktop e mobile"
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
