import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';
import { RangeCalendar } from '@/components/ui/range-calendar';

const meta = {
  title: 'UI/Calendar/Modos',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
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
    docs: {
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
    docs: {
      description: {
        story: 'Intervalo contínuo: os extremos e todos os dias entre eles ficam marcados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O intervalo marca extremos e miolo, sem buracos', async () => {
      // functional.item3 — a story existe para mostrar o miolo. Verificar só os
      // extremos passaria com o intervalo inteiro vazio no meio.
      const dias = marcadas(canvasElement);
      await expect(dias[0]).toBe('2026-04-10');
      await expect(dias[dias.length - 1]).toBe('2026-04-18');
      await expect(dias.length).toBe(9);
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
      const fim = getComputedStyle(dia('2026-04-18'));
      await expect(parseFloat(fim.borderTopRightRadius)).toBeGreaterThan(0);
      await expect(parseFloat(fim.borderTopLeftRadius)).toBe(0);
      await expect(parseFloat(miolo.borderTopLeftRadius)).toBe(0);
    });
  },
};
