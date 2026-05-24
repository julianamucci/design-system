import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import {
  BarChart,
  Bar as RechartsBar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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

const chartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--primary))" },
  mobile: { label: "Mobile", color: "hsl(var(--secondary))" },
} satisfies ChartConfig;

const pieData = [
  { name: "Desktop", value: 1224 },
  { name: "Mobile", value: 860 },
  { name: "Tablet", value: 320 },
];

const pieConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
  mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
  tablet: { label: "Tablet", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const meta = {
  title: "UI/Chart/Variantes",
  component: ChartContainer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Tipos de gráfico suportados: Bar, Line, Area e Pie via primitivos Recharts dentro do ChartContainer.",
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof ChartContainer>;

export const BarVariante: Story = {
  name: "Bar",
  render: () => (
    <ChartContainer
      config={chartConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <RechartsBar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <RechartsBar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  },
};

export const Linha: Story = {
  render: () => (
    <ChartContainer
      config={chartConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico de linhas: tendência mensal por dispositivo"
    >
      <LineChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="desktop"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  },
};

export const AreaVariante: Story = {
  name: "Area",
  render: () => (
    <ChartContainer
      config={chartConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico de área: volume mensal por dispositivo"
    >
      <AreaChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="desktop"
          stroke="var(--color-desktop)"
          fill="var(--color-desktop)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Area
          dataKey="mobile"
          stroke="var(--color-mobile)"
          fill="var(--color-mobile)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  },
};

export const PieVariante: Story = {
  name: "Pie",
  render: () => (
    <ChartContainer
      config={pieConfig}
      className="h-[300px] w-[400px]"
      aria-label="Gráfico de pizza: distribuição de acessos por dispositivo"
    >
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`hsl(var(--chart-${index + 1}))`}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  },
};
