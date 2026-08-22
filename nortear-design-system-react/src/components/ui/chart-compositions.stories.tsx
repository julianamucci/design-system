import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { designEscreve } from '@shared/testing/chart-probe';
import { designPronto } from './chart.fixtures';
import { chartEmCardSource, chartSource, chartTitleNoLabelSource } from './chart.source';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const seriesMulti = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
];

const CARD_TITLE = 'Acessos por mês';
const DESIGN_TITLE = 'Vendas mensais';

const meta: Meta = {
  title: 'UI/Chart/Compositions',
  tags: ['display'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
};
export default meta;
type Story = StoryObj;

export const WithCard: Story = {
  parameters: {
    docs: {
      // O Card em volta é a composição inteira desta story, e ele não é arg do
      // gráfico nenhum.
      source: { transform: chartEmCardSource },
      description: {
        story: 'Gráfico dentro de um Card — o cabeçalho carrega título e período, o desenho carrega o dado.',
      },
    },
  },
  render: () => (
    <Card className="nds-max-w-lg">
      <CardHeader>
        <CardTitle>{CARD_TITLE}</CardTitle>
        <CardDescription>Janeiro a junho</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          option={buildBarOption({ xAxis: meses, series: seriesMulti })}
          height={220}
          aria-label="Gráfico de barras: acessos mensais por dispositivo"
        />
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await designPronto(canvasElement);

    await step('O card é o componente do design system, não um card desenhado à mão', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).not.toBeNull();
      await expect(card!.querySelector('[data-slot="card-title"]')?.textContent?.trim()).toBe(
        CARD_TITLE,
      );
    });

    await step('E o gráfico está DENTRO do card, não ao lado dele', async () => {
      const dentro = canvasElement.querySelector('[data-slot="card"] [data-slot="chart"]');
      await expect(dentro).toBe(raiz);
    });

    await step('O desenho traz o dado das duas séries', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(raiz, serie.name)).toBe(true);
    });
  },
};

export const InlineTitle: Story = {
  parameters: {
    docs: {
      // A AUSÊNCIA do rótulo autoral é o assunto: sem ele o container cai no
      // título do desenho, e escrever um aqui esconderia a rede de segurança.
      source: { transform: chartTitleNoLabelSource },
      description: {
        story: 'Título dentro da própria configuração — útil quando o gráfico não tem card em volta.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: seriesMulti, title: DESIGN_TITLE })}
      className="nds-max-w-lg"
      height={280}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await designPronto(canvasElement);

    await step('O título da configuração é escrito acima dos eixos', async () => {
      await expect(designEscreve(raiz, DESIGN_TITLE)).toBe(true);
    });

    await step('Sem rótulo autoral, o título vira a descrição do desenho', async () => {
      // A rede de segurança do container: um gráfico sem `aria-label` não fica
      // mudo, cai no título que já está na tela.
      await expect(raiz).toHaveAttribute('role', 'img');
      await expect(raiz.getAttribute('aria-label')).toBe(DESIGN_TITLE);
    });
  },
};
