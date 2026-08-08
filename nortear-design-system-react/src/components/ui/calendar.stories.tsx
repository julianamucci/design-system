import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { userEvent, within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";
import { CalendarDocs } from "@/components/docs/CalendarDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(CalendarDocs) },
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["single", "multiple", "range"],
      description: "Modo de seleção: uma data, várias ou intervalo.",
      table: { type: { summary: '"single" | "multiple" | "range"' }, defaultValue: { summary: '"single"' } },
    },
    captionLayout: {
      control: "select",
      options: ["label", "dropdown"],
      description: "Layout da legenda do mês: texto ou selects.",
      table: { type: { summary: '"label" | "dropdown"' }, defaultValue: { summary: '"label"' } },
    },
    showOutsideDays: {
      control: "boolean",
      description: "Exibe dias do mês anterior/próximo apagados nas bordas.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    showWeekNumber: {
      control: "boolean",
      description: "Exibe coluna com o número da semana ISO.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    numberOfMonths: {
      control: { type: "number", min: 1, max: 3 },
      description: "Quantidade de meses exibidos lado a lado.",
      table: { type: { summary: "number" }, defaultValue: { summary: "1" } },
    },
  },
  args: {
    mode: "single",
    captionLayout: "label",
    showOutsideDays: true,
    showWeekNumber: false,
    numberOfMonths: 1,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// O `selected` muda de TIPO com o modo — Date, Date[] ou {from,to} — e a lib não
// converte entre eles: trocar o control sem remontar deixaria o estado de um
// modo sendo lido por outro. Por isso o estado mora num wrapper, e a `key` do
// wrapper (não a do Calendar) é o que remonta e recria o valor inicial certo.
function PlaygroundCalendar(args: ComponentProps<typeof Calendar>) {
  const [selected, setSelected] = useState<unknown>(() =>
    args.mode === "multiple" ? [new Date()]
    : args.mode === "range" ? { from: new Date(), to: undefined }
    : new Date(),
  );
  // O cast é no objeto inteiro, e não em `selected` sozinho: o tipo do Calendar
  // é uma união discriminada por `mode`, e o TypeScript não consegue estreitá-la
  // a partir de um `mode` que vem dos controls em tempo de execução.
  const props = { ...args, selected, onSelect: setSelected, locale: ptBR };
  return <Calendar {...(props as ComponentProps<typeof Calendar>)} />;
}

export const Playground: Story = {
  parameters: { covers: ["visual.item1", "accessibility.item4", "accessibility.item6", "functional.item5", "accessibility.item5", "accessibility.item1", "accessibility.item2"] },
  render: (args) => <PlaygroundCalendar key={String(args.mode)} {...args} />,
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

    // A data de cada célula: o <td> carrega o ISO, que é comparável; o
    // data-day do <button> é a data formatada no locale e não serve para
    // aritmética.
    const isoDoFoco = () =>
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)
        ?.closest("[role=gridcell]")
        ?.getAttribute("data-day") ?? null;

    await step("DayButton entra na ordem de tabulação", async () => {
      // Tab, não .focus(): o critério é o dia entrar na navegação por teclado.
      // Forçar o foco passaria mesmo com o grid inteiro fora da ordem.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      for (let i = 0; i < 20 && !isoDoFoco(); i += 1) await userEvent.tab();
      await expect(isoDoFoco()).not.toBeNull();
    });

    await step("Seta move o foco para o dia seguinte", async () => {
      // functional.item5 — a asserção antiga aceitava BUTTON ou BODY, ou seja,
      // passava mesmo quando a lib não movia foco nenhum. O que o item promete
      // é percorrer o grid: então o teste compara a data de origem com a de
      // destino, e só passa se ela andou exatamente um dia.
      const origem = isoDoFoco();
      await expect(origem).not.toBeNull();
      await userEvent.keyboard("{ArrowRight}");
      const destino = isoDoFoco();
      await expect(destino).not.toBe(origem);
      const umDia = 24 * 60 * 60 * 1000;
      await expect(
        new Date(destino!).getTime() - new Date(origem!).getTime(),
      ).toBe(umDia);
    });
  },
};
