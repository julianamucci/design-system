import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';

const meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
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

// Datas fixas para determinismo dos screenshots Chromatic — instanciadas dentro
// de setup() para evitar criar CalendarDate no import do módulo.

export const Single: Story = {
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

export const Multiple: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref([
        new CalendarDate(2026, 4, 8),
        new CalendarDate(2026, 4, 15),
        new CalendarDate(2026, 4, 22),
      ]);
      return { selected, placeholder };
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Range: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref({
        start: new CalendarDate(2026, 4, 10),
        end: new CalendarDate(2026, 4, 18),
      });
      return { selected, placeholder };
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
