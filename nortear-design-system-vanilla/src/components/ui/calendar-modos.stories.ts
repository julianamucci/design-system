import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCalendar } from './calendar';
import { fn, userEvent, within, expect } from 'storybook/test';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Modo de seleção do Calendar. A factory expõe seleção única: `value` define a
// data inicial e `onSelect` recebe a data escolhida a cada clique.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Modos',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Modo de seleção do Calendar: uma data por vez.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () =>
    createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      onSelect,
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['functional.item2', 'accessibility.item3', 'visual.item2'],
    coversNotApplicable: {
      'functional.item3':
        'a factory seleciona uma data por vez; intervalo não faz parte da API dela',
      'functional.item7':
        'a legenda da factory é sempre texto: não há seletor de mês e ano para operar',
    },
    docs: {
      description: {
        story:
          'Seleção de uma única data. O valor inicial marca a célula; cada clique numa célula habilitada troca a marcação e reporta a data escolhida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcado = () =>
      canvasElement.querySelector<HTMLElement>('.nds-calendar-day[aria-pressed="true"]');

    await step('A data inicial chega marcada', async () => {
      await expect(marcado()).toHaveTextContent('12');
    });

    await step('Clicar em outro dia move a marcação e reporta a data', async () => {
      // functional.item2 — a marcação é exclusiva: o dia velho tem que perder o
      // estado, senão a tela mostra duas seleções num modo que só admite uma.
      onSelect.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      const [data] = onSelect.mock.calls[0] as [Date];
      await expect(data.getDate()).toBe(20);
      await expect(marcado()).toHaveTextContent('20');
      await expect(
        canvasElement.querySelectorAll('.nds-calendar-day[aria-pressed="true"]').length,
      ).toBe(1);
    });
  },
};
