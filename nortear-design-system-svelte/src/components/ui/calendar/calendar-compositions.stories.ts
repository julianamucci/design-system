import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { fn, userEvent, waitFor, within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarDatePickerStory from './CalendarDatePickerStory.svelte';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { calendarEmPopoverSource, calendarSource } from './calendar.source';

const meta: Meta = {
  title: 'Primitives/Form/Calendar/Compositions',
  component: Calendar,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição sobrescreve
      // com a sua logo abaixo.
      source: { transform: calendarSource },
      description: {
        component:
          'A composição canônica do calendário: ele quase nunca aparece solto na página. Mora dentro de um popover, atrás de um botão que mostra a data escolhida.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

export const DatePicker: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: calendarEmPopoverSource },
      description: {
        story:
          'O botão carrega a data escolhida; escolher uma nova atualiza o rótulo e fecha o popover.',
      },
    },
  },
  render: () => ({ Component: CalendarDatePickerStory, props: { onSelect } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button');

    const open = async () => {
      if (trigger().getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger());
      return waitForPortal('dialog');
    };
    const close = async () => {
      if (trigger().getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger()).not.toHaveAttribute('aria-expanded', 'true'));
    };

    await step('O botão abre o calendário', async () => {
      // Cada passo estabelece a própria precondição: o par fechar/abrir garante
      // um clique real nesta rodada, inclusive no replay do painel.
      await close();
      const panel = await open();
      await expect(within(panel).getByRole('grid')).toBeInTheDocument();
    });

    await step('Escolher um dia atualiza o botão e fecha o popover', async () => {
      // É o contrato inteiro da composição: sem a atualização do rótulo, a
      // pessoa fecha o popover e não sabe o que escolheu.
      await close();
      const panel = await open();
      onSelect.mockClear();
      await userEvent.click(within(panel).getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(trigger()).toHaveTextContent('20 de abril de 2026'));
      await waitForPortalGone('dialog');
    });
  },
};
