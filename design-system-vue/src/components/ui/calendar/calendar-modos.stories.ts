import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';

const meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Modos de seleção do Calendar Vue. Para "single" (padrão) e "multiple" use o Calendar. Para "range" use o RangeCalendar dedicado — componente separado no reka-ui.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Datas fixas para determinismo dos screenshots Chromatic
const PLACEHOLDER = new CalendarDate(2026, 4, 15);
const SINGLE_DATE = new CalendarDate(2026, 4, 12);
const MULTIPLE_DATES = [
  new CalendarDate(2026, 4, 8),
  new CalendarDate(2026, 4, 15),
  new CalendarDate(2026, 4, 22),
];
const RANGE_START = new CalendarDate(2026, 4, 10);
const RANGE_END = new CalendarDate(2026, 4, 18);

export const Single: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SINGLE_DATE);
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

export const Multiple: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(MULTIPLE_DATES);
      return { selected, placeholder: PLACEHOLDER };
    },
    template: `
      <Calendar
        v-model="selected"
        multiple
        locale="pt-BR"
        :placeholder="placeholder"
        class="rounded-md border"
      />
    `,
  }),
};

export const Range: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const selected = ref({ start: RANGE_START, end: RANGE_END });
      return { selected, placeholder: PLACEHOLDER };
    },
    template: `
      <RangeCalendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        class="rounded-md border"
      />
    `,
  }),
};
