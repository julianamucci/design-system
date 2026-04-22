import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';

const meta = {
  title: 'UI/Calendar/Estados',
  component: Calendar,
  parameters: {
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

const PLACEHOLDER = new CalendarDate(2026, 4, 15);
const SELECTED_DATE = new CalendarDate(2026, 4, 12);
const DISABLE_BEFORE = new CalendarDate(2026, 4, 10);

// Data fixa "hoje" para não quebrar entre builds — usamos a mesma data de placeholder.
// O estado "today" real só aparece quando a data atual cai dentro do mês visível.
// Selected — célula com data-selected + bg-primary.
export const Selected: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SELECTED_DATE);
      return { selected, placeholder: PLACEHOLDER };
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
};

// Disabled — datas antes de 10/04/2026 bloqueadas via isDateDisabled.
export const Disabled: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SELECTED_DATE);
      const isDateDisabled = (d: any) => d.compare(DISABLE_BEFORE) < 0;
      return { selected, placeholder: PLACEHOLDER, isDateDisabled };
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
};

// Today — sem v-model; o placeholder navega até o mês do dia atual e o reka-ui
// marca a célula com data-today (bg-accent pelo CalendarCellTrigger do projeto).
export const Today: Story = {
  render: () => ({
    components: { Calendar },
    template: `
      <Calendar locale="pt-BR" class="rounded-md border" />
    `,
  }),
};

// WithOutsideDays — padrão do reka-ui (disableDaysOutsideCurrentView=false).
// Dias do mês anterior/próximo aparecem esmaecidos (data-outside-view).
export const WithOutsideDays: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SELECTED_DATE);
      return { selected, placeholder: PLACEHOLDER };
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
};

// RangeWithMiddle — início/fim com bg-primary; dias do meio com bg-accent (data-selected).
export const RangeWithMiddle: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const range = ref({
        start: new CalendarDate(2026, 4, 10),
        end: new CalendarDate(2026, 4, 18),
      });
      return { range, placeholder: PLACEHOLDER };
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
};
