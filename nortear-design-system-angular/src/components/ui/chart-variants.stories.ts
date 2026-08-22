import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsChart } from './chart';
import {
  MONTHS,
  SERIE_UNICA,
  SERIES_MULTI,
  DATA_DISPOSITIVO,
  rgbColor,
  rgbToken,
} from './chart.fixtures';

const meta: Meta = {
  title: 'UI/Chart/Types',
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'functional.item4', 'visual.item1'],
  },
  render: () => ({
    props: { meses: MONTHS, series: SERIE_UNICA },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de barras: acessos mensais no desktop"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Uma barra por mês, com altura proporcional ao valor', async () => {
      const barras = [...chart.querySelectorAll<SVGRectElement>('rect[data-series]')];
      await expect(barras).toHaveLength(MONTHS.length);
      const alturas = barras.map((b) => b.getBoundingClientRect().height);
      const valores = SERIE_UNICA[0].data;
      // Maior valor → maior barra. Compara ordem, não pixel: o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const maiorHeight = alturas.indexOf(Math.max(...alturas));
      const maiorValue = valores.indexOf(Math.max(...valores));
      await expect(maiorHeight).toBe(maiorValue);
    });

    await step('Cada forma carrega categoria e valor em texto', async () => {
      // É a dica nativa do ponteiro — e nada existe só nela: o mesmo par
      // categoria/valor está na tabela, alcançável sem mouse.
      const barras = [...chart.querySelectorAll<SVGRectElement>('rect[data-series]')];
      barras.forEach((barra, i) => {
        const titulo = barra.querySelector('title')?.textContent ?? '';
        expect(titulo).toContain(MONTHS[i]);
        expect(titulo).toContain(String(SERIE_UNICA[0].data[i]));
      });

      const celulas = [...chart.querySelectorAll<HTMLTableCellElement>('tbody td')];
      await expect(celulas.map((c) => c.textContent?.trim()))
        .toEqual(SERIE_UNICA[0].data.map(String));
    });

    await step('Com uma série só, o valor também fica escrito no desenho', async () => {
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      for (const valor of SERIE_UNICA[0].data) {
        await expect(texts).toContain(String(valor));
      }
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
  },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="line"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de linhas: acessos mensais por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Uma linha traçada por série', async () => {
      const tracos = [...chart.querySelectorAll<SVGPathElement>('path[data-series]')]
        .filter((p) => p.getAttribute('fill') === 'none');
      await expect(tracos).toHaveLength(SERIES_MULTI.length);
      for (const traco of tracos) {
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A primeira série sai no primeiro token da paleta', async () => {
      // A segunda metade do item de contrato: não basta existir traçado, ele
      // tem de sair em --chart-1. Comparar o token RESOLVIDO, e não o texto
      // "hsl(var(--chart-1))", é o que prova que a cascata chegou ao desenho.
      const primeiro = [...chart.querySelectorAll<SVGPathElement>('path[data-series="0"]')]
        .find((p) => p.getAttribute('fill') === 'none')!;
      const desenhada = rgbColor(getComputedStyle(primeiro).stroke)!;
      const esperada = rgbToken('--chart-1')!;
      for (const canal of [0, 1, 2]) {
        await expect(Math.abs(desenhada[canal] - esperada[canal])).toBeLessThan(0.01);
      }
    });

    await step('As séries se distinguem por forma, não só por cor', async () => {
      // Retirando toda a cor o gráfico continua legível: traço com desenho
      // próprio e símbolo de ponto próprio por série (WCAG 1.4.1).
      const tracos = [...chart.querySelectorAll<SVGPathElement>('path[data-series]')]
        .filter((p) => p.getAttribute('fill') === 'none');
      const desenhosDeTraco = tracos.map((t) => t.getAttribute('stroke-dasharray'));
      await expect(new Set(desenhosDeTraco).size).toBe(SERIES_MULTI.length);

      const simbolos = [...chart.querySelectorAll<SVGPathElement>('path[data-series] > title')]
        .map((t) => t.parentElement as unknown as SVGPathElement);
      const formaDaSerie = new Map<string, Set<string>>();
      for (const simbolo of simbolos) {
        const serie = simbolo.getAttribute('data-series')!;
        // Normaliza o `d` tirando as coordenadas: sobra o formato do comando,
        // que é o que diferencia círculo de quadrado de triângulo.
        const forma = (simbolo.getAttribute('d') ?? '').replace(/-?[\d.]+/g, '');
        if (!formaDaSerie.has(serie)) formaDaSerie.set(serie, new Set());
        formaDaSerie.get(serie)!.add(forma);
      }
      const formas = [...formaDaSerie.values()].map((s) => [...s][0]);
      await expect(new Set(formas).size).toBe(SERIES_MULTI.length);
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      for (const serie of SERIES_MULTI) {
        await expect(texts).toContain(serie.name);
      }
    });
  },
};

export const Area: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="area"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de área: volume mensal de acessos por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Cada série ganha uma área fechada sob a linha', async () => {
      const areas = [...chart.querySelectorAll<SVGPathElement>('svg > path[fill-opacity]')];
      // Duas camadas por série: a cor e a trama sobreposta.
      await expect(areas).toHaveLength(SERIES_MULTI.length * 2);
      for (const area of areas) {
        await expect((area.getAttribute('d') ?? '').endsWith('Z')).toBe(true);
      }
    });
  },
};

export const Pie: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { dados: DATA_DISPOSITIVO },
    template: `
      <div ndsChart
        type="pie"
        [data]="dados"
        label="Distribuição de acessos por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Uma fatia por item', async () => {
      const fatias = [...chart.querySelectorAll<SVGPathElement>('path[data-series]')];
      await expect(fatias).toHaveLength(DATA_DISPOSITIVO.length);
    });

    await step('A legenda traz nome, valor e participação — não só a cor', async () => {
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent ?? '');
      for (const ponto of DATA_DISPOSITIVO) {
        await expect(texts.some((texto) => texto.includes(ponto.label)
          && texto.includes(String(ponto.value))
          && texto.includes('%'))).toBe(true);
      }
    });

    await step('A tabela repete a participação em número', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toHaveLength(3);
      const primeira = [...chart.querySelectorAll('tbody tr')][0];
      await expect(primeira.textContent).toContain('%');
    });
  },
};
