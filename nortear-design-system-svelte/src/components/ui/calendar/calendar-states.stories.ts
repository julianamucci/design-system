import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import {
  calendarBloqueadoSource,
  calendarHojeSource,
  calendarWeeksFixasSource,
  calendarSource,
} from './calendar.source';

const meta: Meta = {
  title: 'Components/Form/Calendar/States',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; as que mudam a chamada
      // sobrescrevem com a sua logo abaixo.
      source: { transform: calendarSource },
      description: {
        component:
          'Estados de célula: escolhida, bloqueada, o dia de hoje e os dias de fora do mês.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// O `data-value` aparece na célula E no botão dentro dela: sem escopar pela
// classe do botão, cada dia entra duas vezes na conta.
const valuesWith = (el: HTMLElement, selector: string): string[] =>
  Array.from(el.querySelectorAll(selector)).map((n) => n.getAttribute('data-value') ?? '');

export const Selected: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'selected', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'accessibility.item3'],
    docs: { description: { story: 'Data escolhida — a célula fica marcada e anuncia a data por extenso.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O mês é uma tabela de datas', async () => {
      // accessibility.item1 — `gridcell` só existe dentro de um `grid`.
      await expect(canvas.getByRole('grid')).toBeInTheDocument();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    await step('Só a data escolhida está marcada', async () => {
      // accessibility.item3 — `existe alguma célula com data-selected` passaria
      // com o mês inteiro marcado.
      await expect(valuesWith(canvasElement, '.nds-calendar-day-btn[data-value][data-selected]')).toEqual(['2026-04-12']);
    });

    await step('A célula anuncia a data por extenso', async () => {
      // accessibility.item2 — o texto visível é só "12".
      const celula = canvasElement.querySelector('.nds-calendar-day-btn[data-value][data-selected]')!;
      await expect(celula.getAttribute('aria-label')).toMatch(/12 de abril de 2026/i);
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'disabled', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      source: { transform: calendarBloqueadoSource },
      description: { story: 'Datas anteriores a um limite ficam bloqueadas e não podem ser escolhidas.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A regra bloqueia exatamente o intervalo que ela descreve', async () => {
      // functional.item4 — contar "há algum bloqueado" passaria com um só, e
      // também com a regra invertida.
      const bloqueadas = valuesWith(
        canvasElement,
        '.nds-calendar-day-btn[data-value][data-disabled]:not([data-outside-month])',
      );
      await expect(bloqueadas).toEqual([
        '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04',
        '2026-04-05', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09',
      ]);
    });

    await step('Clicar num dia bloqueado não muda a escolha', async () => {
      const bloqueada = canvasElement.querySelector<HTMLElement>('[data-value="2026-04-03"]')!;
      await userEvent.click(bloqueada, { pointerEventsCheck: 0 });
      await expect(valuesWith(canvasElement, '.nds-calendar-day-btn[data-value][data-selected]')).toEqual(['2026-04-12']);
      // E o dia bloqueado continua bloqueado depois da tentativa: um componente
      // que liberasse a data ao primeiro clique passaria só com a asserção acima.
      await expect(bloqueada).toHaveAttribute('data-disabled');
    });

    await step('Dia bloqueado fica fora da tabulação', async () => {
      // accessibility.item2 — o dia bloqueado não é destino de Tab em nenhuma
      // stack; onde a lib deixava o atributo ausente, ele voltava para a ordem
      // (um `<button>` sem tabindex é tabulável) e a grade ganhava uma parada por
      // data bloqueada.
      const bloqueados = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-day-btn[data-disabled]'),
      );
      await expect(bloqueados.length).toBeGreaterThan(0);
      await expect(bloqueados.filter((b) => b.tabIndex >= 0)).toEqual([]);
    });
  },
};

export const Today: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'today', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item1'],
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
      await expect(valuesWith(canvasElement, '.nds-calendar-day-btn[data-value][data-today]')).toContain(iso);
    });

    await step('Destacar hoje não é escolhê-lo', async () => {
      await expect(canvasElement.querySelectorAll('.nds-calendar-day-btn[data-value][data-selected]').length).toBe(0);
    });
  },
};

export const WithOutsideDays: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'withOutsideDays', locale: 'pt-BR' },
  }),
  parameters: {
    docs: {
      source: { transform: calendarWeeksFixasSource },
      description: {
        story:
          'Seis linhas de semana sempre, completadas com os dias do mês vizinho — a altura do bloco não muda ao virar o mês.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As bordas do grid trazem dias de fora do mês', async () => {
      // Abril de 2026 começa numa quarta: as três primeiras casas vêm de março.
      const outside = valuesWith(canvasElement, '.nds-calendar-day-btn[data-value][data-outside-month]');
      await expect(outside).toContain('2026-03-30');
      await expect(outside.length).toBeGreaterThan(0);
    });

    await step('Dia de fora do mês não conta como do mês', async () => {
      // O contraste é o ponto da story: sem a marcação de externo, o mês
      // pareceria ter mais dias do que tem.
      const ofMonth = canvasElement.querySelectorAll(
        '.nds-calendar-day-btn[data-value^="2026-04-"]:not([data-outside-month])',
      );
      await expect(ofMonth.length).toBe(30);
    });
  },
};
