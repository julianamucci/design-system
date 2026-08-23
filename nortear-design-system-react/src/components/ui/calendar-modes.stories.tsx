import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import {
  STATES_WITH_TEXT_LEGIVEL,
  describeContrast,
  calendarMeasureContrast,
} from "@shared/testing/calendar-probe";
import { Calendar } from "./calendar";
import {
  calendarIntervaloSource,
  calendarMultiplasSource,
  calendarSource,
} from "./calendar.source";

const meta = {
  title: "UI/Calendar/Modes",
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
          "Modos de seleção: uma data, várias datas avulsas ou um intervalo contínuo. O que a seleção guarda muda com o modo.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mês fixo, e não a data de hoje: o Chromatic fotografa estas stories, e um
// calendário ancorado no relógio gera diferença visual todo dia — a regressão
// de verdade se perde no meio do ruído.
const ABRIL = () => new Date(2026, 3, 1);

/** Datas marcadas, em ordem de grid. O <td> carrega o ISO, comparável. */
function checked(canvasElement: HTMLElement): string[] {
  return Array.from(canvasElement.querySelectorAll("[role=gridcell][data-selected]")).map(
    (el) => el.getAttribute("data-day") ?? "",
  );
}

export const Single: Story = {
  args: {
    onSelect: fn(),
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 12));
    return (
      <Calendar
        mode="single"
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={(d) => {
          setDate(d);
          (args as { onSelect?: (d: Date | undefined) => void }).onSelect?.(d);
        }}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["functional.item2", "accessibility.item1", "visual.item2"],
    docs: {
      // Sem override: o padrão do `meta` já é o calendário de uma data só, e um
      // snippet próprio seria a mesma string escrita duas vezes.
      description: {
        story: "Uma data por vez: escolher outra troca a marcação em vez de somar.",
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const onSelect = (args as { onSelect?: ReturnType<typeof fn> }).onSelect!;

    await step("O mês é uma tabela de datas", async () => {
      // accessibility.item1
      await expect(canvas.getByRole("grid")).toBeInTheDocument();
      await expect(canvas.getAllByRole("gridcell").length).toBeGreaterThan(27);
    });

    await step("A data inicial chega marcada, e só ela", async () => {
      await expect(checked(canvasElement)).toEqual(["2026-04-12"]);
    });

    await step("Escolher outra data substitui a marcação e reporta a escolha", async () => {
      // functional.item2 — o modo único quebra justamente aqui: se a marcação
      // antiga sobrevivesse, a tela mostraria duas datas escolhidas.
      onSelect.mockClear();
      await userEvent.click(canvas.getByRole("button", { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      await expect(onSelect.mock.calls[0][0] instanceof Date).toBe(true);
      await expect(checked(canvasElement)).toEqual(["2026-04-20"]);
    });
  },
};

export const Multiple: Story = {
  render: () => {
    const [dates, setDates] = useState<Date[] | undefined>([
      new Date(2026, 3, 8),
      new Date(2026, 3, 12),
      new Date(2026, 3, 16),
    ]);
    return (
      <Calendar
        mode="multiple"
        defaultMonth={ABRIL()}
        selected={dates}
        onSelect={setDates}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      // O estado vira lista: é a troca de FORMATO do valor selecionado que o
      // snippet de data única esconderia.
      source: { transform: calendarMultiplasSource },
      description: {
        story: "Várias datas avulsas: cada escolha soma à lista, e escolher de novo remove.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("As três datas iniciais chegam marcadas", async () => {
      await expect(checked(canvasElement)).toEqual(["2026-04-08", "2026-04-12", "2026-04-16"]);
    });

    await step("Uma nova escolha soma, e repetir remove", async () => {
      // É esta a diferença para o modo único, e nenhuma asserção a cobria.
      // Cada passo estabelece a própria precondição: o segundo clique devolve o
      // grid ao estado inicial, para o replay no painel medir o mesmo.
      // Busca a cada vez: o dia é reconstruído entre os cliques, e uma
      // referência guardada agiria num nó fora da tela, sem erro e sem efeito.
      const dia29 = () => canvas.getByRole("button", { name: /29 de abril de 2026/i });
      await userEvent.click(dia29());
      await expect(checked(canvasElement)).toEqual([
        "2026-04-08",
        "2026-04-12",
        "2026-04-16",
        "2026-04-29",
      ]);
      await userEvent.click(dia29());
      await expect(checked(canvasElement)).toEqual(["2026-04-08", "2026-04-12", "2026-04-16"]);
    });
  },
};

export const Range: Story = {
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
        numberOfMonths={2}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["functional.item3"],
    docs: {
      // O estado guarda início e fim, não uma lista de dias — outro formato, e
      // com dois meses na tela porque o intervalo costuma cruzar a virada.
      source: { transform: calendarIntervaloSource },
      description: {
        story: "Intervalo contínuo: os extremos e todos os dias entre eles ficam marcados.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("O intervalo é contínuo do início ao fim", async () => {
      // functional.item3 — a story existe para mostrar o miolo. Verificar só os
      // extremos passaria com o intervalo inteiro vazio no meio.
      await expect(checked(canvasElement)).toEqual([
        "2026-04-10", "2026-04-11", "2026-04-12", "2026-04-13", "2026-04-14",
        "2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18",
      ]);
    });

    await step("Os extremos são distinguíveis do miolo", async () => {
      // Sem essa marcação o intervalo vira um bloco só, e a pessoa não vê onde
      // ele começa nem onde termina.
      const start = canvasElement.querySelector('[role=gridcell][data-day="2026-04-10"] button')!;
      const end = canvasElement.querySelector('[role=gridcell][data-day="2026-04-18"] button')!;
      await expect(start).toHaveAttribute("data-range-start", "true");
      await expect(end).toHaveAttribute("data-range-end", "true");
    });

    await step("A faixa do miolo é pintada pela célula, não pelo botão", async () => {
      // O botão é mais estreito que a célula, então pintá-lo deixava falha entre
      // as colunas — e usava outro par de tokens (`--muted`/`--foreground`) do
      // que as demais stacks (`--accent`/`--accent-foreground`). No tema default
      // os dois valores coincidem e ninguém via; no warm e no cold, não.
      const meio = canvasElement.querySelector<HTMLElement>(
        '[role=gridcell][data-day="2026-04-14"] button',
      )!;
      const celula = meio.closest<HTMLElement>("[role=gridcell]")!;
      await expect(getComputedStyle(meio).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      await expect(getComputedStyle(celula).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    });

    await step("As pontas do intervalo passam em contraste nos três temas e nos dois modos", async () => {
      // accessibility.item6 — o item prometia 4.5:1 e a verificação declarada era
      // "axe-core / Lighthouse", que só enxerga o tema claro da marca default: um
      // sexto do produto. Medido no escuro, as pontas do intervalo de uma stack
      // marcavam 1.18:1, porque uma regra de botão mais específica vencia o fundo
      // `--primary` — o número do dia sumia. Aritmética, não olhômetro.
      const measurements = calendarMeasureContrast(canvasElement).filter(
        (m) => m.presente && STATES_WITH_TEXT_LEGIVEL.includes(m.state as never),
      );
      await expect(measurements.length).toBeGreaterThan(0);
      const reprovadas = measurements.filter((m) => (m.ratio ?? 0) < 4.5).map(describeContrast);
      await expect(reprovadas).toEqual([]);
    });
  },
};
