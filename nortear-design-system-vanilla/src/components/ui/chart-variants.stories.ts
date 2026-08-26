import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import { getInstanceByDom } from 'echarts/core';
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

/**
 * Séries já resolvidas pela lib, lidas da instância montada no desenho.
 *
 * Serve para o que é decisão de configuração e não vira nó do DOM: o símbolo de
 * ponto de cada série. O que vira pixel continua sendo medido no DOM logo
 * abaixo — option verde com desenho errado é exatamente o portão sem dentes.
 */
function resolvedSeries(root: HTMLElement): Record<string, unknown>[] {
  const canvas = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!canvas) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  const instance = getInstanceByDom(canvas);
  if (!instance) throw new Error('a lib ainda não montou a instância no desenho');
  return (instance.getOption() as unknown as { series: Record<string, unknown>[] }).series;
}

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

    await step('As séries se distinguem por FORMA, não só por cor', async () => {
      // WCAG 1.4.1 — retirando toda a cor, a linha de cima ainda se separa da
      // de baixo. A trama do decal não alcança traçado (ela é de
      // preenchimento), então quem carrega a distinção aqui é o símbolo de
      // ponto próprio de cada série.
      const series = resolvedSeries(root);
      await expect(series).toHaveLength(SERIES_MULTI.length);
      const symbols = series.map((s) => String(s['symbol']));
      await expect(new Set(symbols).size).toBe(SERIES_MULTI.length);
    });

    await step('E o traço próprio chega ao desenho, não fica só na configuração', async () => {
      // Option verde com desenho errado é portão sem dentes: a série tracejada
      // tem de sair com `stroke-dasharray` no nó.
      const dashes = tracados(root).map((t) => t.getAttribute('stroke-dasharray'));
      await expect(new Set(dashes).size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
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

    await step('E a tabela repete os mesmos números, série por série', async () => {
      // Uma coluna por série mais a das categorias: o desenho e a alternativa
      // textual saem da mesma normalização, e é isso que os mantém iguais.
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', ...SERIES_MULTI.map((s) => s.name)]);

      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(MONTHS.length);
      const values = [...lines[0].querySelectorAll('td')].map((c) => c.textContent?.trim());
      await expect(values).toEqual(SERIES_MULTI.map((s) => String(s.data[0])));
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

    await step('A tabela traz valor E participação de cada fatia', async () => {
      // Numa rosca a informação está na ÁREA da fatia, e área não se lê em
      // texto: sem a coluna de participação, a alternativa textual perderia
      // justamente o que o desenho comunica.
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', 'Valor', 'Participação']);

      const total = pieData.reduce((sum, p) => sum + p.value, 0);
      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(pieData.length);
      for (const [i, line] of lines.entries()) {
        await expect(line.querySelector('th')?.textContent?.trim()).toBe(pieData[i].label);
        const cells = [...line.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells[0]).toBe(String(pieData[i].value));
        await expect(cells[1]).toBe(`${Math.round((pieData[i].value / total) * 1000) / 10}%`);
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
