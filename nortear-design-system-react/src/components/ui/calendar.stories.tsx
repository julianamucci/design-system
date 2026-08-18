import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { ptBR } from "react-day-picker/locale";
import { isoDoFoco } from "@shared/testing/calendar-probe";
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

    await step("A paginação anuncia em português, e a semana não é lida duas vezes", async () => {
      // Os botões de mês só têm ícone: o que o leitor de tela anuncia é o
      // aria-label, e ele estava em três formas — "Go to previous month" cravado
      // no Vanilla, "Previous page" vindo da lib no Vue (que nem fala de mês) e
      // "Previous" no Svelte. Num calendário em português, três das quatro
      // anunciavam em inglês. Nome exato, e não regex frouxa: era a regex que
      // aceitava os dois idiomas e deixava a divergência passar.
      await expect(canvas.getByRole("button", { name: "Ir para o mês anterior" })).toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Ir para o próximo mês" })).toBeInTheDocument();

      // A linha dos dias da semana fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data por extenso, e repetir a coluna a cada célula só
      // encompridaria a leitura. Duas stacks faziam, duas não.
      await expect(canvasElement.querySelector("thead")).toHaveAttribute("aria-hidden", "true");
    });

    await step("Botões de navegação possuem aria-label", async () => {
      const prev = canvas.getByRole("button", { name: /previous|anterior/i });
      const next = canvas.getByRole("button", { name: /next|próximo|proximo/i });
      await expect(prev).toBeInTheDocument();
      await expect(next).toBeInTheDocument();
    });

    await step("O dia é um quadrado de célula, com o número no centro", async () => {
      // Medida computada, e não classe presente: a classe estava lá nas quatro
      // e mesmo assim o Vue desenhava 48×48, porque herdava o padding do botão
      // que ele compõe por fora. E o Svelte, que não compõe botão nenhum,
      // deixava o número no canto superior esquerdo.
      const dia = canvasElement.querySelector<HTMLElement>(".nds-calendar-day-btn")!;
      const cs = getComputedStyle(dia);
      const caixa = dia.getBoundingClientRect();

      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
      await expect(Math.round(caixa.width)).toBeLessThanOrEqual(36);
      await expect(cs.alignItems).toBe("center");
      await expect(cs.justifyContent).toBe("center");
    });

    await step("A paginação de mês é ghost: sem moldura própria", async () => {
      // O Vue e o Vanilla desenhavam esses botões com borda e fundo, enquanto o
      // React e o Svelte usavam ghost — o mesmo controle com dois pesos
      // diferentes. Emoldurado, ele competia com o dia escolhido, que é o único
      // elemento do calendário que deveria ter peso. Medida computada, porque
      // classe presente não é borda ausente.
      const anterior = canvas.getByRole("button", { name: /previous|anterior/i });
      const cs = getComputedStyle(anterior);
      await expect(parseFloat(cs.borderTopWidth)).toBe(0);
      await expect(["transparent", "rgba(0, 0, 0, 0)"]).toContain(cs.backgroundColor);
    });

    await step("A semana respira longe da legenda, e o dia vizinho é apagado", async () => {
      // Os dois eram divergência entre stacks: o respiro era 16px no React e no
      // Svelte, 8 no Vanilla e ZERO no Vue (lá o cabeçalho é irmão dos meses,
      // então o gap interno não o alcançava). E o dia de fora do mês só ficava
      // apagado no Vue e no Vanilla — no React a regra mirava a célula, e o
      // botão dentro dela repunha a própria cor; no Svelte não havia regra.
      const legenda = canvasElement.querySelector<HTMLElement>(".nds-calendar-caption")!;
      const semana = canvasElement.querySelector<HTMLElement>("thead")!;
      const respiro = semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom;
      await expect(Math.round(respiro)).toBe(16);

      const vizinho = canvasElement.querySelector<HTMLElement>(".nds-calendar-outside .nds-calendar-day-btn")!;
      const doMes = canvasElement.querySelector<HTMLElement>(
        ".nds-calendar-day-cell:not(.nds-calendar-outside) .nds-calendar-day-btn",
      )!;
      await expect(getComputedStyle(vizinho).color).not.toBe(getComputedStyle(doMes).color);
    });

    await step("O clique nos botões de mês chega neles", async () => {
      // `userEvent.click` acerta o elemento mesmo com outra coisa pintada por
      // cima: ele verifica `pointer-events`, não oclusão. Foi assim que a nav
      // ficou morta na tela com a suíte verde — a legenda, posicionada, pintava
      // por cima e engolia o clique. `elementFromPoint` devolve QUEM está no
      // topo naquele ponto, e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const nome of [/previous|anterior/i, /next|próximo|proximo/i]) {
        const btn = canvas.getByRole("button", { name: nome });
        const r = btn.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(btn.contains(noTopo)).toBe(true);
      }
    });

    await step("Os botões de mês trocam o mês exibido", async () => {
      // Cada passo estabelece a própria precondição: avança e volta, para o
      // painel reexecutar a play no mesmo DOM e medir o mesmo.
      const legenda = () => canvasElement.querySelector(".nds-calendar-caption")?.textContent ?? "";
      const inicial = legenda();
      await userEvent.click(canvas.getByRole("button", { name: /next|próximo|proximo/i }));
      await expect(legenda()).not.toBe(inicial);
      await userEvent.click(canvas.getByRole("button", { name: /previous|anterior/i }));
      await expect(legenda()).toBe(inicial);
    });

    // O ISO do dia focado vem do colhedor compartilhado. Havia aqui uma cópia
    // local que lia só o <td>, porque o data-day do <button> é formatado no
    // locale e não serve para aritmética — o colhedor já resolve isso: valida o
    // formato antes de aceitar o atributo do botão e cai para a célula quando
    // ele não bate. A cópia sombreava o import e quebrava o typecheck.
    const doc = canvasElement.ownerDocument;

    await step("DayButton entra na ordem de tabulação", async () => {
      // Tab, não .focus(): o critério é o dia entrar na navegação por teclado.
      // Forçar o foco passaria mesmo com o grid inteiro fora da ordem.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      for (let i = 0; i < 20 && !isoDoFoco(doc); i += 1) await userEvent.tab();
      await expect(isoDoFoco(doc)).not.toBeNull();
    });

    await step("Seta move o foco para o dia seguinte", async () => {
      // functional.item5 — a asserção antiga aceitava BUTTON ou BODY, ou seja,
      // passava mesmo quando a lib não movia foco nenhum. O que o item promete
      // é percorrer o grid: então o teste compara a data de origem com a de
      // destino, e só passa se ela andou exatamente um dia.
      const origem = isoDoFoco(doc);
      await expect(origem).not.toBeNull();
      await userEvent.keyboard("{ArrowRight}");
      const destino = isoDoFoco(doc);
      await expect(destino).not.toBe(origem);
      const umDia = 24 * 60 * 60 * 1000;
      await expect(
        new Date(destino!).getTime() - new Date(origem!).getTime(),
      ).toBe(umDia);
    });

    await step("A grade é UMA parada de tabulação", async () => {
      // accessibility.item2 — o item promete "só o dia corrente entra na ordem
      // do Tab" desde sempre, e nenhuma asserção o cobrava: medido, uma stack
      // tinha trinta paradas e outra seis. Contar é o único jeito de ver isso.
      const tabulaveis = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(".nds-calendar-day-btn"),
      ).filter((d) => d.tabIndex >= 0);
      await expect(tabulaveis).toHaveLength(1);
    });

    await step("A grade se nomeia pelo mês em vista", async () => {
      // Sem `aria-label` o grid é anunciado como "tabela" e nada mais — e com
      // dois meses na tela as duas soam iguais.
      const grade = canvasElement.querySelector("table")!;
      await expect(grade.getAttribute("aria-label")).toMatch(/\d{4}/);
    });

    await step("Home, End e Page Up/Down andam na grade e o foco acompanha", async () => {
      // accessibility.keyboard.homeEnd e .pageUpDown — as duas linhas estavam
      // documentadas e sem asserção nenhuma; medido, duas stacks não faziam
      // nada com essas teclas e uma largava o foco no body.
      //
      // A precondição é própria (o foco parte de um dia conhecido) e a sequência
      // devolve a grade ao mês de partida, para o replay do painel medir o mesmo.
      const doc = canvasElement.ownerDocument;
      // A partida é o dia que É a parada de tabulação da grade — o mesmo ponto a
      // que um teclado chega por Tab. Pegar um dia qualquer por índice testaria
      // uma entrada que ninguém consegue fazer.
      const partida = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(".nds-calendar-day-btn"),
      ).find((d) => d.tabIndex >= 0)!;
      partida.focus();
      const origem = isoDoFoco(doc);
      await expect(origem).not.toBeNull();
      const emUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(emUtc(isoDoFoco(doc)!).getUTCDay()).toBe(0));
      const domingo = isoDoFoco(doc)!;

      await userEvent.keyboard("{End}");
      await waitFor(() => expect(emUtc(isoDoFoco(doc)!).getUTCDay()).toBe(6));
      // Mesma semana: seis dias depois do domingo em que Home parou.
      await expect(
        (emUtc(isoDoFoco(doc)!).getTime() - emUtc(domingo).getTime()) / 86_400_000,
      ).toBe(6);
      const sabado = isoDoFoco(doc)!;

      await userEvent.keyboard("{PageDown}");
      await waitFor(() =>
        expect(emUtc(isoDoFoco(doc)!).getUTCMonth()).toBe(
          (emUtc(sabado).getUTCMonth() + 1) % 12,
        ),
      );

      await userEvent.keyboard("{PageUp}");
      await waitFor(() => expect(isoDoFoco(doc)).toBe(sabado));
    });
  },
};
