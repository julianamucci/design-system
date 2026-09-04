import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, waitFor, within, expect } from 'storybook/test';
import { createCalendar } from './calendar';
import { calendarWithPopoverSourceWith, calendarSource } from './calendar.source';
import { createPopover } from './popover';
import { createButton } from './button';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A composição canônica do calendário: ele quase nunca aparece solto na página.
// Mora dentro de um popover, atrás de um botão que mostra a data escolhida.

const meta: Meta = {
  tags: ['form'],
  title: 'Components/Form/Calendar/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          'Seletor de data: um botão mostra a data escolhida e abre o calendário num popover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

const formatador = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export const DatePicker: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // Override de story: a forma do snippet é outra — são três fábricas, e o
      // que se ensina é a ligação entre elas, não o calendário sozinho.
      source: { transform: calendarWithPopoverSourceWith() },
      description: {
        story:
          'O botão carrega a data escolhida; escolher uma nova atualiza o rótulo e fecha o popover.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Escolher data' });

    const calendar = createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      onSelect: (value) => {
        if (!(value instanceof Date)) return;
        trigger.textContent = formatador.format(value);
        onSelect(value);
        // Escolhida a data, o popover não tem mais o que oferecer: mantê-lo
        // aberto obrigaria a fechá-lo à mão para ver o resultado.
        trigger.click();
      },
    });

    return createPopover({ trigger: trigger, content: calendar });
  },
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
