import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption,
} from './index';
import {
  designEscreve, exigirRoot, datumFormas,
} from '@shared/testing/chart-probe';
import { waitForDesign } from './chart.fixtures';
import {
  chartAreaSource,
  chartBarrasSource,
  chartLinesSource,
  chartPizzaSource,
  chartSource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const VALUES = [186, 305, 237, 73];
const SERIE_UNICA = [{ name: 'Vendas', data: VALUES }];
const SERIES_MULTI = [
  { name: 'Desktop', data: VALUES },
  { name: 'Mobile', data: [80, 200, 120, 190] },
];
const DATA_DISPOSITIVO = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada tipo de desenho
      // sobrescreve com o próprio montador logo abaixo.
      source: { transform: chartSource },
    },
  },
  title: 'UI/Chart/Variants',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

/**
 * Alturas das colunas de barra, na ordem do eixo.
 *
 * Cada barra chega ao DOM como DUAS formas sobrepostas — a cor e a trama —, com
 * a mesma geometria. Agrupar pelo centro em x junta o par e devolve uma medida
 * por categoria, sem depender da ordem em que a lib emite os nós.
 */
function categoriaAlturas(root: HTMLElement): number[] {
  const byCenter = new Map<number, number>();
  for (const forma of datumFormas(root)) {
    const r = forma.getBoundingClientRect();
    const center = Math.round(r.x + r.width / 2);
    byCenter.set(center, Math.max(byCenter.get(center) ?? 0, r.height));
  }
  return [...byCenter.entries()].sort((a, b) => a[0] - b[0]).map(([, height]) => height);
}

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: {
      source: { transform: chartBarrasSource },
      description: { story: 'Barras — comparação entre categorias discretas.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('Toda categoria aparece escrita no eixo', async () => {
      await waitFor(() => {
        for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('Uma coluna por mês, com altura proporcional ao valor', async () => {
      // Dentro do `waitFor` porque as barras CRESCEM: a lib anima a altura a
      // partir da linha de base, e enquanto a animação corre a ordem medida
      // ainda não é a ordem final. Compara ORDEM, não pixel — o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const maiorValue = VALUES.indexOf(Math.max(...VALUES));
      const menorValue = VALUES.indexOf(Math.min(...VALUES));
      await waitFor(() => {
        const alturas = categoriaAlturas(root);
        expect(alturas).toHaveLength(MONTHS.length);
        expect(alturas.indexOf(Math.max(...alturas))).toBe(maiorValue);
        expect(alturas.indexOf(Math.min(...alturas))).toBe(menorValue);
      }, { timeout: 3000 });
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      source: { transform: chartLinesSource },
      description: { story: 'Linhas — tendência ao longo de uma sequência contínua.' },
    },
  },
  args: {
    option: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('Uma linha traçada por série', async () => {
      // O traçado é o caminho SEM preenchimento; o `C` no comando separa a
      // curva da série das linhas de grade, que também são `fill: none` mas
      // vão de um ponto a outro em reta.
      const tracos = [...root.querySelectorAll<SVGPathElement>('svg path')].filter(
        (p) => getComputedStyle(p).fill === 'none' && (p.getAttribute('d') ?? '').includes('C'),
      );
      await expect(tracos).toHaveLength(SERIES_MULTI.length);
      for (const traco of tracos) {
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A legenda nomeia cada série, e o eixo traz as categorias', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
      for (const month of MONTHS) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Area: Story = {
  parameters: {
    docs: {
      source: { transform: chartAreaSource },
      description: { story: 'Área — linha com a região sob ela preenchida, para volume acumulado.' },
    },
  },
  args: {
    option: buildAreaOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('Cada série tem traçado E região preenchida', async () => {
      const caminhos = [...root.querySelectorAll<SVGPathElement>('svg path')];
      const tracos = caminhos.filter(
        (p) => getComputedStyle(p).fill === 'none' && (p.getAttribute('d') ?? '').includes('C'),
      );
      await expect(tracos).toHaveLength(SERIES_MULTI.length);

      // A região é o que distingue a área da linha: preenchida, e translúcida
      // para não esconder a série de baixo.
      const regioes = caminhos.filter((p) => {
        const s = getComputedStyle(p);
        const opacity = Number(s.fillOpacity);
        return s.fill !== 'none' && opacity > 0 && opacity < 1;
      });
      await expect(regioes.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('As categorias continuam escritas no eixo', async () => {
      for (const month of MONTHS) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: { transform: chartPizzaSource },
      description: { story: 'Pizza (rosca) — composição de um total entre poucas partes.' },
    },
  },
  args: {
    option: buildPieOption({ data: DATA_DISPOSITIVO }),
    height: 280,
    class: 'nds-w-full',
    'aria-label': 'Distribuição de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('A legenda escreve o nome de cada fatia — a cor não é o único sinal', async () => {
      await waitFor(() => {
        for (const ponto of DATA_DISPOSITIVO) {
          expect(designEscreve(root, ponto.label)).toBe(true);
        }
      }, { timeout: 3000 });
    });

    await step('Uma forma desenhada por fatia, no mínimo', async () => {
      await expect(datumFormas(root).length).toBeGreaterThanOrEqual(DATA_DISPOSITIVO.length);
    });
  },
};
