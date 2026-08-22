import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { focusIso } from '@shared/testing/calendar-probe';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import CalendarDocs from '@/components/docs/CalendarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { calendarSource } from './calendar.source';

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CalendarDocs),
      source: { transform: calendarSource },
      description: {
        component:
          'Seletor visual de datas com navegação por mês. Para intervalos, use o RangeCalendar dedicado. A seleção múltipla, a legenda do mês e os dias de fora do mês são controlados por `multiple`, `layout` e `disableDaysOutsideCurrentView`.',
      },
    },
  },
  argTypes: {
    locale: {
      control: 'select',
      options: ['pt-BR', 'en-US', 'es-ES'],
      description: 'Locale do calendário (string). Controla nomes de meses e dias da semana.',
    },
    multiple: {
      control: 'boolean',
      description: 'Habilita seleção de múltiplas datas (modelValue vira DateValue[]).',
    },
    numberOfMonths: {
      control: { type: 'number', min: 1, max: 3 },
      description: 'Quantidade de meses exibidos lado a lado.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o calendário inteiro (sem foco, sem clique).',
    },
    readonly: {
      control: 'boolean',
      description: 'Foco permitido, seleção bloqueada.',
    },
    fixedWeeks: {
      control: 'boolean',
      description: 'Força sempre 6 linhas de semana para altura estável.',
    },
    layout: {
      control: 'select',
      options: [undefined, 'month-and-year'],
      description: 'Formato da legenda: texto, ou seletores de mês e ano.',
    },
  },
  args: {
    locale: 'pt-BR',
    multiple: false,
    numberOfMonths: 1,
    disabled: false,
    readonly: false,
    fixedWeeks: false,
    layout: undefined,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item4', 'accessibility.item6', 'functional.item5', 'accessibility.item5', 'accessibility.item1', 'accessibility.item2'] },
  render: (args) => ({
    components: { Calendar },
    setup() {
      // Data fixa para determinismo nos screenshots do Chromatic.
      const selected = ref(new CalendarDate(2026, 4, 12));
      const placeholder = new CalendarDate(2026, 4, 15);
      return { args, selected, placeholder };
    },
    template: `
      <Calendar
        v-bind="args"
        v-model="selected"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const focado = () =>
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.getAttribute('data-value') ?? null;

    await step('O mês é uma tabela de datas navegável', async () => {
      // accessibility.item1 — `gridcell` só existe dentro de um `grid`; sem o
      // papel na tabela o leitor de tela não oferece navegação bidimensional.
      await expect(canvas.getByRole('grid')).toBeVisible();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    await step('A paginação anuncia em português, e a semana não é lida duas vezes', async () => {
      // Os botões de mês só têm ícone: o que o leitor de tela anuncia é o
      // aria-label, e ele estava em três formas — "Go to previous month" cravado
      // no Vanilla, "Previous page" vindo da lib no Vue (que nem fala de mês) e
      // "Previous" no Svelte. Num calendário em português, três das quatro
      // anunciavam em inglês. Nome exato, e não regex frouxa: era a regex que
      // aceitava os dois idiomas e deixava a divergência passar.
      await expect(canvas.getByRole('button', { name: 'Ir para o mês anterior' })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Ir para o próximo mês' })).toBeInTheDocument();

      // A linha dos dias da semana fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data por extenso, e repetir a coluna a cada célula só
      // encompridaria a leitura. Duas stacks faziam, duas não.
      await expect(canvasElement.querySelector('thead')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Os botões de mês ficam dentro do calendário', async () => {
      // Eles são posicionados de forma absoluta sobre a legenda, e absoluto sem
      // ancestral posicionado sobe até achar um — no caso, a página: os dois
      // botões apareciam nos cantos superiores da tela, longe do calendário.
      // Conferir que existem não pega isso; conferir ONDE estão, sim.
      const raiz = canvasElement.querySelector('[data-slot="calendar"]')!;
      const previous = canvas.getByRole('button', { name: /previous|anterior/i });
      await expect(raiz.contains(previous)).toBe(true);

      // O `offsetParent` que importa é o do OVERLAY, não o do botão: o botão
      // está dentro do overlay, que é absoluto, então ele mesmo é o
      // offsetParent do botão e a conta não diz nada. Quem procura ancestral
      // posicionado é o overlay — e é aí que a âncora aparece ou falta.
      // Comparar coordenadas também não serve: numa story isolada o ancestral
      // escapado calha de ficar perto, e a asserção passa com o defeito.
      const overlay = previous.closest<HTMLElement>('.nds-calendar-nav-overlay')!;
      await expect(overlay.offsetParent).not.toBeNull();
      await expect(raiz.contains(overlay.offsetParent as Element)).toBe(true);
    });

    await step('O dia é um quadrado de célula, com o número no centro', async () => {
      // Medida computada, e não classe presente: a classe estava lá nas quatro
      // e mesmo assim o Vue desenhava 48×48, porque herdava o padding do botão
      // que ele compõe por fora. E o Svelte, que não compõe botão nenhum,
      // deixava o número no canto superior esquerdo.
      const dia = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn')!;
      const cs = getComputedStyle(dia);
      const caixa = dia.getBoundingClientRect();

      await expect(Math.round(caixa.width)).toBe(Math.round(caixa.height));
      await expect(Math.round(caixa.width)).toBeLessThanOrEqual(36);
      await expect(cs.alignItems).toBe('center');
      await expect(cs.justifyContent).toBe('center');
    });

    await step('A paginação de mês é ghost: sem moldura própria', async () => {
      // O Vue e o Vanilla desenhavam esses botões com borda e fundo, enquanto o
      // React e o Svelte usavam ghost — o mesmo controle com dois pesos
      // diferentes. Emoldurado, ele competia com o dia escolhido, que é o único
      // elemento do calendário que deveria ter peso. Medida computada, porque
      // classe presente não é borda ausente.
      const previous = canvas.getByRole('button', { name: /previous|anterior/i });
      const cs = getComputedStyle(previous);
      await expect(parseFloat(cs.borderTopWidth)).toBe(0);
      await expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(cs.backgroundColor);
    });

    await step('A semana respira longe da legenda, e o dia vizinho é apagado', async () => {
      // Os dois eram divergência entre stacks: o respiro era 16px no React e no
      // Svelte, 8 no Vanilla e ZERO no Vue (lá o cabeçalho é irmão dos meses,
      // então o gap interno não o alcançava). E o dia de fora do mês só ficava
      // apagado no Vue e no Vanilla — no React a regra mirava a célula, e o
      // botão dentro dela repunha a própria cor; no Svelte não havia regra.
      const legenda = canvasElement.querySelector<HTMLElement>('.nds-calendar-caption')!;
      const semana = canvasElement.querySelector<HTMLElement>('thead')!;
      const respiro = semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom;
      await expect(Math.round(respiro)).toBe(16);

      const neighbour = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn[data-outside-view]')!;
      const ofMonth = canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn:not([data-outside-view])')!;
      await expect(getComputedStyle(neighbour).color).not.toBe(getComputedStyle(ofMonth).color);
    });

    await step('O clique nos botões de mês chega neles', async () => {
      // `userEvent.click` acerta o elemento mesmo com outra coisa pintada
      // por cima: ele verifica `pointer-events`, não oclusão. Foi assim que a nav
      // ficou morta na tela com a suíte verde — a legenda, posicionada, pintava
      // por cima e engolia o clique. `elementFromPoint` devolve QUEM está no
      // topo naquele ponto, e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const nome of [/previous|anterior/i, /next|próximo|proximo/i]) {
        const btn = canvas.getByRole('button', { name: nome });
        const r = btn.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(btn.contains(noTopo)).toBe(true);
      }
    });

    await step('A linha dos dias da semana é decorativa', async () => {
      // Ela aparece na tela, mas fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data inteira, e repetir a coluna a cada célula só
      // encompridaria a leitura. Por isso a asserção é sobre o texto visível,
      // não sobre papel — pedir `columnheader` aqui reprovaria de propósito.
      const days = canvasElement.querySelectorAll('[data-slot="calendar-head-cell"]');
      await expect(days.length).toBe(7);
      await expect(days[0].closest('thead')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Cada dia anuncia a data por extenso', async () => {
      // accessibility.item2 — o texto visível é só o número.
      const escolhido = canvasElement.querySelector('[data-slot="calendar-cell-trigger"][data-selected]')!;
      await expect(escolhido).toBeInTheDocument();
      await expect(escolhido.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
    });

    await step('Tab entra no grid uma vez só e as setas percorrem o mês', async () => {
      // functional.item5 e accessibility.item5 — o grid é uma parada de
      // tabulação, não trinta: quem entra anda com as setas e sai com um Tab.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      for (let i = 0; i < 12 && !focado(); i += 1) await userEvent.tab();
      const origem = focado();
      await expect(origem).not.toBeNull();
      await userEvent.keyboard('{ArrowRight}');
      const destination = focado();
      const umDay = 24 * 60 * 60 * 1000;
      await expect(new Date(destination!).getTime() - new Date(origem!).getTime()).toBe(umDay);
    });

    await step('A grade é UMA parada de tabulação', async () => {
      // accessibility.item2 — o item promete "só o dia corrente entra na ordem
      // do Tab" desde sempre, e nenhuma asserção o cobrava: medido, esta stack
      // tinha TRINTA paradas, uma por dia do mês. A correção anterior de
      // tabulação mirava só os dias de fora do mês e apagou o -1 da lib no resto.
      const tabulaveis = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).filter((d) => d.tabIndex >= 0);
      await expect(tabulaveis).toHaveLength(1);
    });

    await step('A grade se nomeia pelo mês em vista', async () => {
      // Sem `aria-label` o grid é anunciado como "tabela" e nada mais — e com
      // dois meses na tela as duas soam iguais.
      const grade = canvasElement.querySelector('table')!;
      await expect(grade.getAttribute('aria-label')).toMatch(/abril 2026/i);
    });

    await step('Home, End e Page Up/Down andam na grade e o foco acompanha', async () => {
      // accessibility.keyboard.homeEnd e .pageUpDown — as duas linhas estavam
      // documentadas e sem asserção nenhuma; medido, aqui as quatro teclas não
      // faziam absolutamente nada.
      //
      // A precondição é própria e a sequência devolve a grade ao mês de partida,
      // para o replay do painel medir o mesmo.
      const doc = canvasElement.ownerDocument;
      // A partida é o dia que É a parada de tabulação da grade — o mesmo ponto a
      // que um teclado chega por Tab. Pegar um dia qualquer por índice testaria
      // uma entrada que ninguém consegue fazer.
      const partida = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn'),
      ).find((d) => d.tabIndex >= 0)!;
      partida.focus();
      await expect(focusIso(doc)).not.toBeNull();
      const emUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(emUtc(focusIso(doc)!).getUTCDay()).toBe(0));
      const domingo = focusIso(doc)!;

      await userEvent.keyboard('{End}');
      await waitFor(() => expect(emUtc(focusIso(doc)!).getUTCDay()).toBe(6));
      await expect(
        (emUtc(focusIso(doc)!).getTime() - emUtc(domingo).getTime()) / 86_400_000,
      ).toBe(6);
      const sabado = focusIso(doc)!;

      await userEvent.keyboard('{PageDown}');
      await waitFor(() =>
        expect(emUtc(focusIso(doc)!).getUTCMonth()).toBe((emUtc(sabado).getUTCMonth() + 1) % 12),
      );

      await userEvent.keyboard('{PageUp}');
      await waitFor(() => expect(focusIso(doc)).toBe(sabado));
    });
  },
};
