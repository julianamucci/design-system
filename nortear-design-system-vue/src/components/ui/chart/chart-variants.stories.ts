import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  designEscreve,
  designPintado,
  exigirRoot,
  datumFormas,
  designTexts,
} from '@shared/testing/chart-probe';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption,
} from './index';
import {
  chartAreaSource,
  chartBarSource,
  chartLineSource,
  chartPieSource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile',  data: [80, 200, 120, 190, 130, 140] },
];
const DISPOSITIVOS = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile',  value: 420 },
  { label: 'Tablet',  value: 180 },
];

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartBarSource } },
  },
  title: 'UI/Chart/Variants',
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: { description: { story: 'Barras — comparação entre categorias discretas.' } },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com forma de dado, não só eixo', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // `datumFormas` recorta o que é preenchido E contornado: linha de grade e
      // eixo têm `fill: none` e ficam de fora sem precisar saber como a lib
      // nomeia seus grupos.
      await expect(datumFormas(root).length).toBeGreaterThan(0);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      await waitFor(
        () => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    // Outro builder e duas séries em vez de uma — a do meta mostraria barras
    // com série única, que é outra composição.
    docs: {
      source: { transform: chartLineSource },
      description: { story: 'Linhas — tendência contínua ao longo do tempo.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 260,
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Uma linha traçada por série', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // O traçado é o caminho SEM preenchimento e com espessura própria (2px do
      // tema). Eixo, marca e linha de grade também são `fill: none`, mas ficam
      // na espessura 1 — é a espessura que separa dado de moldura aqui.
      const tracados = [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
        const estilo = getComputedStyle(p);
        return estilo.fill === 'none' && parseFloat(estilo.strokeWidth || '0') >= 2;
      });
      await expect(tracados.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
      for (const tracado of tracados) {
        await expect(tracado.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A legenda nomeia cada série e o eixo mantém as categorias', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designTexts(root)).toContain(serie.name);
      }
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

export const Area: Story = {
  parameters: {
    // `buildAreaOption` é o que preenche a região sob a linha; sem ele o
    // snippet ensinaria o gráfico errado.
    docs: {
      source: { transform: chartAreaSource },
      description: { story: 'Área — a linha com a região sob ela preenchida, para dar volume.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildAreaOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 260,
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Cada série ganha uma região preenchida além do traçado', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // A região vem com preenchimento translúcido — é o que a distingue do
      // traçado, que é `fill: none`.
      const areas = [...root.querySelectorAll<SVGPathElement>('svg path[fill-opacity]')].filter(
        (p) => getComputedStyle(p).fill !== 'none',
      );
      await expect(areas.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      await waitFor(
        () => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    // O builder de pizza recebe pontos rotulados, não eixo mais série: a forma
    // do dado muda junto com o gráfico.
    docs: {
      source: { transform: chartPieSource },
      description: { story: 'Pizza (rosca) — participação de cada parte no todo.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildPieOption({ data: DISPOSITIVOS }),
    height: 280,
    'aria-label': 'Distribuição de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('As fatias saem desenhadas', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await expect(datumFormas(root).length).toBeGreaterThan(0);
    });

    await step('Cada fatia é nomeada por escrito — não só pela cor', async () => {
      // Sem o nome escrito, distinguir as partes depende só da cor, e o gráfico
      // some para quem não separa as cores da paleta.
      await waitFor(
        () => {
          for (const ponto of DISPOSITIVOS) expect(designEscreve(root, ponto.label)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
  },
};
