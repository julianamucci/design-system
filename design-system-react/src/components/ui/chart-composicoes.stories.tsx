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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  title: "UI/Chart/Composições",
  component: ChartContainer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Composições do Chart: dentro de Card e com tooltip personalizado.",
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComCard: Story = {
  render: () => (
    <Card className="w-[520px]">
      <CardHeader>
        <CardTitle>Acessos Mensais</CardTitle>
        <CardDescription>Janeiro — Junho 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[250px] w-full"
          aria-label="Gráfico de barras dentro de card: acessos mensais"
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
      </CardContent>
    </Card>
  ),
};

export const TooltipCustom: Story = {
  render: () => (
    <ChartContainer
      config={chartConfig}
      className="h-[300px] w-[500px]"
      aria-label="Gráfico com tooltip customizado: acessos mensais"
    >
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-mono text-xs">
                  {name}: <strong>{Number(value).toLocaleString("pt-BR")}</strong>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
