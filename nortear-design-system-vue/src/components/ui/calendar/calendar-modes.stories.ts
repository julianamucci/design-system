import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import {
  STATES_WITH_TEXT_LEGIVEL,
  describeContrast,
  calendarMeasureContrast,
} from '@shared/testing/calendar-probe';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';
import {
  calendarIntervaloSource,
  calendarSource,
  calendarVariasDatasSource,
} from './calendar.source';

const meta = {
  title: 'UI/Calendar/Modes',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: calendarSource },
      description: {
        component:
          'Modos de seleção: uma data, várias datas ou um intervalo contínuo. O intervalo é um componente próprio, porque seleciona um par e não uma lista.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Datas fixas para determinismo dos screenshots Chromatic — instanciadas dentro
// de setup() para evitar criar CalendarDate no import do módulo.

/** Datas marcadas, na ordem em que aparecem no grid. */
function marcadas(canvasElement: HTMLElement): string[] {
  return Array.from(canvasElement.querySelectorAll('[data-selected]')).map(
    (el) => el.getAttribute('data-value') ?? '',
  );
}

export const Single: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref(new CalendarDate(2026, 4, 12));
      return { selected, placeholder };
    },
    template: `
      <Calendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['functional.item2', 'accessibility.item1', 'accessibility.item3', 'visual.item2'],
    docs: {
      description: {
        story: 'Uma data por vez: escolher outra troca a marcação em vez de somar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O grid e as células têm papel de tabela de datas', async () => {
      // accessibility.item1 — `gridcell` só existe dentro de um `grid`; sem o
      // papel na tabela o leitor de tela não oferece navegação bidimensional.
      await expect(canvas.getByRole('grid')).toBeInTheDocument();
      await expect(canvas.getAllByRole('gridcell').length).toBeGreaterThan(27);
    });

    await step('A data inicial chega marcada, e só ela', async () => {
      // accessibility.item3
      await expect(marcadas(canvasElement)).toEqual(['2026-04-12']);
    });

    await step('Escolher outra data substitui a marcação', async () => {
      // functional.item2 — o modo único quebra justamente aqui: se a marcação
      // antiga sobrevivesse, a tela mostraria duas datas escolhidas.
      await userEvent.click(canvas.getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(marcadas(canvasElement)).toEqual(['2026-04-20']);
    });
  },
};

export const Multiple: Story = {
  render: () => ({
    components: { Calendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref([
        new CalendarDate(2026, 4, 8),
        new CalendarDate(2026, 4, 15),
        new CalendarDate(2026, 4, 22),
      ]);
      return { selected, placeholder };
    },
    template: `
      <Calendar
        v-model="selected"
        multiple
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    // O modelo deixa de ser uma data e vira LISTA — a do meta mostraria o
    // estado errado ao lado da prop certa.
    docs: {
      source: { transform: calendarVariasDatasSource },
      description: {
        story: 'Várias datas avulsas: cada escolha soma à lista, e escolher de novo remove.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As três datas iniciais chegam marcadas', async () => {
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-15', '2026-04-22']);
    });

    await step('Uma nova escolha soma em vez de substituir', async () => {
      // É esta a diferença para o modo único, e nenhuma asserção a cobria.
      // Cada passo estabelece a própria precondição: o clique final devolve o
      // grid ao estado inicial, para o replay no painel medir o mesmo.
      await userEvent.click(canvas.getByRole('button', { name: /29 de abril de 2026/i }));
      await expect(marcadas(canvasElement)).toEqual([
        '2026-04-08',
        '2026-04-15',
        '2026-04-22',
        '2026-04-29',
      ]);
      await userEvent.click(canvas.getByRole('button', { name: /29 de abril de 2026/i }));
      await expect(marcadas(canvasElement)).toEqual(['2026-04-08', '2026-04-15', '2026-04-22']);
    });
  },
};

export const Range: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const placeholder = new CalendarDate(2026, 4, 15);
      const selected = ref({
        start: new CalendarDate(2026, 4, 10),
        end: new CalendarDate(2026, 4, 18),
      });
      return { selected, placeholder };
    },
    template: `
      <RangeCalendar
        v-model="selected"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['functional.item3'],
    // É outro componente, com outro import e um modelo de par: a do meta
    // mostraria o calendário de data única.
    docs: {
      source: { transform: calendarIntervaloSource },
      description: {
        story: 'Intervalo contínuo: os extremos e todos os dias entre eles ficam marcados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O intervalo marca extremos e miolo, sem buracos', async () => {
      // functional.item3 — a story existe para mostrar o miolo. Verificar só os
      // extremos passaria com o intervalo inteiro vazio no meio.
      const days = marcadas(canvasElement);
      await expect(days[0]).toBe('2026-04-10');
      await expect(days[days.length - 1]).toBe('2026-04-18');
      await expect(days.length).toBe(9);
    });

    await step('A ponta pesa e o miolo é faixa', async () => {
      // A lib marca `data-selected` em TODOS os dias do intervalo, ponta e
      // miolo, e a regra de seleção pintava os dois com o mesmo primary: o
      // período virava um bloco escuro só, sem começo nem fim visíveis. A
      // asserção anterior contava dias marcados e passava exatamente assim.
      // A referência é o Vanilla, onde a ponta tem peso e o miolo é faixa.
      const dia = (iso: string) =>
        canvasElement.querySelector<HTMLElement>(`.nds-calendar-day-btn[data-value="${iso}"]`)!;
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
      // sexto do produto. Medido no ESCURO, as pontas marcavam 1.18:1 aqui: o dia
      // compunha `.nds-button-ghost` por fora, a lib marca o dia escolhido com
      // `aria-pressed`, e `.dark .nds-button-ghost[aria-pressed="true"]` vencia o
      // fundo `--primary` por especificidade. O número do dia sumia — no escuro,
      // que o axe não vê.
      const measurements = calendarMeasureContrast(canvasElement).filter(
        (m) => m.presente && (STATES_WITH_TEXT_LEGIVEL as readonly string[]).includes(m.estado),
      );
      await expect(measurements.length).toBeGreaterThan(0);
      const reprovadas = measurements.filter((m) => (m.ratio ?? 0) < 4.5).map(describeContrast);
      await expect(reprovadas).toEqual([]);
    });
  },
};
