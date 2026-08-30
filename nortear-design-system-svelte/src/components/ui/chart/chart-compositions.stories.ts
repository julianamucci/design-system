import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';
import ChartCardStory from './ChartCardStory.svelte';
import { designEscreve, designPintado, exigirRoot } from '@shared/testing/chart-probe';
import { drawingOf, drawingSettled, filledShapes } from './chart.fixtures';
import { chartEmCardSource, chartSource, designChartTitleSource } from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const SERIE_UNICA = [{ name: 'Vendas', data: [186, 305, 237, 73] }];

const CARD_TITLE = 'Acessos mensais';
const DESIGN_TITLE = 'Vendas mensais';

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
  title: 'Primitives/Display/Chart/Compositions',
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
      option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
      title: CARD_TITLE,
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
        .toBe(CARD_TITLE);
    });

    await step('E o gráfico está DENTRO do card, não ao lado', async () => {
      const inside = canvasElement.querySelector<HTMLElement>('[data-slot="card"] [data-slot="chart"]');
      await expect(inside).not.toBeNull();
      await waitFor(() => expect(designPintado(inside!)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(inside!);
      // Uma coluna POR CATEGORIA, dentro do card: o desenho não perde nem ganha
      // dado por estar embrulhado. Igualdade, não "alguma forma pintada" — este
      // passo era o que sobrava de portão sobre o conteúdo do desenho aqui.
      await waitFor(
        () => expect(filledShapes(inside!)).toHaveLength(MONTHS.length),
        { timeout: 3000 },
      );
    });
  },
};

export const InlineTitle: Story = {
  parameters: {
    docs: {
      source: { transform: designChartTitleSource },
      description: { story: 'Título no próprio desenho: para quando o gráfico é servido sozinho, sem card em volta.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA, title: DESIGN_TITLE }),
    height: 260,
    class: 'nds-w-full',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O título do objeto de configuração é escrito dentro do desenho', async () => {
      await waitFor(
        () => expect(designEscreve(root, DESIGN_TITLE)).toBe(true),
        { timeout: 3000 },
      );
    });

    await step('Sem rótulo autoral, o container ainda se anuncia como imagem', async () => {
      // O padrão é uma palavra genérica de propósito: ela mantém o papel de
      // imagem coerente, e não finge descrever o gráfico. Quem descreve é o
      // `aria-label` autoral — todas as outras stories passam um.
      const design = drawingOf(root);
      await expect(design).toHaveAttribute('role', 'img');
      await expect(design.getAttribute('aria-label')).toBe('Gráfico');
      // E a legenda da tabela repete o mesmo texto, para não haver duas
      // descrições do mesmo gráfico.
      await expect(root.querySelector('caption')?.textContent?.trim()).toBe('Gráfico');
    });
  },
};
