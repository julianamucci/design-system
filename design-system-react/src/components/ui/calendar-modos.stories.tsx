import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, fn } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Modos",
  tags: ["form"],
  component: Calendar,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
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
  args: {
    onSelect: fn(),
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 15));
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => {
          setDate(d);
          (args as { onSelect?: (d: Date | undefined) => void }).onSelect?.(d);
        }}
        locale={ptBR}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // F2 — clicar numa célula de data dispara onSelect com Date
    const dayButtons = canvasElement.querySelectorAll<HTMLButtonElement>(
      'button[data-day]:not([disabled])',
    );
    await expect(dayButtons.length).toBeGreaterThan(0);
    const target = dayButtons[dayButtons.length - 1];
    await userEvent.click(target);
    const onSelect = (args as { onSelect?: ReturnType<typeof fn> }).onSelect!;
    await expect(onSelect).toHaveBeenCalled();
    const firstArg = onSelect.mock.calls[0]?.[0];
    await expect(firstArg instanceof Date).toBe(true);
    // Confirma grid acessível
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
        selected={range as never}
        onSelect={setRange as never}
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("grid").length).toBeGreaterThanOrEqual(1);
  },
};
