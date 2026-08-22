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
import { designPronto } from './chart.fixtures';
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

const dadosDispositivo = [
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
function tracadosDeSerie(raiz: HTMLElement): SVGPathElement[] {
  return [...raiz.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const s = getComputedStyle(p);
    return s.fill === 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') >= 2;
  });
}

/** Caminhos preenchidos e largos — a região sob a linha, não o símbolo do ponto. */
function areasPreenchidas(raiz: HTMLElement, larguraMinima: number): SVGPathElement[] {
  return [...raiz.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
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
    const raiz = await designPronto(canvasElement);

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const mes of meses) await expect(designEscreve(raiz, mes)).toBe(true);
    });

    await step('As barras existem e têm área — o desenho não é casca vazia', async () => {
      const formas = datumFormas(raiz);
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
    const raiz = await designPronto(canvasElement);

    await step('Uma linha traçada por série, com comprimento real', async () => {
      const tracados = tracadosDeSerie(raiz);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
      for (const tracado of tracados) {
        // Caminho declarado mas sem comando de desenho mede zero e continua no
        // DOM: o comprimento é o que prova que a linha foi mesmo traçada.
        await expect(tracado.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(raiz, serie.name)).toBe(true);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const mes of meses) await expect(designEscreve(raiz, mes)).toBe(true);
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
    const raiz = await designPronto(canvasElement);

    await step('O traçado continua lá — a área é a linha com região abaixo', async () => {
      const tracados = tracadosDeSerie(raiz);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('E há região preenchida sob a linha, não só o símbolo do ponto', async () => {
      const svg = raiz.querySelector('svg')!;
      // Metade da largura do desenho: o símbolo de ponto tem 6px, a região sob
      // a linha atravessa o gráfico. A comparação é relativa porque o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const meiaWidth = svg.getBoundingClientRect().width / 2;
      const areas = areasPreenchidas(raiz, meiaWidth);
      await expect(areas.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const mes of meses) await expect(designEscreve(raiz, mes)).toBe(true);
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
      option={buildPieOption({ data: dadosDispositivo })}
      className="nds-max-w-sm"
      height={280}
      aria-label="Distribuição de acessos por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await designPronto(canvasElement);

    await step('A legenda escreve o nome de cada fatia', async () => {
      for (const ponto of dadosDispositivo) {
        await expect(designEscreve(raiz, ponto.label)).toBe(true);
      }
    });

    await step('Cada fatia tem preenchimento próprio — a cor não se repete', async () => {
      const formas = datumFormas(raiz);
      await expect(formas.length).toBeGreaterThanOrEqual(dadosDispositivo.length);
      const preenchimentos = new Set(formas.map((f) => getComputedStyle(f).fill));
      await expect(preenchimentos.size).toBeGreaterThanOrEqual(dadosDispositivo.length);
    });
  },
};
