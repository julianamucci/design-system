import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';

const meta = {
  title: 'UI/Calendar/Layouts',
  component: Calendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Layouts disponíveis no Calendar Vue. Diverge do React: `layout` substitui `captionLayout`, e não existe `showWeekNumber` — o reka-ui não expõe coluna de número da semana.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const PLACEHOLDER = new CalendarDate(2026, 4, 15);
const SINGLE_DATE = new CalendarDate(2026, 4, 12);

// Heading textual (layout default — equivale a captionLayout="label" do React).
export const CaptionLabel: Story = {
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

// Dropdowns de mês e ano (equivale a captionLayout="dropdown" do React).
export const CaptionDropdown: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SINGLE_DATE);
      return { selected, placeholder: PLACEHOLDER };
    },
    template: `
      <Calendar
        v-model="selected"
        layout="month-and-year"
        locale="pt-BR"
        :placeholder="placeholder"
        class="rounded-md border"
      />
    `,
  }),
};

// Dois meses lado a lado (útil para range ou visão ampliada).
export const TwoMonths: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SINGLE_DATE);
      return { selected, placeholder: PLACEHOLDER };
    },
    template: `
      <Calendar
        v-model="selected"
        :number-of-months="2"
        locale="pt-BR"
        :placeholder="placeholder"
        class="rounded-md border"
      />
    `,
  }),
};

// OBS: O reka-ui Calendar não expõe `showWeekNumber` nem slot oficial para coluna ISO-week.
// O mais próximo é `fixedWeeks` (força 6 linhas para altura estável). Documentamos essa
// divergência em relação ao React e usamos `fixedWeeks` como substituto visual da variante.
export const WithFixedWeeks: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O Vue (reka-ui) não expõe `showWeekNumber` — essa prop existe apenas no react-day-picker. Como substituto mais próximo mostramos `fixedWeeks`, que força 6 linhas de semana para altura estável.',
      },
    },
  },
  render: () => ({
    components: { Calendar },
    setup() {
      const selected = ref(SINGLE_DATE);
      return { selected, placeholder: PLACEHOLDER };
    },
    template: `
      <Calendar
        v-model="selected"
        fixed-weeks
        locale="pt-BR"
        :placeholder="placeholder"
        class="rounded-md border"
      />
    `,
  }),
};
