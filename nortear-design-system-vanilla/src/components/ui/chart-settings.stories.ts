import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  designEscreve,
  designPintado,
  designRenderizado,
  exigirRoot,
  datumFormas,
} from '@shared/testing/chart-probe';
import { createChart } from './chart';
import { chartSource, chartSourceWith } from './chart.source';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const ACESSOS = [186, 305, 237, 73, 209, 214];

const chartData = MONTHS.map((label, i) => ({ label, value: ACESSOS[i] }));

/** Cor autoral da série. Fora da paleta `--chart-*`, para não se confundir com ela. */
const ROXO = '#7c3aed';
const ROXO_RGB = 'rgb(124, 58, 237)';

const HEIGHT = 320;

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
  title: 'UI/Chart/Settings',
};

export default meta;
type Story = StoryObj;

// ─── Cor da série ─────────────────────────────────────────────────────────────

export const SeriesColor: Story = {
  parameters: {
    docs: {
      // Override de story: a cor mora DENTRO do item de série, e é isso que o
      // snippet precisa mostrar — não uma opção de topo.
      source: {
        transform: chartSourceWith({
          dados: 'serieUnica',
          color: ROXO,
          'aria-label': 'Acessos mensais no desktop, em cor autoral',
        }),
      },
      description: {
        story: 'Cor autoral por série, informada no próprio item de `series`. Sobrescreve o token de paleta daquela série e só daquela — as demais continuam vindo do tema.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: [{ name: 'Desktop', data: ACESSOS, color: ROXO }],
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais no desktop, em cor autoral',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('As formas da série saem na cor pedida', async () => {
      // A trama sobreposta entra como `url(#…)` e não carrega cor — por isso a
      // procura é entre os preenchimentos que são cor de verdade.
      const colors = datumFormas(raiz)
        .map((f) => getComputedStyle(f).fill)
        .filter((cor) => !cor.startsWith('url'));
      await expect(colors).toContain(ROXO_RGB);
    });

    await step('Toda categoria continua escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(raiz, month)).toBe(true);
      }
    });
  },
};

// ─── Altura ───────────────────────────────────────────────────────────────────

export const CustomHeight: Story = {
  parameters: {
    docs: {
      // Override de story: a altura é o assunto, e o valor dela é o da story.
      source: {
        transform: chartSourceWith({
          height: HEIGHT,
          'aria-label': 'Acessos mensais, em bloco mais alto',
        }),
      },
      description: {
        story: 'Altura informada em pixels. Sem valor, vale o piso de altura do próprio bloco — a altura nunca vem de classe.',
      },
    },
  },
  render: () => createChart({
    data: chartData,
    type: 'bar',
    height: HEIGHT,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais, em bloco mais alto',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O container fica com a altura pedida', async () => {
      // Tolerância de 1px: o retângulo do layout é fracionário, e comparar
      // igualdade exata em pixel é o caminho curto para um teste intermitente.
      await expect(Math.abs(raiz.getBoundingClientRect().height - HEIGHT)).toBeLessThanOrEqual(1);
    });

    await step('E o desenho ocupa o bloco todo, não uma faixa do topo', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      const design = designRenderizado(raiz) as SVGElement;
      await waitFor(
        () => expect(design.getBoundingClientRect().height).toBeGreaterThan(HEIGHT * 0.9),
        { timeout: 3000 },
      );
    });

    await step('E o dado continua desenhado', async () => {
      await expect(datumFormas(raiz).length).toBeGreaterThan(0);
    });
  },
};
