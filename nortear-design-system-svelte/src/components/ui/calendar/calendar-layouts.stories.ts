import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Calendar } from './index';
import CalendarStory from './CalendarStory.svelte';
import {
  calendarDoisMesesSource,
  calendarLegendaSeletoresSource,
  calendarLegendaTextoSource,
  calendarSource,
} from './calendar.source';

const meta: Meta = {
  title: 'UI/Calendar/Layouts',
  component: Calendar,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria chamada logo abaixo.
      source: { transform: calendarSource },
      description: {
        component: 'Formato da legenda do mês e quantidade de meses visíveis ao mesmo tempo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const CaptionLabel: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'captionLabel', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: {
      source: { transform: calendarLegendaTextoSource },
      description: { story: 'Legenda em texto com mês e ano no idioma configurado.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A legenda traz mês e ano no idioma pedido', async () => {
      // functional.item6 — o idioma vale para a legenda E para o cabeçalho da
      // semana; verificar só um dos dois deixaria metade da tradução solta.
      await expect(canvasElement).toHaveTextContent(/abril 2026/i);
      const dias = Array.from(canvasElement.querySelectorAll('.nds-calendar-weekday')).map(
        (el) => el.textContent?.trim().toLowerCase() ?? '',
      );
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

export const CaptionDropdown: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'captionDropdown', locale: 'pt-BR' },
  }),
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: calendarLegendaSeletoresSource },
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
      await expect(canvas.getAllByRole('combobox').length).toBe(2);
    });

    await step('O clique chega aos seletores', async () => {
      // `selectOptions` escolhe a opção por API e passa mesmo com o controle
      // coberto — foi assim que o seletor ficou inerte na tela com a suíte
      // verde. A faixa que posiciona os botões de mês é absoluta e cobre a
      // legenda inteira; `elementFromPoint` devolve QUEM está no topo do ponto,
      // e é a única coisa aqui que enxerga isso.
      const doc = canvasElement.ownerDocument;
      for (const seletor of canvasElement.querySelectorAll<HTMLElement>('.nds-calendar-select')) {
        const r = seletor.getBoundingClientRect();
        const noTopo = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        await expect(seletor === noTopo || seletor.contains(noTopo)).toBe(true);
      }
    });

    await step('A lista de anos corre livre para os dois lados', async () => {
      // Uma janela curta em torno do ano em vista prendia a rolagem: para
      // passar do último ano da lista era preciso escolhê-lo e reabrir o
      // seletor. A lista agora é completa e simétrica — o que limita o que
      // aparece é a altura do painel, onze itens no CSS, com o ano corrente no
      // meio. O teto em si é desenhado pelo navegador e não é alcançável por
      // getComputedStyle daqui; o que dá para medir é a lista.
      const anos = Array.from(
        canvasElement.querySelectorAll<HTMLOptionElement>('.nds-calendar-select:last-of-type option'),
      ).map((o) => Number(o.value));
      await expect(anos.length).toBe(201);
      await expect(Math.max(...anos) - Math.min(...anos)).toBe(200);
      await expect(anos).toContain(2026);
      // Simétrico: a lib abria cem anos para trás e dez para frente, e uma data
      // no ano que vem ficava fora do alcance do seletor.
      await expect(2026 - Math.min(...anos)).toBe(Math.max(...anos) - 2026);
    });

    await step('Trocar o mês no seletor leva o grid junto', async () => {
      // O bloco do mês é recriado a cada troca, então o <select> anterior vira
      // nó destacado: guardar a referência faria o segundo comando agir num
      // elemento fora da tela, sem erro nenhum e sem efeito. Uma busca por vez.
      const seletorDeMes = () => canvas.getAllByRole('combobox')[0];

      await userEvent.selectOptions(seletorDeMes(), '6');
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value^="2026-06-"]'),
      ).not.toBeNull();

      // Cada passo estabelece a própria precondição: volta para abril, porque o
      // painel reexecuta a play no mesmo DOM.
      await userEvent.selectOptions(seletorDeMes(), '4');
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value^="2026-04-"]'),
      ).not.toBeNull();
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value^="2026-06-"]'),
      ).toBeNull();
    });

    await step('Trocar o ano no seletor leva o grid junto', async () => {
      // Este passo existe por um defeito real: o seletor de ano não tinha
      // handler nenhum: abria a lista, aceitava a escolha e não movia o grid.
      const seletorDeAno = () => canvas.getAllByRole('combobox')[1];
      await userEvent.selectOptions(seletorDeAno(), '2028');
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value^="2028-04-"]'),
      ).not.toBeNull();
      await userEvent.selectOptions(seletorDeAno(), '2026');
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value^="2026-04-"]'),
      ).not.toBeNull();
    });

    await step('O controle mostra o que está escolhido', async () => {
      // Lê a opção selecionada do próprio <select>, e não o rótulo desenhado ao
      // lado: onde o navegador permite estilizar o select nativo, o rótulo
      // duplicado é escondido e quem aparece é o controle. Asserção sobre
      // elemento oculto não protege nada.
      const [mes, ano] = canvas.getAllByRole('combobox') as HTMLSelectElement[];
      await expect(mes.selectedOptions[0].textContent?.trim()).toMatch(/abr/i);
      await expect(ano.selectedOptions[0].textContent?.trim()).toBe('2026');
    });
  },
};

export const TwoMonths: Story = {
  render: () => ({
    Component: CalendarStory,
    props: { variant: 'twoMonths', locale: 'pt-BR' },
  }),
  parameters: {
    docs: {
      source: { transform: calendarDoisMesesSource },
      description: {
        story: 'Dois meses lado a lado, para escolher datas que atravessam a virada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('São dois grids, de meses consecutivos', async () => {
      // Contar células passaria com um único mês de sessenta dias; o que a
      // story mostra é a virada, então a asserção é sobre QUAIS meses aparecem.
      await expect(canvasElement.querySelectorAll('[role="grid"]').length).toBe(2);
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-04-30"]'),
      ).not.toBeNull();
      await expect(
        canvasElement.querySelector('.nds-calendar-day-btn[data-value="2026-05-01"]'),
      ).not.toBeNull();
    });
  },
};
