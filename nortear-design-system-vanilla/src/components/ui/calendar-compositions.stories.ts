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
  title: 'UI/Calendar/Compositions',
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
    const gatilho = createButton({ variant: 'outline', label: 'Escolher data' });

    const calendario = createCalendar({
      locale: 'pt-BR',
      value: new Date(2026, 3, 12),
      onSelect: (valor) => {
        if (!(valor instanceof Date)) return;
        gatilho.textContent = formatador.format(valor);
        onSelect(valor);
        // Escolhida a data, o popover não tem mais o que oferecer: mantê-lo
        // aberto obrigaria a fechá-lo à mão para ver o resultado.
        gatilho.click();
      },
    });

    return createPopover({ trigger: gatilho, content: calendario });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = () => canvas.getByRole('button');

    const abrir = async () => {
      if (gatilho().getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho());
      return waitForPortal('dialog');
    };
    const fechar = async () => {
      if (gatilho().getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gatilho()).not.toHaveAttribute('aria-expanded', 'true'));
    };

    await step('O botão abre o calendário', async () => {
      // Cada passo estabelece a própria precondição: o par fechar/abrir garante
      // um clique real nesta rodada, inclusive no replay do painel.
      await fechar();
      const painel = await abrir();
      await expect(within(painel).getByRole('grid')).toBeInTheDocument();
    });

    await step('Escolher um dia atualiza o botão e fecha o popover', async () => {
      // É o contrato inteiro da composição: sem a atualização do rótulo, a
      // pessoa fecha o popover e não sabe o que escolheu.
      await fechar();
      const painel = await abrir();
      onSelect.mockClear();
      await userEvent.click(within(painel).getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(gatilho()).toHaveTextContent('20 de abril de 2026'));
      await waitForPortalGone('dialog');
    });
  },
};
