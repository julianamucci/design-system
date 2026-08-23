import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCalendar } from './calendar';
import { calendarSource, calendarSourceWith } from './calendar.source';
import { fn, userEvent, within, expect } from 'storybook/test';
import {
  STATES_WITH_TEXT_LEGIVEL,
  describeContrast,
  calendarMeasureContrast,
} from '@shared/testing/calendar-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Modo de seleção do Calendar: uma data, várias avulsas ou um intervalo. O
// `value` define o estado inicial e `onSelect` reporta cada escolha.

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Calendar/Modes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: calendarSource },
      description: {
        component: 'Modo de seleção: uma data, várias datas avulsas ou um intervalo contínuo.',
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
    }),
  parameters: {
    covers: ['functional.item2', 'accessibility.item3', 'visual.item2'],
    docs: {
      // Override de story: o callback que reporta a escolha é metade do assunto
      // aqui, e o Calendar não tem control nenhum.
      source: { transform: calendarSourceWith({ onSelect: '(data) => registrarEscolha(data)' }) },
      description: {
        story:
          'Seleção de uma única data. O valor inicial marca a célula; cada clique numa célula habilitada troca a marcação e reporta a data escolhida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checked = () =>
      canvasElement.querySelector<HTMLElement>('.nds-calendar-day-btn[aria-pressed="true"]');

    await step('A data inicial chega marcada', async () => {
      await expect(checked()).toHaveTextContent('12');
    });

    await step('Clicar em outro dia move a marcação e reporta a data', async () => {
      // functional.item2 — a marcação é exclusiva: o dia velho tem que perder o
      // estado, senão a tela mostra duas seleções num modo que só admite uma.
      onSelect.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      const [data] = onSelect.mock.calls[0] as [Date];
      await expect(data.getDate()).toBe(20);
      await expect(checked()).toHaveTextContent('20');
      await expect(
        canvasElement.querySelectorAll('.nds-calendar-day-btn[aria-pressed="true"]').length,
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
    }),
  parameters: {
    covers: ['functional.item3'],
    docs: {
      // Override de story: o modo e a FORMA do valor mudam juntos — no
      // intervalo ele é um par de datas, não uma data.
      source: {
        transform: calendarSourceWith({
          mode: 'range',
          value: '{ from: new Date(2026, 3, 10), to: new Date(2026, 3, 18) }',
          onSelect: '(intervalo) => registrarEscolha(intervalo)',
        }),
      },
      description: {
        story:
          'Intervalo contínuo: os extremos e todos os dias entre eles ficam marcados. O próximo clique recomeça um intervalo novo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcados = () =>
      Array.from(canvasElement.querySelectorAll('.nds-calendar-day-btn[data-selected]')).map(
        (el) => (el as HTMLElement).dataset.day ?? '',
      );
    const dia = (n: number) =>
      canvas.getByRole('button', { name: new RegExp(`${n} de abril de 2026`, 'i') });

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
        canvasElement.querySelector<HTMLElement>(`.nds-calendar-day-btn[data-day="${iso}"]`)!;
      // Atributos de presença, como as libs das outras stacks emitem: o miolo
      // não tem marcador próprio, é o dia marcado que não é nenhuma das pontas.
      // Medir a COR, e não só o atributo, é o que garante que a distinção
      // chegou à tela — foi assim que o intervalo do Vue passou meses saindo
      // como um bloco escuro só com o teste verde.
      await expect(dia('2026-04-10')).toHaveAttribute('data-selection-start');
      await expect(dia('2026-04-18')).toHaveAttribute('data-selection-end');

      const miolo = dia('2026-04-14');
      await expect(miolo).toHaveAttribute('data-selected');
      await expect(miolo.hasAttribute('data-selection-start')).toBe(false);
      await expect(miolo.hasAttribute('data-selection-end')).toBe(false);
      await expect(getComputedStyle(miolo).backgroundColor).not.toBe(
        getComputedStyle(dia('2026-04-10')).backgroundColor,
      );
    });

    await step('Abrir, fechar e recomeçar o intervalo', async () => {
      // Um intervalo fechado não cresce com o próximo clique: ele reabre. Sem
      // este passo, um componente que só ACRESCENTASSE dias passaria.
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

    await step('Intervalo sem valor inicial não marca nada', async () => {
      // É o estado de partida de qualquer seletor de período: antes do primeiro
      // clique não há intervalo, e nenhuma célula pode aparecer marcada.
      const vazio = createCalendar({ mode: 'range', locale: 'pt-BR' });
      await expect(vazio.querySelectorAll('.nds-calendar-day-btn[data-selected]').length).toBe(0);
      await expect(vazio.querySelectorAll('.nds-calendar-day-btn[data-range]').length).toBe(0);
    });

    await step('Escolher o fim antes do início dá no mesmo intervalo', async () => {
      // Quem clica 18 e depois 10 quis o mesmo intervalo de quem clicou na
      // ordem: o componente troca as pontas em vez de devolver algo vazio ou
      // invertido. Cada passo estabelece a própria precondição — os cliques
      // finais devolvem o intervalo de partida, para o replay medir o mesmo.
      await userEvent.click(dia(18));
      await expect(marcados()).toEqual(['2026-04-18']);
      await userEvent.click(dia(10));
      await expect(marcados().length).toBe(9);
      const days = marcados();
      await expect(days[0]).toBe('2026-04-10');
      await expect(days[days.length - 1]).toBe('2026-04-18');
    });

    await step('As pontas do intervalo passam em contraste nos três temas e nos dois modos', async () => {
      // accessibility.item6 — o item prometia 4.5:1 e a verificação declarada era
      // "axe-core / Lighthouse", que só enxerga o tema claro da marca default: um
      // sexto do produto. Medido no escuro, as pontas do intervalo de uma stack
      // marcavam 1.18:1 e o número do dia sumia. Aritmética, não olhômetro.
      const measurements = calendarMeasureContrast(canvasElement).filter(
        (m) => m.presente && (STATES_WITH_TEXT_LEGIVEL as readonly string[]).includes(m.state),
      );
      await expect(measurements.length).toBeGreaterThan(0);
      const reprovadas = measurements.filter((m) => (m.ratio ?? 0) < 4.5).map(describeContrast);
      await expect(reprovadas).toEqual([]);
    });
  },
};

export const Multiple: Story = {
  render: () =>
    createCalendar({
      mode: 'multiple',
      locale: 'pt-BR',
      value: [new Date(2026, 3, 8), new Date(2026, 3, 12), new Date(2026, 3, 16)],
      onSelect,
    }),
  parameters: {
    docs: {
      // Override de story: no modo múltiplo o valor é uma LISTA de datas.
      source: {
        transform: calendarSourceWith({
          mode: 'multiple',
          value: '[new Date(2026, 3, 8), new Date(2026, 3, 12), new Date(2026, 3, 16)]',
          onSelect: '(datas) => registrarEscolha(datas)',
        }),
      },
      description: {
        story: 'Várias datas avulsas: cada escolha soma à lista, e escolher de novo remove.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checked = () =>
      Array.from(canvasElement.querySelectorAll('.nds-calendar-day-btn[data-selected]')).map(
        (el) => (el as HTMLElement).dataset.day ?? '',
      );

    await step('As três datas iniciais chegam marcadas', async () => {
      await expect(checked()).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
    });

    await step('Uma nova escolha soma, e repetir remove', async () => {
      // É esta a diferença para o modo único, e é a única asserção que a pega.
      // Cada passo estabelece a própria precondição: o segundo clique devolve o
      // grid ao estado inicial, para o replay no painel medir o mesmo.
      const dia29 = () => canvas.getByRole('button', { name: /29 de abril de 2026/i });
      onSelect.mockClear();
      await userEvent.click(dia29());
      await expect(checked()).toEqual([
        '2026-04-08', '2026-04-12', '2026-04-16', '2026-04-29',
      ]);
      await expect(onSelect).toHaveBeenLastCalledWith([
        new Date(2026, 3, 8), new Date(2026, 3, 12), new Date(2026, 3, 16), new Date(2026, 3, 29),
      ]);

      await userEvent.click(dia29());
      await expect(checked()).toEqual(['2026-04-08', '2026-04-12', '2026-04-16']);
    });
  },
};
