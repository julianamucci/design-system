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

export const Range: Story = {
  render: () =>
    createCalendar({
      mode: 'range',
      locale: 'pt-BR',
      value: { from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) },
      onSelect,
      class: 'nds-rounded-md nds-border-default',
    }),
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Intervalo contínuo: os extremos e todos os dias entre eles ficam marcados. O próximo clique recomeça um intervalo novo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcados = () =>
      Array.from(canvasElement.querySelectorAll('.nds-calendar-day[data-selected="true"]')).map(
        (el) => (el as HTMLElement).dataset.day ?? '',
      );

    await step('O intervalo é contínuo do início ao fim', async () => {
      // functional.item3 — verificar só os extremos passaria com o meio vazio,
      // que é exatamente o que esta story existe para mostrar.
      await expect(marcados()).toEqual([
        '2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13', '2026-04-14',
        '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18',
      ]);
    });

    await step('Os extremos são distinguíveis do miolo', async () => {
      // Sem essa distinção o intervalo vira um bloco só, e a pessoa não vê onde
      // ele começa nem onde termina.
      const dia = (iso: string) =>
        canvasElement.querySelector<HTMLElement>(`.nds-calendar-day[data-day="${iso}"]`)!;
      await expect(dia('2026-04-10').dataset.range).toBe('start');
      await expect(dia('2026-04-14').dataset.range).toBe('middle');
      await expect(dia('2026-04-18').dataset.range).toBe('end');
    });

    await step('Abrir, fechar e recomeçar o intervalo', async () => {
      // Um intervalo fechado não cresce com o próximo clique: ele reabre. Sem
      // este passo, um componente que só ACRESCENTASSE dias passaria.
      const dia = (n: number) =>
        canvas.getByRole('button', { name: new RegExp(`${n} de abril de 2026`, 'i') });
      onSelect.mockClear();

      // Com o intervalo fechado, o clique reabre num dia só.
      await userEvent.click(dia(22));
      await expect(marcados()).toEqual(['2026-04-22']);
      await expect(onSelect).toHaveBeenLastCalledWith({ from: new Date(2026, 3, 22) });

      // O segundo clique fecha, e é ele que cria o miolo.
      await userEvent.click(dia(26));
      await expect(marcados()).toEqual([
        '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26',
      ]);

      // Cada passo estabelece a própria precondição: os dois cliques finais
      // devolvem o intervalo de partida, para o replay no painel medir o mesmo.
      await userEvent.click(dia(10));
      await expect(marcados()).toEqual(['2026-04-10']);
      await userEvent.click(dia(18));
      await expect(marcados().length).toBe(9);
    });
  },
};
