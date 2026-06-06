import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';

const meta = {
  title: 'UI/Calendar/Estados',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estados visuais das células do Calendar Vue. Os estilos são aplicados via data-attributes (data-selected, data-today, data-disabled, data-outside-view) pelo CalendarCellTrigger do projeto.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Datas fixas para determinismo Chromatic — instanciadas dentro de setup()
// para evitar criar CalendarDate no import do módulo.

// Selected — célula com data-selected + bg-primary.
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
        class="rounded-md border"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// Disabled — datas antes de 10/04/2026 bloqueadas via isDateDisabled.
export const Disabled: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref(new CalendarDate(2026, 4, 12));
      const disableBefore = new CalendarDate(2026, 4, 10);
      const isDateDisabled = (d: any) => d.compare(disableBefore) < 0;
      return { selected, placeholder, isDateDisabled };
    },
    template: `
      <Calendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        :is-date-disabled="isDateDisabled"
        class="rounded-md border"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// Today — sem v-model; o placeholder navega até o mês do dia atual e o reka-ui
// marca a célula com data-today (bg-accent pelo CalendarCellTrigger do projeto).
export const Today: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      // Data fixa para estabilidade do Chromatic — em produção o today é real
      const placeholder = new CalendarDate(2026, 4, 15);
      return { placeholder };
    },
    template: `
      <Calendar locale="pt-BR" :placeholder="placeholder" class="rounded-md border" />
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// WithOutsideDays — padrão do reka-ui (disableDaysOutsideCurrentView=false).
// Dias do mês anterior/próximo aparecem esmaecidos (data-outside-view).
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
        class="rounded-md border"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// RangeWithMiddle — início/fim com bg-primary; dias do meio com bg-accent (data-selected).
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
        class="rounded-md border"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
