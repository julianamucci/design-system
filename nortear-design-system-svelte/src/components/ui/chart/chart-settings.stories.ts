import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';
import {
  designEscreve, exigirRoot, datumFormas,
} from '@shared/testing/chart-probe';
import { waitForDesign } from './chart.fixtures';
import {
  chartBarrasSource,
  chartWithCaptionSource,
  chartWithTitleSource,
  chartSource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const VALUES = [186, 305, 237, 73];
const SERIE_UNICA = [{ name: 'Vendas', data: VALUES }];
const SERIES_MULTI = [
  { name: 'Desktop', data: VALUES },
  { name: 'Mobile', data: [80, 200, 120, 190] },
  { name: 'Tablet', data: [40, 90, 60, 100] },
];

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada configuração
      // sobrescreve com o próprio objeto de configuração logo abaixo.
      source: { transform: chartSource },
    },
  },
  title: 'UI/Chart/Settings',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

/**
 * Centro de cada coluna de barra, na ordem do eixo — ou seja, na ordem das
 * categorias. Cada barra chega ao DOM como duas formas sobrepostas (a cor e a
 * trama) com a mesma geometria, então o agrupamento por centro devolve um
 * ponto por categoria.
 */
function categoriaCentros(raiz: HTMLElement): Array<{ x: number; y: number }> {
  const byCenter = new Map<number, { x: number; y: number }>();
  for (const forma of datumFormas(raiz)) {
    const r = forma.getBoundingClientRect();
    const x = Math.round(r.x + r.width / 2);
    byCenter.set(x, { x, y: r.y + r.height / 2 });
  }
  return [...byCenter.values()].sort((a, b) => a.x - b.x);
}

export const WithTooltip: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      source: { transform: chartBarrasSource },
      description: { story: 'O ponteiro sobre uma coluna abre a dica com a categoria e o valor daquele ponto.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);
    const svg = raiz.querySelector('svg')!;
    const centros = categoriaCentros(raiz);
    await expect(centros).toHaveLength(MONTHS.length);

    // `userEvent.hover` não serve aqui: ele não leva coordenada, e a lib faz o
    // teste de acerto por posição — o ponteiro cairia em (0,0), fora da área do
    // desenho. `fireEvent.mouseMove` com clientX/clientY leva o ponto exato.
    const apontarTo = (i: number) =>
      fireEvent.mouseMove(svg, { clientX: centros[i].x, clientY: centros[i].y, bubbles: true });

    await step('A dica traz a categoria e o valor da coluna apontada', async () => {
      // 305 e 73 não aparecem em marca de eixo nenhuma (as marcas vão de 50 em
      // 50): achar o número no container é prova de que a dica escreveu.
      await apontarTo(1);
      await waitFor(() => {
        expect(raiz.textContent).toContain('Fev');
        expect(raiz.textContent).toContain('305');
      }, { timeout: 3000 });
    });

    await step('E acompanha o ponteiro — a dica é do ponto apontado, não a primeira que abriu', async () => {
      await apontarTo(3);
      await waitFor(() => {
        expect(raiz.textContent).toContain('73');
        expect(raiz.textContent).not.toContain('305');
      }, { timeout: 3000 });
    });
  },
};

export const WithCaption: Story = {
  parameters: {
    docs: {
      source: { transform: chartWithCaptionSource },
      description: { story: 'Legenda forçada: com uma série ela some por padrão, e a configuração traz de volta.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA, showLegend: true }),
    height: 260,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras com legenda: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);

    await step('Com a legenda ligada, o nome da série é escrito mesmo havendo uma só', async () => {
      // Sem a configuração, este mesmo desenho não escreve "Vendas" — é o que a
      // story SingleSeries mede do outro lado.
      await waitFor(
        () => expect(designEscreve(raiz, SERIE_UNICA[0].name)).toBe(true),
        { timeout: 3000 },
      );
    });

    await step('E o desenho continua completo, com uma forma por categoria', async () => {
      for (const month of MONTHS) await expect(designEscreve(raiz, month)).toBe(true);
      await expect(datumFormas(raiz).length).toBeGreaterThanOrEqual(MONTHS.length);
    });
  },
};

export const MultipleSeries: Story = {
  parameters: {
    docs: {
      source: { transform: chartWithTitleSource },
      description: { story: 'Multi-séries com título no próprio desenho — o painel típico de um relatório.' },
    },
  },
  args: {
    option: buildBarOption({
      xAxis: MONTHS,
      series: SERIES_MULTI,
      title: 'Acessos por dispositivo',
    }),
    height: 300,
    class: 'nds-w-full',
    'aria-label': 'Acessos por dispositivo: desktop, mobile e tablet, de janeiro a abril',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);

    await step('O título do desenho aparece escrito', async () => {
      await waitFor(
        () => expect(designEscreve(raiz, 'Acessos por dispositivo')).toBe(true),
        { timeout: 3000 },
      );
    });

    await step('A legenda nomeia cada série', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(raiz, serie.name)).toBe(true);
      }
    });
  },
};
