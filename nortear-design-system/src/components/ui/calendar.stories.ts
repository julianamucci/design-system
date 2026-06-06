import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createCalendar } from './calendar';
import { createCalendarDocs } from '@/components/docs/CalendarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Calendar',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createCalendarDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () =>
    createCalendar({ locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      class: 'rounded-md border',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Calendar no modo padrão (seleção única). A factory vanilla do Basecoat expõe `value`, `onSelect`, `disabled` e `class` — sem suporte nativo a mode="multiple"/"range", captionLayout, locale ou classNames por slot.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grid semântico renderizado com role="grid"', async () => {
      const grid = canvas.getByRole('grid');
      await expect(grid).toBeInTheDocument();
    });

    await step('Navegação com aria-label Previous/Next presente', async () => {
      const prev = canvas.getByRole('button', { name: 'Go to previous month' });
      const next = canvas.getByRole('button', { name: 'Go to next month' });
      await expect(prev).toBeInTheDocument();
      await expect(next).toBeInTheDocument();
    });

    await step('Célula selecionada com aria-pressed="true"', async () => {
      const selected = canvasElement.querySelector('.nds-calendar-day[aria-pressed="true"]');
      await expect(selected).not.toBeNull();
      await expect(selected).toHaveTextContent('12');
    });

    await step('Dias da semana expostos como <th scope="col">', async () => {
      const weekdayHeaders = canvasElement.querySelectorAll('th[scope="col"]');
      await expect(weekdayHeaders.length).toBe(7);
    });
  },
};
