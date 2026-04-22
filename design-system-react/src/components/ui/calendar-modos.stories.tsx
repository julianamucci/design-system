import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Modos",
  component: Calendar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Modos de seleção do Calendar: single (uma data), multiple (várias) e range (intervalo contínuo). O tipo de `selected` depende do `mode`.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "mode=\"single\" — seleção de uma única data. `selected` é `Date | undefined`; `onSelect` recebe `Date | undefined`.",
      },
    },
  },
};

export const Multiple: Story = {
  render: () => {
    const today = new Date();
    const [dates, setDates] = useState<Date[] | undefined>([
      today,
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
    ]);
    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "mode=\"multiple\" — seleção de várias datas independentes. `selected` é `Date[]`; cada clique adiciona ou remove uma data.",
      },
    },
  },
};

export const Range: Story = {
  render: () => {
    const today = new Date();
    const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
    });
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "mode=\"range\" — intervalo contínuo com `from` e `to`. Ideal para reservas e relatórios com janela de datas.",
      },
    },
  },
};
