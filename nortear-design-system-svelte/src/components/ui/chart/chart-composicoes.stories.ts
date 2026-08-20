import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';
import ChartCardStory from './ChartCardStory.svelte';
import { desenhoEscreve, desenhoPintado, exigirRaiz } from '@shared/testing/chart-probe';
import { chartEmCardSource, chartSource, chartTituloNoDesenhoSource } from './chart.source';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr'];
const SERIE_UNICA = [{ name: 'Vendas', data: [186, 305, 237, 73] }];

const TITULO_DO_CARD = 'Acessos mensais';
const TITULO_NO_DESENHO = 'Vendas mensais';

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada composição sobrescreve
      // com a própria marcação logo abaixo.
      source: { transform: chartSource },
    },
  },
  title: 'UI/Chart/Compositions',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const WithCard: Story = {
  parameters: {
    docs: {
      source: { transform: chartEmCardSource },
      description: { story: 'Dentro de um Card: o título e o apoio ficam no cabeçalho do card, e o desenho no corpo.' },
    },
  },
  render: () => ({
    Component: ChartCardStory,
    props: {
      option: buildBarOption({ xAxis: MESES, series: SERIE_UNICA }),
      title: TITULO_DO_CARD,
      description: 'Janeiro a abril, acessos no desktop.',
      label: 'Gráfico de barras: acessos mensais no desktop, de janeiro a abril',
      height: 200,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('O cabeçalho do card carrega o título — o desenho não precisa repeti-lo', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).not.toBeNull();
      await expect(card!.querySelector('[data-slot="card-title"]')?.textContent?.trim())
        .toBe(TITULO_DO_CARD);
    });

    await step('E o gráfico está DENTRO do card, não ao lado', async () => {
      const dentro = canvasElement.querySelector<HTMLElement>('[data-slot="card"] [data-slot="chart"]');
      await expect(dentro).not.toBeNull();
      await waitFor(() => expect(desenhoPintado(dentro!)).toBe(true), { timeout: 3000 });
    });
  },
};

export const InlineTitle: Story = {
  parameters: {
    docs: {
      source: { transform: chartTituloNoDesenhoSource },
      description: { story: 'Título no próprio desenho: para quando o gráfico é servido sozinho, sem card em volta.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MESES, series: SERIE_UNICA, title: TITULO_NO_DESENHO }),
    height: 260,
    class: 'nds-w-full',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);

    await step('O título do objeto de configuração é escrito dentro do desenho', async () => {
      await waitFor(
        () => expect(desenhoEscreve(raiz, TITULO_NO_DESENHO)).toBe(true),
        { timeout: 3000 },
      );
    });

    await step('Sem rótulo autoral, o container ainda se anuncia como imagem', async () => {
      // O padrão é uma palavra genérica de propósito: ela mantém o papel de
      // imagem coerente, e não finge descrever o gráfico. Quem descreve é o
      // `aria-label` autoral — todas as outras stories passam um.
      await expect(raiz).toHaveAttribute('role', 'img');
      await expect(raiz.getAttribute('aria-label')).toBe('Gráfico');
    });
  },
};
