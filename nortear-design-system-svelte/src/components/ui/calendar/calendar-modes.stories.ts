import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import {
  STATES_WITH_TEXT_LEGIVEL,
  describeContrast,
  calendarMeasureContrast,
} from '@shared/testing/calendar-probe';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import {
  calendarIntervaloSource,
  calendarMultiploSource,
  calendarSource,
} from './calendar.source';

const meta: Meta = {
  title: 'UI/Calendar/Modes',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; as que mudam de modo
      // sobrescrevem com a sua logo abaixo.
      source: { transform: calendarSource },
      description: {
        component:
          'Modos de seleção: uma data por vez, várias datas avulsas, ou um intervalo contínuo.',
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
      source: { transform: calendarMultiploSource },
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

export const Range: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'range', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      source: { transform: calendarIntervaloSource },
      description: {
        story:
          'Intervalo contínuo: a primeira escolha abre o período, a segunda o fecha, e os dias entre as duas ficam marcados junto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const dia = (iso: string) =>
      canvasElement.querySelector<HTMLElement>(`.nds-calendar-day-btn[data-value="${iso}"]`)!;

    await step('O intervalo inicial vai de ponta a ponta', async () => {
      await expect(dia('2026-04-10')).toHaveAttribute('data-selection-start');
      await expect(dia('2026-04-18')).toHaveAttribute('data-selection-end');
      // O miolo é o que separa intervalo de "duas datas avulsas": sem ele, o
      // modo múltiplo passaria por aqui.
      await expect(marcadas(canvasElement)).toEqual([
        '2026-04-10',
        '2026-04-11',
        '2026-04-12',
        '2026-04-13',
        '2026-04-14',
        '2026-04-15',
        '2026-04-16',
        '2026-04-17',
        '2026-04-18',
      ]);
    });

    await step('A ponta pesa e o miolo é faixa', async () => {
      // A referência é o Vanilla. A lib marca `data-selected` em TODOS os dias
      // do intervalo, então sem regra própria o miolo saía com o mesmo primary
      // da ponta e o período virava um bloco escuro só — foi o que aconteceu.
      const ponta = getComputedStyle(dia('2026-04-10'));
      const miolo = getComputedStyle(dia('2026-04-14'));
      await expect(miolo.backgroundColor).not.toBe(ponta.backgroundColor);
      await expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(miolo.backgroundColor);

      // Reto por dentro, redondo por fora: é o que fecha a faixa nas pontas.
      await expect(parseFloat(ponta.borderTopLeftRadius)).toBeGreaterThan(0);
      await expect(parseFloat(ponta.borderTopRightRadius)).toBe(0);
      const end = getComputedStyle(dia('2026-04-18'));
      await expect(parseFloat(end.borderTopRightRadius)).toBeGreaterThan(0);
      await expect(parseFloat(end.borderTopLeftRadius)).toBe(0);
      await expect(parseFloat(miolo.borderTopLeftRadius)).toBe(0);
    });

    await step('As pontas do intervalo passam em contraste nos três temas e nos dois modos', async () => {
      // accessibility.item6 — o item prometia 4.5:1 e a verificação declarada era
      // "axe-core / Lighthouse", que só enxerga o tema claro da marca default: um
      // sexto do produto. Medido no escuro, as pontas do intervalo de uma stack
      // marcavam 1.18:1 e o número do dia sumia. Aritmética, não olhômetro.
      const measurements = calendarMeasureContrast(canvasElement).filter(
        (m) => m.presente && (STATES_WITH_TEXT_LEGIVEL as readonly string[]).includes(m.estado),
      );
      await expect(measurements.length).toBeGreaterThan(0);
      const reprovadas = measurements.filter((m) => (m.ratio ?? 0) < 4.5).map(describeContrast);
      await expect(reprovadas).toEqual([]);
    });

    await step('Escolher duas datas redesenha o período', async () => {
      // Cada passo estabelece a própria precondição: o par de cliques leva a um
      // intervalo novo a partir de qualquer estado, então o replay no painel
      // mede o mesmo que a primeira rodada.
      await userEvent.click(canvas.getByRole('button', { name: /22 de abril de 2026/i }));
      await userEvent.click(canvas.getByRole('button', { name: /25 de abril de 2026/i }));
      await expect(marcadas(canvasElement)).toEqual([
        '2026-04-22',
        '2026-04-23',
        '2026-04-24',
        '2026-04-25',
      ]);
    });
  },
};
