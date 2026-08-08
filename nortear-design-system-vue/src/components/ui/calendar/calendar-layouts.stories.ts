import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { ref } from 'vue';
import { CalendarDate } from '@internationalized/date';
import { Calendar } from './index';

const meta = {
  title: 'UI/Calendar/Layouts',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Formato da legenda do mês e quantidade de meses visíveis ao mesmo tempo.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Datas fixas para determinismo Chromatic — instanciadas dentro de setup()
// para evitar criar CalendarDate no import do módulo.

const legenda = (el: HTMLElement) => el.querySelector('[data-slot="calendar-heading"]');

/** Um mês fixo, para todas as stories partirem do mesmo lugar. */
const abril2026 = () => ({
  setup() {
    const placeholder = new CalendarDate(2026, 4, 15);
    const selected = ref(new CalendarDate(2026, 4, 12));
    return { selected, placeholder };
  },
});

// Legenda em texto (padrão).
export const CaptionLabel: Story = {
  render: () => ({
    components: { Calendar },
    ...abril2026(),
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
    covers: ['functional.item6', 'visual.item3'],
    docs: { description: { story: 'Legenda em texto com mês e ano no idioma configurado.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('A legenda traz mês e ano no idioma pedido', async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      await expect(legenda(canvasElement)).toHaveTextContent(/abril de 2026/i);
      const dias = Array.from(
        canvasElement.querySelectorAll('[data-slot="calendar-head-cell"]'),
      ).map((el) => el.textContent?.trim().toLowerCase() ?? '');
      // A forma curta, e a mesma nas quatro: 'narrow' dá "D S T Q Q S S", com
      // duas quartas e duas quintas indistinguíveis, e o ponto de "dom." é
      // ruído numa coluna de uma palavra. Conferir só a inicial aceitava tudo.
      await expect(dias).toEqual(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
    });

    await step('A legenda é texto, e não controle', async () => {
      // É o que separa esta story da seguinte: aqui não há nada para operar.
      await expect(within(canvasElement).queryAllByRole('combobox').length).toBe(0);
    });
  },
};

// Legenda com seletores de mês e ano.
export const CaptionDropdown: Story = {
  render: () => ({
    components: { Calendar },
    ...abril2026(),
    template: `
      <Calendar
        v-model="selected"
        layout="month-and-year"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story: 'Mês e ano viram seletores, para saltar de período sem passar mês a mês.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Mês e ano viram controles operáveis', async () => {
      // functional.item7 — a story existe pelo salto de período: verificar que
      // o calendário renderizou não a distingue da legenda de texto.
      await expect(canvas.getByRole('combobox', { name: 'Selecionar mês' })).toBeInTheDocument();
      await expect(canvas.getByRole('combobox', { name: 'Selecionar ano' })).toBeInTheDocument();
    });

    await step('Trocar o mês no seletor leva o grid junto', async () => {
      // Cada passo estabelece a própria precondição: volta para abril no fim,
      // porque o painel reexecuta a play no mesmo DOM.
      const mes = canvas.getByRole('combobox', { name: 'Selecionar mês' });
      await userEvent.selectOptions(mes, '6');
      await expect(canvasElement.querySelector('[data-value^="2026-06-"]')).not.toBeNull();
      await userEvent.selectOptions(mes, '4');
      await expect(canvasElement.querySelector('[data-value^="2026-04-"]')).not.toBeNull();
    });

    await step('Trocar o ano no seletor leva o grid junto', async () => {
      const seletorDeAno = () => canvas.getByRole('combobox', { name: 'Selecionar ano' });
      await userEvent.selectOptions(seletorDeAno(), '2028');
      await expect(canvasElement.querySelector('[data-value^="2028-04-"]')).not.toBeNull();
      await userEvent.selectOptions(seletorDeAno(), '2026');
      await expect(canvasElement.querySelector('[data-value^="2026-04-"]')).not.toBeNull();
    });
  },
};

// Dois meses lado a lado.
export const TwoMonths: Story = {
  render: () => ({
    components: { Calendar },
    ...abril2026(),
    template: `
      <Calendar
        v-model="selected"
        :number-of-months="2"
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dois meses lado a lado, para escolher datas que atravessam a virada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('São dois grids, de meses consecutivos', async () => {
      // Contar células passaria com um único mês de sessenta dias; o que a
      // story mostra é a virada, então a asserção é sobre QUAIS meses aparecem.
      await expect(canvasElement.querySelectorAll('[data-slot="calendar-grid"]').length).toBe(2);
      await expect(canvasElement.querySelector('[data-value="2026-04-30"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-value="2026-05-01"]')).not.toBeNull();
    });
  },
};

// Seis linhas de semana sempre.
export const WithFixedWeeks: Story = {
  render: () => ({
    components: { Calendar },
    ...abril2026(),
    template: `
      <Calendar
        v-model="selected"
        fixed-weeks
        locale="pt-BR"
        :placeholder="placeholder"
        class=""
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Seis linhas de semana sempre: a altura do bloco não muda ao virar o mês, então nada abaixo dele salta.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O mês é desenhado em seis linhas, qualquer que seja o tamanho dele', async () => {
      // Abril de 2026 cabe em cinco linhas — são seis por causa do recurso.
      // Sem esta contagem, a story não se distinguiria do layout padrão.
      const linhas = canvasElement.querySelectorAll('[data-slot="calendar-grid-body"] tr');
      await expect(linhas.length).toBe(6);
    });
  },
};
