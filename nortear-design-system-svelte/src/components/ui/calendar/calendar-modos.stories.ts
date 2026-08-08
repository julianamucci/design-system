import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';

const meta: Meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component: 'Modos de seleção: uma data por vez, ou várias datas avulsas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// O `data-value` aparece na célula E no botão dentro dela: sem escopar pela
// classe do botão, cada dia entra duas vezes na conta.
const marcadas = (el: HTMLElement): string[] =>
  Array.from(el.querySelectorAll('.nds-calendar-day-btn[data-value][data-selected]')).map(
    (n) => n.getAttribute('data-value') ?? '',
  );

export const Single: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'single', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    coversNotApplicable: {
      'functional.item3':
        'a lib desta stack não expõe seleção de intervalo; o par de datas seria estado do consumidor, não do componente',
    },
    docs: {
      description: { story: 'Uma data por vez: escolher outra troca a marcação em vez de somar.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A data inicial chega marcada, e só ela', async () => {
      await expect(marcadas(canvasElement)).toEqual(['2026-04-12']);
    });

    await step('Escolher outra data substitui a marcação', async () => {
      // functional.item2 — o modo único quebra justamente aqui: se a marcação
      // antiga sobrevivesse, a tela mostraria duas datas escolhidas.
      await userEvent.click(canvas.getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(marcadas(canvasElement)).toEqual(['2026-04-20']);
      // O dia de partida perdeu a marcação de fato — sem isto, um componente que
      // só ACRESCENTA marcação passaria neste modo.
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-04-12"][data-selected]'),
      ).toBeNull();
    });
  },
};

export const Multiple: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'multiple', locale: 'pt-BR' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Várias datas avulsas: cada escolha soma à lista, e escolher de novo remove.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As três datas iniciais chegam marcadas', async () => {
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
    });

    await step('Uma nova escolha soma, e repetir remove', async () => {
      // É esta a diferença para o modo único, e nenhuma asserção a cobria.
      // Cada passo estabelece a própria precondição: o segundo clique devolve o
      // grid ao estado inicial, para o replay no painel medir o mesmo.
      const dia29 = canvas.getByRole('button', { name: /29 de abril de 2026/i });
      await userEvent.click(dia29);
      await expect(marcadas(canvasElement)).toEqual([
        '2026-04-08',
        '2026-04-12',
        '2026-04-16',
        '2026-04-29',
      ]);
      await userEvent.click(dia29);
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
    });
  },
};
