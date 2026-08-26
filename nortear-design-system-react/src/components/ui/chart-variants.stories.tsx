import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from './chart';
import {
  designEscreve,
  datumFormas,
} from '@shared/testing/chart-probe';
import { designPronto, headerOf, optionOf, rowsOf } from './chart.fixtures';
import {
  chartAreaSource,
  chartLineSource,
  chartPizzaSource,
  chartSource,
} from './chart.source';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const serieUnica = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const seriesMulti = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
];

const dataDispositivo = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile', value: 860 },
  { label: 'Tablet', value: 320 },
];

const meta: Meta = {
  title: 'UI/Chart/Types',
  tags: ['display'],
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Os traçados de série: caminho sem preenchimento e com traço grosso.
 *
 * A largura separa o traçado da linha de grade e do eixo, que o tema desenha
 * com 1px — sem ela, "existe um caminho vazado" seria verdade em qualquer
 * gráfico, inclusive num de barras.
 */
function tracadosDeSerie(root: HTMLElement): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const s = getComputedStyle(p);
    return s.fill === 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') >= 2;
  });
}

/** Caminhos preenchidos e largos — a região sob a linha, não o símbolo do ponto. */
function areasPreenchidas(root: HTMLElement, larguraMinima: number): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const fill = getComputedStyle(p).fill;
    if (fill === 'none' || /,\s*0\)\s*$/.test(fill)) return false;
    return p.getBBox().width >= larguraMinima;
  });
}

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: { description: { story: 'Comparação entre categorias discretas.' } },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: serieUnica })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de barras: acessos mensais no desktop"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });

    await step('As barras existem e têm área — o desenho não é casca vazia', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThan(0);
      for (const forma of formas) {
        await expect(forma.getBoundingClientRect().width).toBeGreaterThan(0);
      }
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      // Outro construtor e mais de uma série: o snippet do meta ensina barras
      // com série única e esconderia as duas diferenças.
      source: { transform: chartLineSource },
      description: { story: 'Tendência contínua ao longo do tempo.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildLineOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de linhas: acessos mensais por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('Uma linha traçada por série, com comprimento real', async () => {
      const tracados = tracadosDeSerie(root);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
      for (const tracado of tracados) {
        // Caminho declarado mas sem comando de desenho mede zero e continua no
        // DOM: o comprimento é o que prova que a linha foi mesmo traçada.
        await expect(tracado.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('Cada série tem símbolo de ponto e traço próprios', async () => {
      // Aqui não há área a hachurar: a trama do `decal` cobre barra e fatia, e
      // numa linha ela não tem onde pousar. O que separa as séries quando a cor
      // sai de cena (WCAG 1.4.1) é a FORMA do ponto e o desenho do traço.
      //
      // A medida sai da option resolvida pela lib, e não do DOM: símbolo e
      // traço são decisão de configuração, e no `<svg>` do zrender o símbolo de
      // ponto sai com contorno de 0.44px — indistinguível de decoração por
      // qualquer filtro que se tente escrever sobre o desenho.
      const series = optionOf(root).series;
      await expect(series).toHaveLength(seriesMulti.length);

      const symbols = series.map((s) => String(s.symbol));
      await expect(new Set(symbols).size).toBe(seriesMulti.length);

      const dashes = series.map((s) => JSON.stringify((s.lineStyle as { type?: unknown })?.type));
      await expect(new Set(dashes).size).toBe(seriesMulti.length);
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(root, serie.name)).toBe(true);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });

    await step('A tabela traz uma coluna por série e uma linha por categoria', async () => {
      await expect(headerOf(root)).toEqual(['Categoria', ...seriesMulti.map((s) => s.name)]);
      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(meses);
      for (const [iSeries, serie] of seriesMulti.entries()) {
        await expect(rows.map((row) => row[iSeries + 1])).toEqual(serie.data.map(String));
      }
    });
  },
};

export const Area: Story = {
  parameters: {
    docs: {
      // A área é um construtor próprio, e não uma bandeira do de linhas.
      source: { transform: chartAreaSource },
      description: { story: 'Tendência com ênfase no volume acumulado.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildAreaOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de área: volume mensal de acessos por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('O traçado continua lá — a área é a linha com região abaixo', async () => {
      const tracados = tracadosDeSerie(root);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('E há região preenchida sob a linha, não só o símbolo do ponto', async () => {
      const svg = root.querySelector('svg')!;
      // Metade da largura do desenho: o símbolo de ponto tem 9px, a região sob
      // a linha atravessa o gráfico. A comparação é relativa porque o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const meiaWidth = svg.getBoundingClientRect().width / 2;
      const areas = areasPreenchidas(root, meiaWidth);
      await expect(areas.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // A pizza recebe outra FORMA de dado — pares de rótulo e valor, sem eixo
      // —, então o snippet do meta ensinaria uma chamada que aqui nem compila.
      source: { transform: chartPizzaSource },
      description: { story: 'Proporção de partes em relação ao todo.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildPieOption({ data: dataDispositivo })}
      className="nds-max-w-sm"
      height={280}
      aria-label="Distribuição de acessos por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('A legenda escreve o nome de cada fatia', async () => {
      for (const ponto of dataDispositivo) {
        await expect(designEscreve(root, ponto.label)).toBe(true);
      }
    });

    await step('Cada fatia tem preenchimento próprio — a cor não se repete', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThanOrEqual(dataDispositivo.length);
      const preenchimentos = new Set(formas.map((f) => getComputedStyle(f).fill));
      await expect(preenchimentos.size).toBeGreaterThanOrEqual(dataDispositivo.length);
    });

    await step('A tabela escreve valor E participação — o ângulo vira número', async () => {
      // A pizza comunica parte contra o todo pelo ÂNGULO, e ângulo não se lê
      // sem enxergar. Sem a coluna de participação a alternativa textual
      // contaria menos que o desenho.
      await expect(headerOf(root)).toEqual(['Categoria', 'Valor', 'Participação']);

      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(dataDispositivo.map((p) => p.label));
      await expect(rows.map((row) => row[1])).toEqual(dataDispositivo.map((p) => String(p.value)));

      const total = dataDispositivo.reduce((sum, p) => sum + p.value, 0);
      await expect(rows.map((row) => row[2])).toEqual(
        dataDispositivo.map((p) => `${Math.round((p.value / total) * 1000) / 10}%`),
      );
    });
  },
};
