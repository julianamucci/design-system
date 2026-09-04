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

const SERIES_MULTI = [
  { name: 'Desktop', data: ACESSOS },
  { name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },
];

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
  title: 'Components/Display/Chart/Settings',
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
          data: 'serieUnica',
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
    const root = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('As formas da série saem na cor pedida', async () => {
      // A trama sobreposta entra como `url(#…)` e não carrega cor — por isso a
      // procura é entre os preenchimentos que são cor de verdade.
      const colors = datumFormas(root)
        .map((f) => getComputedStyle(f).fill)
        .filter((cor) => !cor.startsWith('url'));
      await expect(colors).toContain(ROXO_RGB);
    });

    await step('Toda categoria continua escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

// ─── Tabela de dados à vista ──────────────────────────────────────────────────

/**
 * A alternativa textual existe SEMPRE — em toda story do componente ela está no
 * DOM, fora da tela. Esta é a que a mostra para todo mundo.
 *
 * Não é um extra de acessibilidade: é o mesmo dado do desenho, em forma que a
 * busca da página encontra, que dá para copiar e que o leitor de tela lê. Um
 * `<svg>` mudo é conteúdo perdido.
 */
export const VisibleData: Story = {
  parameters: {
    docs: {
      // Override de story: são duas séries, e a opção que a story exercita.
      source: {
        transform: chartSourceWith({
          data: 'multi',
          showData: true,
          'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
        }),
      },
      description: {
        story: 'A tabela de dados à vista, embaixo do desenho. Ela é emitida sempre — para leitor de tela, busca da página e cópia —, e esta opção só decide se ela aparece na tela.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'bar',
    height: 240,
    showData: true,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]')!;

    await step('A tabela sai da condição de leitor de tela e aparece', async () => {
      await expect(data.classList.contains('nds-sr-only')).toBe(false);
      await expect(data.classList.contains('nds-table-wrapper')).toBe(true);
      // Fora da tela ela mede 1px de altura; à vista, mede a tabela inteira.
      await expect(data.getBoundingClientRect().height).toBeGreaterThan(1);
    });

    await step('A caixa que rola é alcançável por teclado', async () => {
      // `.nds-table-wrapper` rola na horizontal, e região rolável sem foco é
      // conteúdo que só existe para quem usa mouse. Fora da tela o `tabindex`
      // não entra: não há nada para rolar, e ele seria uma parada de tabulação
      // num elemento que ninguém enxerga.
      await expect(data.getAttribute('tabindex')).toBe('0');
    });

    await step('O bloco cresce para caber os dois — nada é recortado', async () => {
      // `.nds-chart` recorta o que transborda. Com a altura cravada no BLOCO,
      // e não no desenho, a tabela ficaria escondida atrás da borda de baixo.
      await expect(data.getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(root.getBoundingClientRect().bottom + 1);
      await expect(root.getBoundingClientRect().height)
        .toBeGreaterThan(data.getBoundingClientRect().height);
    });

    await step('E o desenho continua desenhado, em cima dela', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
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
    const root = exigirRoot(canvasElement);

    await step('O container fica com a altura pedida', async () => {
      // Tolerância de 1px: o retângulo do layout é fracionário, e comparar
      // igualdade exata em pixel é o caminho curto para um teste intermitente.
      await expect(Math.abs(root.getBoundingClientRect().height - HEIGHT)).toBeLessThanOrEqual(1);
    });

    await step('E o desenho ocupa o bloco todo, não uma faixa do topo', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      const design = designRenderizado(root) as SVGElement;
      await waitFor(
        () => expect(design.getBoundingClientRect().height).toBeGreaterThan(HEIGHT * 0.9),
        { timeout: 3000 },
      );
    });

    await step('E o dado continua desenhado', async () => {
      await expect(datumFormas(root).length).toBeGreaterThan(0);
    });
  },
};
