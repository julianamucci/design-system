import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
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
      options: [undefined, 'month-and-year', 'month-only', 'year-only'],
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
        class="nds-rounded-md nds-border-default"
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

    await step('A linha dos dias da semana é decorativa', async () => {
      // Ela aparece na tela, mas fica fora da árvore de acessibilidade: cada
      // dia já anuncia a data inteira, e repetir a coluna a cada célula só
      // encompridaria a leitura. Por isso a asserção é sobre o texto visível,
      // não sobre papel — pedir `columnheader` aqui reprovaria de propósito.
      const dias = canvasElement.querySelectorAll('[data-slot="calendar-head-cell"]');
      await expect(dias.length).toBe(7);
      await expect(dias[0].closest('thead')).toHaveAttribute('aria-hidden', 'true');
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
      const destino = focado();
      const umDia = 24 * 60 * 60 * 1000;
      await expect(new Date(destino!).getTime() - new Date(origem!).getTime()).toBe(umDia);
    });
  },
};
