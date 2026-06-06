import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Estados",
  tags: ["form"],
  component: Calendar,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // F6 — locale ptBR: weekdays em português (dom/seg/ter/qua/qui/sex/sáb)
    // react-day-picker abrevia com capitalização "seg." ou similar; usa regex case-insensitive.
    // react-day-picker pode renderizar os headers como <th scope="col"> ou divs com role
    const weekHeaders = canvasElement.querySelectorAll('thead th, [role="columnheader"]');
    const weekdayTexts = Array.from(weekHeaders)
      .map((h) => (h.textContent ?? "").toLowerCase())
      .join(" ");
    // Se nenhum header detectável, busca em qualquer elemento dentro do calendar
    if (!weekdayTexts.trim()) {
      const allText = (canvasElement.textContent ?? "").toLowerCase();
      await expect(allText).toMatch(/seg|ter|qua|qui|sex|s[aá]b|dom/);
    } else {
      await expect(weekdayTexts).toMatch(/seg|ter|qua|qui|sex|s[aá]b|dom/);
    }

    // A5 — focus ring visível via Tab até chegar numa célula (DayButton)
    const dayButtons = canvasElement.querySelectorAll<HTMLButtonElement>(
      'button[data-day]',
    );
    await expect(dayButtons.length).toBeGreaterThan(0);
    // Tab até um DayButton. react-day-picker deixa apenas um dia com tabIndex=0.
    await userEvent.tab();
    let tries = 0;
    while (
      tries < 20 &&
      !(document.activeElement as HTMLElement | null)?.hasAttribute("data-day")
    ) {
      await userEvent.tab();
      tries += 1;
    }
    await expect(
      (document.activeElement as HTMLElement | null)?.hasAttribute("data-day"),
    ).toBe(true);
    // Sanity: grid acessível
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
        selected={range as never}
        onSelect={setRange as never}
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
  },
};
