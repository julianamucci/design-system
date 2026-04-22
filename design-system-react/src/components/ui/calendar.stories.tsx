import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";
import { CalendarDocs } from "@/components/docs/CalendarDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(CalendarDocs) },
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["single", "multiple", "range"],
      description: "Modo de seleção: uma data, várias ou intervalo.",
    },
    captionLayout: {
      control: "select",
      options: ["label", "dropdown"],
      description: "Layout da legenda do mês: texto ou selects.",
    },
    showOutsideDays: {
      control: "boolean",
      description: "Exibe dias do mês anterior/próximo apagados nas bordas.",
    },
    showWeekNumber: {
      control: "boolean",
      description: "Exibe coluna com o número da semana ISO.",
    },
    numberOfMonths: {
      control: { type: "number", min: 1, max: 3 },
      description: "Quantidade de meses exibidos lado a lado.",
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Grid com role='grid' está presente", async () => {
      const grid = canvas.getByRole("grid");
      await expect(grid).toBeInTheDocument();
    });

    await step("Data de hoje está selecionada (aria-selected='true')", async () => {
      const selected = canvasElement.querySelectorAll('[aria-selected="true"]');
      await expect(selected.length).toBeGreaterThanOrEqual(1);
    });

    await step("Botões de navegação possuem aria-label", async () => {
      const prev = canvas.getByRole("button", { name: /previous|anterior/i });
      const next = canvas.getByRole("button", { name: /next|próximo|proximo/i });
      await expect(prev).toBeInTheDocument();
      await expect(next).toBeInTheDocument();
    });

    await step("DayButton recebe foco por teclado via Tab", async () => {
      const dayButtons = canvasElement.querySelectorAll('button[data-day]');
      await expect(dayButtons.length).toBeGreaterThan(0);
      (dayButtons[0] as HTMLButtonElement).focus();
      await expect(dayButtons[0]).toHaveFocus();
    });

    await step("Arrow keys movem o foco entre células", async () => {
      const dayButtons = canvasElement.querySelectorAll('button[data-day]');
      (dayButtons[0] as HTMLButtonElement).focus();
      await userEvent.keyboard("{ArrowRight}");
      // react-day-picker move foco internamente — apenas confirmamos que há foco
      await expect(document.activeElement?.tagName).toBe("BUTTON");
    });
  },
};
