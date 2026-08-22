import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsChart } from './chart';
import {
  MONTHS,
  SERIE_UNICA,
  SERIES_MULTI,
  rgbColor,
  contrastRatio,
  rgbToken,
} from './chart.fixtures';

const meta: Meta = {
  title: 'UI/Chart/States',
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: { covers: ['functional.item1', 'visual.item3'] },
  render: () => ({
    props: { vazio: [] },
    template: `
      <div ndsChart
        [series]="vazio"
        label="Acessos mensais"
        emptyLabel="Nenhum dado disponível para o período selecionado."
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Sem dado não há desenho — há uma frase', async () => {
      // Frase completa com orientação, não "Sem dados.": é a regra de UX
      // writing do estado vazio.
      await expect(chart.querySelector('svg')).toBeNull();
      const aviso = chart.querySelector('.nds-chart-empty')!;
      await expect(aviso.textContent?.trim())
        .toBe('Nenhum dado disponível para o período selecionado.');
    });

    await step('O container mantém a altura mínima', async () => {
      // Sem piso, o bloco colapsa e a página salta quando o dado chega.
      await expect(chart.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

export const SingleSeries: Story = {
  render: () => ({
    props: { meses: MONTHS, series: SERIE_UNICA },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais no desktop"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Com uma série a legenda some — não há o que comparar', async () => {
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      await expect(texts).not.toContain(SERIE_UNICA[0].name);
    });

    await step('Sem legenda ocupando espaço, o valor cabe junto do dado', async () => {
      // A contrapartida de esconder a legenda: com uma série só não há números
      // se sobrepondo, então o valor exato é escrito no desenho.
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      for (const valor of SERIE_UNICA[0].data) {
        await expect(texts).toContain(String(valor));
      }
    });

    await step('A tabela tem duas colunas: categoria e a única série', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Categoria', SERIE_UNICA[0].name]);
    });
  },
};

// `visual.item2` é o gráfico de LINHAS multi-série; esta story desenha barras.
// A declaração estava aqui e era falsa — o Chromatic olhava para o desenho
// errado e passava. Quem cobre o item é a story Line, que é de linhas mesmo.
export const MultiSeries: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo: desktop e mobile"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Legenda automática com o nome de cada série', async () => {
      const texts = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      for (const serie of SERIES_MULTI) {
        await expect(texts).toContain(serie.name);
      }
    });

    await step('Cada série usa um token de cor distinto', async () => {
      const barras = [...chart.querySelectorAll<SVGRectElement>('rect[data-series]')];
      await expect(barras).toHaveLength(MONTHS.length * SERIES_MULTI.length);
      const colors = new Set(barras.map((b) => getComputedStyle(b).fill));
      await expect(colors.size).toBe(SERIES_MULTI.length);
    });

    await step('E também uma trama distinta — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1).
      const tramas = [...chart.querySelectorAll<SVGRectElement>('svg > rect')]
        .map((r) => r.getAttribute('fill'))
        .filter((fill): fill is string => !!fill?.startsWith('url('));
      await expect(new Set(tramas).size).toBe(SERIES_MULTI.length);
    });

    await step('A tabela ganha uma coluna por série', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toHaveLength(SERIES_MULTI.length + 1);
      await expect(header.slice(1)).toEqual(SERIES_MULTI.map((s) => s.name));
    });
  },
};

/**
 * Tema escuro. A cor de série é `hsl(var(--chart-n))` escrita no atributo de
 * apresentação do SVG — quem recolore é a cascata, não JavaScript, então trocar
 * a classe do `<html>` basta.
 *
 * Desenha barras E linhas: o item de regressão visual que esta story declara
 * fala dos dois, e um só deles deixaria metade do item fotografada por ninguém.
 */
export const DarkTheme: Story = {
  parameters: { covers: ['functional.item6', 'visual.item4'], controls: { disable: true } },
  globals: { theme: 'dark' },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo, em barras"
      ></div>
      <div ndsChart
        type="line"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo, em linhas"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const graficos = [...canvasElement.querySelectorAll<HTMLElement>('.nds-chart')];
    const chart = graficos[0];
    const html = document.documentElement;
    const darkEra = html.classList.contains('dark');
    const barra = chart.querySelector<SVGRectElement>('rect[data-series="0"]')!;
    // A sonda da recolorização é o TEXTO do eixo, não a barra: a paleta de
    // série (--chart-1 a --chart-5) é a mesma nos dois modos de propósito —
    // está declarada só em :root e nos três temas de marca, sem bloco .dark, e
    // o comentário em themes/default.css diz isso com todas as letras. Medir a
    // barra afirmaria que a cor muda, e ela não muda em tema nenhum.
    const rotulo = chart.querySelector<SVGTextElement>('svg text')!;

    await step('Os dois tipos estão na foto', async () => {
      // O item de regressão visual fala de barras E linhas.
      await expect(graficos).toHaveLength(2);
      await expect(graficos[1].querySelector('path[data-series]')).not.toBeNull();
    });

    await step('Trocar o tema recolore sem remontar', async () => {
      try {
        html.classList.remove('dark');
        const light = getComputedStyle(rotulo).fill;
        html.classList.add('dark');
        const escuro = getComputedStyle(rotulo).fill;
        // Mesmo nó no DOM: nada foi recriado, só a cascata resolveu outro token.
        await expect(escuro).not.toBe(light);
        await expect(chart.querySelector('svg text')).toBe(rotulo);
        await expect(chart.querySelector('rect[data-series="0"]')).toBe(barra);
      } finally {
        // Repõe o estado que ENCONTROU. No Storybook o `globals` desta story
        // deixa o escuro posto, e é ele que o Chromatic fotografa; na suíte, em
        // que as stories dividem o mesmo documento, repor evita envenenar a
        // próxima.
        html.classList.toggle('dark', darkEra);
      }
    });
  },
};

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está ao redor.
 *
 * Quem sustenta o critério aqui é o CONTORNO das formas, não a cor de série:
 * os tokens `--chart-1` a `--chart-5` do tema padrão ficam em torno de 2:1
 * contra o fundo e de 1.2:1 entre vizinhos. O contorno em `--foreground`
 * delimita cada objeto independentemente da paleta escolhida.
 */
export const GraphicContrast: Story = {
  parameters: { covers: ['accessibility.item3'], controls: { disable: true } },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const background = rgbToken('--background')!;

    await step('Toda forma de dado tem contorno', async () => {
      const contornos = [...chart.querySelectorAll<SVGRectElement>('svg > rect')]
        .filter((r) => r.getAttribute('fill')?.startsWith('url('));
      // Uma camada de contorno por barra desenhada, mais a da legenda.
      await expect(contornos.length).toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length);
      for (const contorno of contornos) {
        await expect(contorno.getAttribute('stroke-width')).toBe('1');
      }
    });

    await step('O contorno passa de 3:1 contra o fundo', async () => {
      const contorno = [...chart.querySelectorAll<SVGRectElement>('svg > rect')]
        .find((r) => r.getAttribute('fill')?.startsWith('url('))!;
      const cor = rgbColor(getComputedStyle(contorno).stroke)!;
      await expect(contrastRatio(cor, background)).toBeGreaterThanOrEqual(3);
    });

    await step('O texto dos eixos passa de 4.5:1', async () => {
      const rotulo = chart.querySelector<SVGTextElement>('svg text')!;
      const cor = rgbColor(getComputedStyle(rotulo).fill)!;
      await expect(contrastRatio(cor, background)).toBeGreaterThanOrEqual(4.5);
    });
  },
};
