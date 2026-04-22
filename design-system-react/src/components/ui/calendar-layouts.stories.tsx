import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Layouts",
  component: Calendar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Layouts do Calendar: legenda como texto (padrão), como dropdown de mês/ano, com dois meses lado a lado e com coluna de número da semana ISO.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaptionLabel: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        captionLayout="label"
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
          "captionLayout=\"label\" — legenda em texto simples. Padrão do componente.",
      },
    },
  },
};

export const CaptionDropdown: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        captionLayout="dropdown"
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
          "captionLayout=\"dropdown\" — mês e ano viram `<select>` para navegação rápida entre anos.",
      },
    },
  },
};

export const TwoMonths: Story = {
  render: () => {
    const today = new Date();
    const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9),
    });
    return (
      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "numberOfMonths={2} — dois meses lado a lado. Reduz cliques de navegação em `mode=\"range\"`.",
      },
    },
  },
};

export const WithWeekNumber: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        showWeekNumber
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
          "showWeekNumber — exibe coluna com o número da semana ISO à esquerda do grid.",
      },
    },
  },
};
