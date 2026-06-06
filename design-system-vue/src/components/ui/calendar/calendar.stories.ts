import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import CalendarDocs from '@/components/docs/CalendarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CalendarDocs),
      description: {
        component:
          'Seletor visual de datas com navegação por mês. Wrapper do CalendarRoot da reka-ui (13 subcomponentes). Para intervalos, use o RangeCalendar dedicado. A API diverge do React: não há prop `mode`/`captionLayout`/`showOutsideDays` — use `multiple`, `layout` e `disableDaysOutsideCurrentView`.',
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
      options: [undefined, 'month-and-year', 'month-only', 'year-only'],
      description: 'Legenda do mês/ano. Equivalente ao captionLayout do React.',
    },
  },
  args: {
    locale: 'pt-BR',
    multiple: false,
    numberOfMonths: 1,
    disabled: false,
    readonly: false,
    fixedWeeks: false,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
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
        class="rounded-md border"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Calendar está presente no DOM', async () => {
      const root = canvasElement.querySelector('[data-slot="calendar"]');
      await expect(root).toBeInTheDocument();
    });

    await step('Grid do calendário é renderizado', async () => {
      const grid = canvas.getByRole('grid');
      await expect(grid).toBeVisible();
    });

    await step('Dias da semana aparecem como rowheader', async () => {
      const rowheaders = canvas.getAllByRole('columnheader');
      await expect(rowheaders.length).toBeGreaterThan(0);
    });

    await step('Células clicáveis estão presentes', async () => {
      const cells = canvas.getAllByRole('button');
      // Pelo menos os botões de navegação (2) + dias do mês (~28-31).
      await expect(cells.length).toBeGreaterThan(20);
    });

    await step('Data selecionada traz data-selected', async () => {
      const selectedCell = canvasElement.querySelector('[data-slot="calendar-cell-trigger"][data-selected]');
      await expect(selectedCell).toBeInTheDocument();
    });
  },
};
