import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";
import {
  calendarBloqueadoSource,
  outsideCalendarDaysSource,
  calendarHojeSource,
  calendarIntervaloWithMioloSource,
  calendarSource,
} from "./calendar.source";

const meta = {
  title: "Primitives/Form/Calendar/States",
  tags: ["form"],
  component: Calendar,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          "Estados de célula: escolhida, bloqueada, o dia de hoje, os dias de fora do mês e o miolo de um intervalo.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mês fixo, e não a data de hoje: o Chromatic fotografa estas stories, e um
// calendário ancorado no relógio gera diferença visual todo dia. A exceção é a
// story `Today`, que existe justamente para mostrar o dia corrente.
const ABRIL = () => new Date(2026, 3, 1);

/** O <td> carrega a data em ISO, que é comparável; o <button> traz a formatada. */
const daysWith = (canvasElement: HTMLElement, selector: string): string[] =>
  Array.from(canvasElement.querySelectorAll(`[role=gridcell]${selector}`)).map(
    (el) => el.getAttribute("data-day") ?? "",
  );

export const Selected: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 12));
    return (
      <Calendar
        mode="single"
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["accessibility.item2", "accessibility.item3"],
    docs: {
      // Sem override: o snippet do `meta` já é o calendário controlado, e a
      // marcação da data escolhida vem justamente do estado que ele mostra.
      description: {
        story: "Data escolhida — a célula fica marcada e anuncia a data por extenso.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Só a data escolhida está marcada", async () => {
      // accessibility.item3 — "existe alguma célula marcada" passaria com o mês
      // inteiro marcado.
      await expect(daysWith(canvasElement, "[data-selected]")).toEqual(["2026-04-12"]);
    });

    await step("A célula anuncia a data por extenso", async () => {
      // accessibility.item2 — o texto visível é só "12"; sozinho ele não diz de
      // que mês nem de que ano.
      // O nome acessível mora no botão, não na célula: é ele que recebe o foco
      // e é o nome dele que o leitor de tela anuncia ao chegar no dia.
      const celula = canvasElement.querySelector("[role=gridcell][data-selected]")!;
      const button = celula.querySelector("button")!;
      await expect(button.getAttribute("aria-label")).toMatch(/12 de abril de 2026/i);
      await expect(celula).toHaveAttribute("aria-selected", "true");
    });
  },
};

export const Disabled: Story = {
  args: { onSelect: fn() },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 15));
    return (
      <Calendar
        mode="single"
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={(d) => {
          setDate(d);
          (args as { onSelect?: (d: Date | undefined) => void }).onSelect?.(d);
        }}
        disabled={{ before: new Date(2026, 3, 10) }}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["functional.item4", "visual.item4"],
    docs: {
      // `disabled` recebe um descritor de intervalo — prop que não cabe em
      // control nenhum e que o snippet do `meta` nunca mostraria.
      source: { transform: calendarBloqueadoSource },
      description: {
        story: "Datas anteriores a um limite ficam bloqueadas e não podem ser escolhidas.",
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const onSelect = (args as { onSelect?: ReturnType<typeof fn> }).onSelect!;

    await step("A regra bloqueia exatamente o intervalo que ela descreve", async () => {
      // functional.item4 — contar "há algum bloqueado" passaria com um só, e
      // também com a regra invertida.
      const bloqueados = daysWith(canvasElement, "[data-disabled]").filter((d) =>
        d.startsWith("2026-04-"),
      );
      await expect(bloqueados).toEqual([
        "2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04",
        "2026-04-05", "2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09",
      ]);
    });

    await step("Clicar num dia bloqueado não escolhe nem reporta", async () => {
      const bloqueado = canvasElement.querySelector<HTMLElement>(
        '[role=gridcell][data-day="2026-04-03"] button',
      )!;
      onSelect.mockClear();
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(onSelect).not.toHaveBeenCalled();
      await expect(daysWith(canvasElement, "[data-selected]")).toEqual(["2026-04-15"]);
    });

    await step("Um dia livre continua escolhível", async () => {
      // Sem este passo, a story passaria com o mês inteiro bloqueado.
      onSelect.mockClear();
      await userEvent.click(canvas.getByRole("button", { name: /16 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
    });

    await step("Dia bloqueado fica fora da tabulação", async () => {
      // accessibility.item2 — o dia bloqueado não é destino de Tab em nenhuma
      // stack; onde a lib deixava o atributo ausente, ele voltava para a ordem
      // (um `<button>` sem tabindex é tabulável) e a grade ganhava uma parada por
      // data bloqueada.
      const bloqueados = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(".nds-calendar-day-btn[data-disabled]"),
      );
      await expect(bloqueados.length).toBeGreaterThan(0);
      await expect(bloqueados.filter((b) => b.tabIndex >= 0)).toEqual([]);
    });
  },
};

export const Today: Story = {
  render: () => <Calendar mode="single" locale={ptBR} />,
  parameters: {
    covers: ["functional.item1"],
    docs: {
      // A AUSÊNCIA de seleção é o assunto: o snippet controlado do `meta`
      // mostraria o oposto, e destacar hoje não é tê-lo escolhido.
      source: { transform: calendarHojeSource },
      description: {
        story: "Sem data escolhida: o calendário abre no mês corrente e destaca o dia de hoje.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("O dia destacado é o de hoje mesmo", async () => {
      // functional.item1 — `data-today` presente em alguma célula não basta: a
      // regra é cair na data certa, e é isso que um erro de fuso quebraria.
      const hoje = new Date();
      const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
      await expect(daysWith(canvasElement, "[data-today]")).toContain(iso);
    });

    await step("Destacar hoje não é escolhê-lo", async () => {
      await expect(daysWith(canvasElement, "[data-selected]").length).toBe(0);
    });
  },
};

export const WithOutsideDays: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 12));
    return (
      <Calendar
        mode="single"
        showOutsideDays
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      // A story existe para NOMEAR a prop; o `meta` a omite por ser o padrão, e
      // omiti-la aqui deixaria o leitor sem saber como desligar as bordas.
      source: { transform: outsideCalendarDaysSource },
      description: {
        story:
          "Dias do mês anterior e do próximo completam a primeira e a última semana, apagados para não competirem com o mês em foco.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("As bordas do grid trazem dias de fora do mês", async () => {
      // Abril de 2026 começa numa quarta: as três primeiras casas vêm de março.
      const outside = daysWith(canvasElement, "[data-outside]");
      await expect(outside).toContain("2026-03-30");
      await expect(outside.length).toBeGreaterThan(0);
    });

    await step("Dia de fora do mês não conta como do mês", async () => {
      // O contraste é o ponto da story: sem a marcação de externo, o mês
      // pareceria ter mais dias do que tem.
      const ofMonth = Array.from(
        canvasElement.querySelectorAll('[role=gridcell][data-day^="2026-04-"]:not([data-outside])'),
      );
      await expect(ofMonth.length).toBe(30);
    });
  },
};

export const RangeWithMiddle: Story = {
  render: () => {
    const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>({
      from: new Date(2026, 3, 10),
      to: new Date(2026, 3, 18),
    });
    return (
      <Calendar
        mode="range"
        defaultMonth={ABRIL()}
        selected={range as never}
        onSelect={setRange as never}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      // Modo de intervalo num mês só: outro formato de estado, e o `meta` deste
      // arquivo cai em data única.
      source: { transform: calendarIntervaloWithMioloSource },
      description: {
        story: "Intervalo com miolo: os dias entre início e fim também ficam marcados.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("O intervalo é contínuo do início ao fim", async () => {
      // Verificar só os extremos passaria com o meio vazio, que é exatamente o
      // que esta story existe para mostrar.
      await expect(daysWith(canvasElement, "[data-selected]")).toEqual([
        "2026-04-10", "2026-04-11", "2026-04-12", "2026-04-13", "2026-04-14",
        "2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18",
      ]);
    });

    await step("Os extremos são distinguíveis do miolo", async () => {
      // Sem essa marcação, o intervalo vira um bloco só e a pessoa não vê onde
      // ele começa nem onde termina.
      const start = canvasElement.querySelector('[role=gridcell][data-day="2026-04-10"] button')!;
      const end = canvasElement.querySelector('[role=gridcell][data-day="2026-04-18"] button')!;
      await expect(start).toHaveAttribute("data-range-start", "true");
      await expect(end).toHaveAttribute("data-range-end", "true");
    });
  },
};
