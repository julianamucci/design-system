import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "./calendar";
import {
  calendarDoisMesesSource,
  calendarLegendaSeletoresSource,
  calendarLegendaTextoSource,
  calendarNumberWeekSource,
  calendarSource,
} from "./calendar.source";

const meta = {
  title: "UI/Calendar/Layouts",
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
          "Formato da legenda do mês, quantidade de meses visíveis ao mesmo tempo e coluna com o número da semana.",
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mês fixo, e não a data de hoje: o Chromatic fotografa estas stories, e um
// calendário ancorado no relógio gera diferença visual todo dia.
const ABRIL = () => new Date(2026, 3, 1);
const DAY_12 = () => new Date(2026, 3, 12);

export const CaptionLabel: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(DAY_12());
    return (
      <Calendar
        mode="single"
        captionLayout="label"
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: {
      // A story existe para nomear o formato da legenda; o `meta` omite o valor
      // por ser o padrão, e sem ele o par com a story de seletores se perde.
      source: { transform: calendarLegendaTextoSource },
      description: { story: "Legenda em texto com mês e ano no idioma configurado." },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A legenda traz mês e ano no idioma pedido", async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      // Exato, sem o "de" opcional: a legenda compõe mês e ano SEPARADAMENTE nas
      // quatro stacks, e aceitar as duas formas deixaria a divergência voltar.
      await expect(canvasElement).toHaveTextContent(/abril\s+(de\s+)?2026/i);
      // A linha dos dias da semana aparece na tela mas fica fora da árvore de
      // acessibilidade: cada dia já anuncia a data inteira, e repetir a coluna
      // a cada célula só encompridaria a leitura. Por isso a asserção é sobre o
      // texto visível — pedir `columnheader` aqui reprovaria de propósito.
      const cabecalho = canvasElement.querySelector("thead")!;
      await expect(cabecalho).toHaveAttribute("aria-hidden", "true");
      const dias = Array.from(cabecalho.querySelectorAll("th")).map(
        (th) => th.textContent?.trim().toLowerCase() ?? "",
      );
      // A forma curta, e a mesma nas quatro: "narrow" dá "D S T Q Q S S", com
      // duas quartas e duas quintas indistinguíveis, e o ponto de "dom." é
      // ruído numa coluna de uma palavra. Conferir só a inicial aceitava tudo.
      await expect(dias).toEqual(["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]);
    });

    await step("A legenda é texto, e não controle", async () => {
      // É o que separa esta story da seguinte: aqui não há nada para operar.
      await expect(canvas.queryAllByRole("combobox").length).toBe(0);
    });
  },
};

export const CaptionDropdown: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(DAY_12());
    return (
      <Calendar
        mode="single"
        captionLayout="dropdown"
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // A legenda vira dois controles operáveis: o `meta` cai no formato de
      // texto, que é exatamente o que esta story existe para contrastar.
      source: { transform: calendarLegendaSeletoresSource },
      description: {
        story: "Mês e ano viram seletores, para saltar de período sem passar mês a mês.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Mês e ano viram controles operáveis", async () => {
      // functional.item7 — a story existe pelo salto de período: verificar que
      // o calendário renderizou não a distingue da legenda de texto.
      await expect(canvas.getAllByRole("combobox").length).toBe(2);
    });

    await step("Cada seletor é enquadrado como controle", async () => {
      // A legenda com seletores não tinha moldura nenhuma: lia-se como o nome do
      // mês com um chevron ao lado, e nada indicava que abria. Classe presente
      // não é moldura desenhada — a asserção é sobre a borda computada.
      const molduras = canvasElement.querySelectorAll<HTMLElement>(".nds-calendar-select");
      await expect(molduras.length).toBe(2);
      for (const moldura of molduras) {
        await expect(parseFloat(getComputedStyle(moldura).borderTopWidth)).toBeGreaterThan(0);
      }
    });

    await step("O clique chega aos seletores", async () => {
      // `selectOptions` escolhe a opção por API e passa mesmo com o controle
      // coberto — foi assim que o seletor ficou inerte na tela com a suíte
      // verde. A faixa que posiciona os botões de mês é absoluta e cobre a
      // legenda inteira; `elementFromPoint` devolve QUEM está no topo do ponto,
      // e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const seletor of canvasElement.querySelectorAll<HTMLElement>(".nds-calendar-select")) {
        const r = seletor.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(seletor === noTopo || seletor.contains(noTopo)).toBe(true);
      }
    });

    await step("A lista de anos corre livre para os dois lados", async () => {
      // Uma janela curta em torno do ano em vista prendia a rolagem: para
      // passar do último ano da lista era preciso escolhê-lo e reabrir o
      // seletor. A lista agora é completa e simétrica — o que limita o que
      // aparece é a altura do painel, onze itens no CSS, com o ano corrente no
      // meio. O teto em si é desenhado pelo navegador e não é alcançável por
      // getComputedStyle daqui; o que dá para medir é a lista.
      const anos = Array.from(
        canvasElement.querySelectorAll<HTMLOptionElement>(".nds-calendar-select:last-of-type option"),
      ).map((o) => Number(o.value));
      await expect(anos.length).toBe(201);
      await expect(Math.max(...anos) - Math.min(...anos)).toBe(200);
      await expect(anos).toContain(2026);
      // Simétrico: a lib abria cem anos para trás e dez para frente, e uma data
      // no ano que vem ficava fora do alcance do seletor.
      await expect(2026 - Math.min(...anos)).toBe(Math.max(...anos) - 2026);
    });

    await step("Trocar o mês no seletor leva o grid junto", async () => {
      // Busca a cada vez: a legenda é reconstruída na troca, e uma referência
      // guardada agiria num nó fora da tela, sem erro e sem efeito.
      const seletorDeMes = () => canvas.getAllByRole("combobox")[0];
      await userEvent.selectOptions(seletorDeMes(), "5");
      await expect(canvasElement.querySelector('[data-day="2026-06-01"]')).not.toBeNull();

      // Cada passo estabelece a própria precondição: volta para abril, porque o
      // painel reexecuta a play no mesmo DOM.
      await userEvent.selectOptions(seletorDeMes(), "3");
      await expect(canvasElement.querySelector('[data-day="2026-04-01"]')).not.toBeNull();
    });

    await step("Trocar o ano no seletor leva o grid junto", async () => {
      // O ano de destino sai da própria lista, e não fixo: a lib deriva o
      // intervalo de anos do período navegável, então cravar 2028 amarraria o
      // teste a uma janela que o componente pode mudar.
      const seletorDeAno = () => canvas.getAllByRole("combobox")[1] as HTMLSelectElement;
      const otherYear = Array.from(seletorDeAno().options)
        .map((o) => o.value)
        .find((v) => v !== "2026")!;
      await expect(otherYear).toBeDefined();

      await userEvent.selectOptions(seletorDeAno(), otherYear);
      await expect(canvasElement.querySelector(`[data-day^="${otherYear}-04-"]`)).not.toBeNull();
      await userEvent.selectOptions(seletorDeAno(), "2026");
      await expect(canvasElement.querySelector('[data-day="2026-04-01"]')).not.toBeNull();
    });
  },
};

export const TwoMonths: Story = {
  render: () => {
    const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>({
      from: new Date(2026, 3, 28),
      to: new Date(2026, 4, 3),
    });
    return (
      <Calendar
        mode="range"
        numberOfMonths={2}
        defaultMonth={ABRIL()}
        selected={range as never}
        onSelect={setRange as never}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      // São dois painéis e o modo de intervalo que os justifica; o `meta` deste
      // arquivo cai num mês só, em data única.
      source: { transform: calendarDoisMesesSource },
      description: {
        story: "Dois meses lado a lado, para escolher datas que atravessam a virada.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("São dois meses consecutivos, e o intervalo atravessa a virada", async () => {
      // Contar grids passaria com dois meses iguais; o que a story mostra é a
      // travessia, então a asserção é sobre QUAIS dias estão marcados.
      await expect(canvasElement.querySelectorAll('[role="grid"]').length).toBe(2);
      const marcados = Array.from(
        canvasElement.querySelectorAll("[role=gridcell][data-selected]"),
      ).map((el) => el.getAttribute("data-day"));
      await expect(marcados[0]).toBe("2026-04-28");
      await expect(marcados[marcados.length - 1]).toBe("2026-05-03");
    });
  },
};

export const WithWeekNumber: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(DAY_12());
    return (
      <Calendar
        mode="single"
        showWeekNumber
        defaultMonth={ABRIL()}
        selected={date}
        onSelect={setDate}
        locale={ptBR}
      />
    );
  },
  parameters: {
    docs: {
      // A coluna vem desligada por padrão: sem a prop escrita, o snippet
      // mostraria um grid de sete colunas para uma story de oito.
      source: { transform: calendarNumberWeekSource },
      description: {
        story:
          "Coluna com o número da semana à esquerda do grid, para quem organiza o trabalho por semana.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step("Cada linha do mês ganha o número da semana", async () => {
      // O número é cabeçalho de linha, não um dia: sem o papel de rowheader ele
      // seria lido como mais uma data e a semana ganharia oito colunas.
      const numeros = Array.from(canvasElement.querySelectorAll('[role="rowheader"]'));
      await expect(numeros.length).toBeGreaterThan(3);
      // Abril de 2026 começa na semana ISO 14.
      await expect(numeros[0].textContent?.trim()).toBe("14");
    });
  },
};
