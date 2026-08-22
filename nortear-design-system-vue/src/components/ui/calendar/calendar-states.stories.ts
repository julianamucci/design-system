import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';
import {
  calendarDaysBloqueadosSource,
  calendarHojeSource,
  calendarIntervaloSource,
  calendarSource,
} from './calendar.source';

const meta = {
  title: 'UI/Calendar/States',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          'Estados de célula: escolhida, bloqueada, o dia de hoje, os dias de fora do mês e o miolo de um intervalo.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Datas fixas para determinismo Chromatic — instanciadas dentro de setup()
// para evitar criar CalendarDate no import do módulo.

const valuesWith = (canvasElement: HTMLElement, seletor: string): string[] =>
  Array.from(canvasElement.querySelectorAll(seletor)).map((el) => el.getAttribute('data-value') ?? '');

// Selected — célula escolhida.
export const Selected: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref(new CalendarDate(2026, 4, 12));
      return { selected, placeholder };
    },
    template: `
      <Calendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item3'],
    docs: { description: { story: 'Data escolhida — a célula fica marcada e anuncia a data por extenso.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Só a data escolhida está marcada', async () => {
      // accessibility.item3
      await expect(valuesWith(canvasElement, '[data-selected]')).toEqual(['2026-04-12']);
    });

    await step('A célula anuncia a data por extenso', async () => {
      // accessibility.item2 — o texto visível é só "12"; sozinho ele não diz de
      // que mês nem de que ano.
      const celula = canvasElement.querySelector('[data-selected]')!;
      await expect(celula.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
      // O nome acessível não substitui o número visível: quem enxerga precisa
      // achar o dia na grade sem depender do rótulo.
      await expect(celula).toHaveTextContent('12');
    });
  },
};

// Disabled — datas antes de 10/04/2026 bloqueadas.
export const Disabled: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref(new CalendarDate(2026, 4, 12));
      const disableBefore = new CalendarDate(2026, 4, 10);
      const isDateDisabled = (d: CalendarDate) => d.compare(disableBefore) < 0;
      return { selected, placeholder, isDateDisabled };
    },
    template: `
      <Calendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        :is-date-disabled="isDateDisabled"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    // Quem bloqueia é uma função por data, e ela precisa aparecer inteira: a do
    // meta mostraria um calendário sem regra nenhuma.
    docs: {
      source: { transform: calendarDaysBloqueadosSource },
      description: { story: 'Datas anteriores a um limite ficam bloqueadas e não podem ser escolhidas.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A regra bloqueia exatamente o intervalo que ela descreve', async () => {
      // functional.item4 — contar "há algum bloqueado" passaria com um só, e
      // também com a regra invertida.
      // `[data-value]` no seletor não é enfeite: `data-disabled` também aparece
      // nos invólucros de célula, e sem ele a lista vinha com uma dúzia de
      // strings vazias na frente.
      const bloqueadas = valuesWith(canvasElement, '[data-value][data-disabled]:not([data-outside-view])');
      await expect(bloqueadas).toEqual([
        '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04',
        '2026-04-05', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09',
      ]);
    });

    await step('Clicar num dia bloqueado não muda a escolha', async () => {
      const bloqueada = canvasElement.querySelector<HTMLElement>('[data-disabled][data-value="2026-04-03"]')!;
      await expect(bloqueada).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(bloqueada, { pointerEventsCheck: 0 });
      await expect(valuesWith(canvasElement, '[data-selected]')).toEqual(['2026-04-12']);
    });

    await step('Um dia livre continua escolhível', async () => {
      // Sem este passo, a story passaria com o mês inteiro bloqueado.
      await userEvent.click(canvas.getByRole('button', { name: /14 de abril de 2026/i }));
      await expect(valuesWith(canvasElement, '[data-selected]')).toEqual(['2026-04-14']);
    });

    await step('Dia bloqueado fica fora da tabulação', async () => {
      // accessibility.item2 — nas outras stacks o dia bloqueado sai da ordem do
      // Tab. Aqui a lib não devolvia atributo NENHUM para ele, e `<button>` sem
      // tabindex é tabulável: eram quinze paradas antes de chegar ao primeiro dia
      // escolhível.
      const bloqueados = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn[data-disabled]'),
      );
      await expect(bloqueados.length).toBeGreaterThan(0);
      await expect(bloqueados.filter((b) => b.tabIndex >= 0)).toEqual([]);
    });
  },
};

// Today — sem placeholder fixo: a story existe para mostrar o destaque de hoje,
// e num mês fixo do futuro não haveria hoje nenhum para destacar.
export const Today: Story = {
  render: () => ({
    components: { Calendar },
    template: '<Calendar locale="pt-BR" class="" />',
  }),
  parameters: {
    covers: ['functional.item1'],
    // A ausência do modelo É o assunto: com um v-model no snippet, o exemplo
    // deixaria de mostrar o que acontece sem data escolhida.
    docs: {
      source: { transform: calendarHojeSource },
      description: {
        story: 'Sem data escolhida: o calendário abre no mês corrente e destaca o dia de hoje.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O dia destacado é o de hoje mesmo', async () => {
      // functional.item1 — `data-today` presente em alguma célula não basta: a
      // regra é cair na data certa, e é isso que um erro de fuso quebraria.
      const hoje = new Date();
      const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      await expect(valuesWith(canvasElement, '[data-today]')).toContain(iso);
    });

    await step('Destacar hoje não é escolhê-lo', async () => {
      await expect(canvasElement.querySelectorAll('[data-selected]').length).toBe(0);
    });
  },
};

// WithOutsideDays — dias do mês anterior/próximo aparecem esmaecidos.
export const WithOutsideDays: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref(new CalendarDate(2026, 4, 12));
      return { selected, placeholder };
    },
    template: `
      <Calendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Dias do mês anterior e do próximo completam a primeira e a última semana, apagados para não competirem com o mês em foco.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As bordas do grid trazem dias de fora do mês', async () => {
      // Abril de 2026 começa numa quarta: as três primeiras casas vêm de março.
      const fora = valuesWith(canvasElement, '[data-outside-view]');
      await expect(fora).toContain('2026-03-30');
      await expect(fora.length).toBeGreaterThan(0);
    });

    await step('Dia de fora do mês não conta como do mês', async () => {
      // O contraste é o ponto da story: se ele não estivesse marcado como
      // externo, o mês pareceria ter mais dias do que tem.
      const ofMonth = canvasElement.querySelectorAll('[data-value^="2026-04-"]:not([data-outside-view])');
      await expect(ofMonth.length).toBe(30);
    });
  },
};

// RangeWithMiddle — extremos e miolo do intervalo.
export const RangeWithMiddle: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const range = ref({
        start: new CalendarDate(2026, 4, 10),
        end: new CalendarDate(2026, 4, 18),
      });
      return { range, placeholder };
    },
    template: `
      <RangeCalendar
        v-model="range"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['functional.item3'],
    // É outro componente, com outro import e um modelo de par.
    docs: {
      source: { transform: calendarIntervaloSource },
      description: {
        story: 'Intervalo com miolo: os dias entre início e fim também ficam marcados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O intervalo é contínuo do início ao fim', async () => {
      // functional.item3 — verificar só os extremos passaria com o meio vazio,
      // que é exatamente o que esta story existe para mostrar.
      const days = valuesWith(canvasElement, '[data-selected]');
      await expect(days).toEqual([
        '2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14',
        '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18',
      ]);
    });

    await step('Os extremos são distinguíveis do miolo', async () => {
      // Sem essa marcação o intervalo vira um bloco só, e a pessoa não vê onde
      // ele começa nem onde termina.
      const start = canvasElement.querySelector('[data-value="2026-04-10"]')!;
      const end = canvasElement.querySelector('[data-value="2026-04-18"]')!;
      await expect(start).toHaveAttribute('data-selection-start');
      await expect(end).toHaveAttribute('data-selection-end');
    });
  },
};
