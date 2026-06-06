import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";

const meta = {
  title: "UI/Calendar/Layouts",
  tags: ["form"],
  component: Calendar,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // F7 — captionLayout="dropdown" renderiza dois <select> (mês e ano)
    const comboboxes = canvas.getAllByRole("combobox");
    await expect(comboboxes.length).toBe(2);
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
          "numberOfMonths={2} — dois meses lado a lado. Reduz cliques de navegação em `mode=\"range\"`.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("grid").length).toBeGreaterThanOrEqual(1);
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
    // react-day-picker v9 renderiza week numbers como <td role="rowheader" scope="row">.
    // axe reporta scope-attr-valid (HTML5 só permite scope em <th>), mas é a estrutura
    // que a lib usa para anunciar week number como cabeçalho de linha em leitores de tela.
    // Ver PATCHES.md#calendar-week-number-scope.
    a11y: {
      config: {
        rules: [{ id: 'scope-attr-valid', enabled: false }],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid")).toBeInTheDocument();
  },
};
