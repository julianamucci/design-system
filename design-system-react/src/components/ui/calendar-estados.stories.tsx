import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Estados",
  component: Calendar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Estados do Calendar: selecionado, desabilitado, hoje destacado, dias fora do mês e intervalo com dias no meio.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  render: () => {
    const today = new Date();
    const [date, setDate] = useState<Date | undefined>(today);
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
          "Estado selected — a célula recebe `bg-primary`, `text-primary-foreground` e `aria-selected=\"true\"`.",
      },
    },
  },
};

export const Disabled: Story = {
  render: () => {
    const today = new Date();
    const [date, setDate] = useState<Date | undefined>();
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={{ before: today }}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "disabled={{ before: new Date() }} — datas passadas ficam com `opacity-50`, `pointer-events-none` e `aria-disabled=\"true\"`.",
      },
    },
  },
};

export const Today: Story = {
  render: () => (
    <Calendar mode="single" locale={ptBR} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Sem data selecionada — apenas o dia de hoje ganha destaque com `bg-muted`.",
      },
    },
  },
};

export const WithOutsideDays: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        showOutsideDays
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
          "showOutsideDays (padrão) — dias do mês anterior/próximo aparecem apagados (`text-muted-foreground`) nas bordas do grid.",
      },
    },
  },
};

export const RangeWithMiddle: Story = {
  render: () => {
    const today = new Date();
    const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8),
    });
    return (
      <Calendar
        mode="range"
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
          "mode=\"range\" com `from` e `to` — dias no meio recebem `bg-muted`; extremos mantêm `bg-primary`.",
      },
    },
  },
};
