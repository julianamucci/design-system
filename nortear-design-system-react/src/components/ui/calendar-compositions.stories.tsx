import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { calendarWithPopoverSource, calendarSource } from "./calendar.source";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";

const meta = {
  title: "UI/Calendar/Compositions",
  tags: ["form"],
  component: Calendar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          "A composição canônica do calendário: ele quase nunca aparece solto na página. Mora dentro de um popover, atrás de um botão que mostra a data escolhida.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

const formatador = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function DatePickerDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 3, 12));
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline">{date ? formatador.format(date) : "Escolher data"}</Button>}
      />
      <PopoverContent>
        <Calendar
          mode="single"
          defaultMonth={new Date(2026, 3, 1)}
          selected={date}
          onSelect={(d) => {
            setDate(d);
            onSelect(d);
            // Escolhida a data, o popover não tem mais o que oferecer: mantê-lo
            // aberto obrigaria a fechá-lo à mão para ver o resultado.
            setOpen(false);
          }}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

export const DatePicker: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // São três peças e dois estados; o painel imprimia tudo isso como um
      // componente que só existe neste arquivo, e o calendário solto do `meta`
      // esconderia a composição inteira.
      source: { transform: calendarWithPopoverSource },
      description: {
        story:
          "O botão carrega a data escolhida; escolher uma nova atualiza o rótulo e fecha o popover.",
      },
    },
  },
  render: () => <DatePickerDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole("button");

    const open = async () => {
      if (trigger().getAttribute("aria-expanded") !== "true") await userEvent.click(trigger());
      return waitForPortal("dialog");
    };
    const close = async () => {
      if (trigger().getAttribute("aria-expanded") === "true") await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(trigger()).not.toHaveAttribute("aria-expanded", "true"));
    };

    await step("O botão abre o calendário", async () => {
      // Cada passo estabelece a própria precondição: o par fechar/abrir garante
      // um clique real nesta rodada, inclusive no replay do painel.
      await close();
      const panel = await open();
      await expect(within(panel).getByRole("grid")).toBeInTheDocument();
    });

    await step("Escolher um dia atualiza o botão e fecha o popover", async () => {
      // É o contrato inteiro da composição: sem a atualização do rótulo, a
      // pessoa fecha o popover e não sabe o que escolheu.
      await close();
      const panel = await open();
      onSelect.mockClear();
      await userEvent.click(within(panel).getByRole("button", { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(trigger()).toHaveTextContent("20 de abril de 2026"));
      await waitForPortalGone("dialog");
    });
  },
};
