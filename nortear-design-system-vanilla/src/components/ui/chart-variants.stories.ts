import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  designEscreve,
  designPintado,
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

const pieData = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];

/** Traçado: caminho sem preenchimento e com espessura de série (o eixo usa 1px). */
function tracados(root: HTMLElement): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const s = getComputedStyle(p);
    return s.fill === 'none' && parseFloat(s.strokeWidth || '0') >= 2;
  });
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
  title: 'UI/Chart/Variants',
};

export default meta;
type Story = StoryObj;

// A dica sob o ponteiro (functional.item4) NÃO é declarada aqui.
//
// Medido: nesta stack o evento de ponteiro sintético não chega ao motor de
// desenho — o mesmo passo, com o mesmo alvo e as mesmas coordenadas, abre a
// dica nas outras três. Foram descartadas a forma do dado, a largura do bloco,
// o recorte do container (o desenho passou a morar num elemento interno por
// causa disto) e o par pointer/mouse. Declarar cobertura sem verificação seria
// pior que não declarar: o auditor passaria a mentir. Fica como divergência
// escrita até alguém achar a causa.

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    // Declarado como NÃO VERIFICADO, com o motivo, em vez de omitido: omitir
    // deixaria o item sumir do relatório, e reivindicá-lo faria o auditor
    // mentir. Medido: o evento de ponteiro sintético não chega ao motor de
    // desenho nesta stack — o mesmo passo, com o mesmo alvo e as mesmas
    // coordenadas, abre a dica nas outras três. Foram descartadas a forma do
    // dado, a largura do bloco, o par pointer/mouse e o recorte do container
    // (o desenho passou a morar num elemento interno por causa desta caça).
    // A dica funciona no produto; o que falta é o caminho de verificação.
    coversNotApplicable: {
      'functional.item4': 'dica sob o ponteiro não alcançável por evento sintético nesta stack — verificação em aberto',
    },
    docs: {
      description: {
        story: 'Tipo bar — comparação entre categorias discretas. Use para dados não contínuos.',
      },
    },
  },
  render: () => createChart({
    data: chartData,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop, de janeiro a junho',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai, com uma forma por categoria', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });

  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      // Override de story: muda o tipo E a FORMA do dado — aqui entram `xAxis`
      // e `series`, e não a lista simples de rótulo e valor.
      source: {
        transform: chartSourceWith({
          type: 'line',
          data: 'multi',
          'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo, de janeiro a junho',
        }),
      },
      description: {
        story: 'Tipo line — tendência contínua ao longo do tempo. Uma linha por série, com ponto por dado.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'line',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo, de janeiro a junho',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Uma linha traçada por série', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => expect(tracados(root).length).toBeGreaterThanOrEqual(SERIES_MULTI.length),
        { timeout: 3000 },
      );
      for (const traco of tracados(root)) {
        // Comprimento zero é caminho vazio: o nó existiria e nada teria sido
        // desenhado.
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

// ─── Area ─────────────────────────────────────────────────────────────────────

export const Area: Story = {
  parameters: {
    docs: {
      // Override de story: tipo e forma do dado, como no traçado.
      source: {
        transform: chartSourceWith({
          type: 'area',
          data: 'multi',
          'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
        }),
      },
      description: {
        story: 'Tipo area — linha com a região preenchida embaixo. Enfatiza volume ao longo do tempo.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'area',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O traçado continua lá — a área é acréscimo, não troca', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => expect(tracados(root).length).toBeGreaterThanOrEqual(SERIES_MULTI.length),
        { timeout: 3000 },
      );
    });

    await step('Cada série ganha uma região preenchida sob a linha', async () => {
      // Preenchimento translúcido: opaco esconderia a série de baixo, e é por
      // isso que a área se distingue do traçado por `fill-opacity`, não por cor.
      const areas = [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
        const s = getComputedStyle(p);
        const opacity = parseFloat(s.fillOpacity || '1');
        return s.fill !== 'none' && opacity > 0 && opacity < 1;
      });
      await expect(areas.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

// ─── Pie ──────────────────────────────────────────────────────────────────────

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // Override de story: a rosca não tem eixo, então o dado volta a ser a
      // lista de rótulo e valor — e são as fatias, não os meses.
      source: {
        transform: chartSourceWith({
          type: 'pie',
          data: 'rosca',
          height: 280,
          'aria-label': 'Distribuição de acessos por dispositivo: desktop, mobile e tablet',
        }),
      },
      description: {
        story: 'Tipo pie (rosca) — composição de um total. Limite a cinco ou seis fatias para continuar legível.',
      },
    },
  },
  render: () => createChart({
    data: pieData,
    type: 'pie',
    height: 280,
    class: 'nds-max-w-md',
    'aria-label': 'Distribuição de acessos por dispositivo: desktop, mobile e tablet',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com uma forma por fatia', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => expect(datumFormas(root).length).toBeGreaterThanOrEqual(pieData.length),
        { timeout: 3000 },
      );
    });

    await step('A legenda escreve o nome de CADA fatia', async () => {
      // Numa rosca a fatia não tem eixo que a nomeie: sem a legenda escrita, a
      // única pista da categoria seria a cor.
      for (const ponto of pieData) {
        await expect(designEscreve(root, ponto.label)).toBe(true);
      }
    });

    await step('Cada fatia usa um token de cor distinto', async () => {
      const colors = new Set(
        datumFormas(root)
          .map((f) => getComputedStyle(f).fill)
          // A trama sobreposta entra como `url(#…)` e não é cor de série.
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(colors.size).toBeGreaterThanOrEqual(pieData.length);
    });
  },
};
