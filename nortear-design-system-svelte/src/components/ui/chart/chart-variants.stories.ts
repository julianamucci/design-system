import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption, buildFunnelOption,
} from './index';
import {
  designEscreve, exigirRoot, datumFormas, tramasAplicadas,
} from '@shared/testing/chart-probe';
import { drawingSettled, waitForDesign } from './chart.fixtures';
import {
  chartAreaSource,
  chartBarrasSource,
  chartFunnelSource,
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

/**
 * Etapas de um processo, da entrada à saída.
 *
 * A ordem é a do percurso, não a do valor, e é ela que dá sentido à coluna de
 * participação: 100%, 62%, 26% e 9% da PRIMEIRA etapa.
 */
const FUNNEL_STAGES = [
  { label: 'Visitas', value: 1000 },
  { label: 'Cadastros', value: 620 },
  { label: 'Carrinho', value: 260 },
  { label: 'Compra', value: 90 },
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

/**
 * Largura de cada faixa do funil, de cima para baixo.
 *
 * Cada faixa chega ao DOM como DUAS formas sobrepostas — a cor e a trama —, com
 * a mesma geometria; agrupar pelo centro em y junta o par e devolve uma medida
 * por etapa, sem depender da ordem em que a lib emite os nós.
 *
 * Os ícones da legenda entram na mesma varredura de propósito: o `<svg>` do
 * zrender é PLANO, a legenda não é subárvore, e filtrá-los por tamanho seria
 * cravar um limiar. Eles são desenhados abaixo do funil (`legend.bottom: 0`
 * contra `series.bottom: 48`), então ordenar por y e tomar as `count` primeiras
 * faixas deixa a fileira de ícones de fora sem precisar reconhecê-la.
 *
 * `getBoundingClientRect` e não `getBBox`: os caminhos de dentro do `<pattern>`
 * da trama também casam o seletor, e só o primeiro os enxerga como zero.
 */
function bandWidths(root: HTMLElement, count: number): number[] {
  const byCenter = new Map<number, number>();
  for (const forma of datumFormas(root)) {
    const box = forma.getBoundingClientRect();
    if (box.width === 0) continue;
    const center = Math.round(box.y + box.height / 2);
    byCenter.set(center, Math.max(byCenter.get(center) ?? 0, box.width));
  }
  return [...byCenter.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, count)
    .map(([, width]) => width);
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

    await step('As séries se distinguem por FORMA, não só por cor', async () => {
      // A trama do decal cumpre a WCAG 1.4.1 onde há área para tramar — barra e
      // fatia. A linha não tem área, e é aqui que a outra metade do critério se
      // cumpre: símbolo de ponto próprio e desenho de traço próprio por série.
      // Retirada toda a cor, o gráfico continua legível.
      const option = buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }) as {
        series: { symbol?: unknown; lineStyle?: { type?: unknown } }[];
      };
      const symbols = option.series.map((one) => String(one.symbol));
      await expect(new Set(symbols).size).toBe(SERIES_MULTI.length);
      const dashes = option.series.map((one) => JSON.stringify(one.lineStyle?.type));
      await expect(new Set(dashes).size).toBe(SERIES_MULTI.length);
    });

    await step('E o traço distinto chega ao desenho, não fica só na configuração', async () => {
      // Configuração verde com desenho errado é portão sem dentes: a série
      // tracejada tem de sair com stroke-dasharray no nó. getComputedStyle, e
      // não o atributo: o desenho do traço pode chegar por atributo ou por
      // estilo, e ler só um dos dois é medir meio caminho.
      const drawn = [...root.querySelectorAll<SVGPathElement>('svg path')]
        .filter((p) => getComputedStyle(p).fill === 'none')
        .map((p) => getComputedStyle(p).strokeDasharray);
      await expect(new Set(drawn).size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
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

export const Funnel: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      source: { transform: chartFunnelSource },
      description: {
        story: 'Funil — etapas de um processo que afunila. A largura de cada faixa é a participação dela em relação à primeira etapa.',
      },
    },
  },
  args: {
    option: buildFunnelOption({ data: FUNNEL_STAGES }),
    height: 280,
    class: 'nds-w-full',
    shareLabel: 'Participação',
    'aria-label': 'Funil de conversão: visitas, cadastros, carrinho e compra',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('A legenda escreve o nome de CADA etapa', async () => {
      // A faixa não tem eixo que a nomeie e não leva rótulo por dentro: sem a
      // legenda escrita, a única pista da etapa seria a cor.
      await waitFor(() => {
        for (const stage of FUNNEL_STAGES) {
          expect(designEscreve(root, stage.label)).toBe(true);
        }
      }, { timeout: 3000 });
    });

    await step('Uma faixa desenhada por etapa, no mínimo', async () => {
      await expect(datumFormas(root).length).toBeGreaterThanOrEqual(FUNNEL_STAGES.length);
    });

    await step('As faixas afunilam, e a largura de cada uma é a participação', async () => {
      // A largura é o que o desenho comunica, e a coluna de participação é o
      // que a escreve — as duas medidas têm de ser a MESMA. Dentro de um
      // `waitFor` porque as faixas crescem: a lib as anima, e enquanto a
      // animação corre a largura medida ainda não é a final.
      const entry = FUNNEL_STAGES[0].value;
      await waitFor(() => {
        const widths = bandWidths(root, FUNNEL_STAGES.length);
        expect(widths).toHaveLength(FUNNEL_STAGES.length);
        for (const [i, stage] of FUNNEL_STAGES.entries()) {
          if (i > 0) expect(widths[i]).toBeLessThan(widths[i - 1]);
          // Tolerância de uma casa: o contorno de 1px engorda a caixa medida
          // nas duas pontas, e a comparação é de proporção, não de pixel.
          expect(widths[i] / widths[0]).toBeCloseTo(stage.value / entry, 1);
        }
      }, { timeout: 3000 });
    });

    await step('A tabela traz etapa, valor e participação em relação à primeira', async () => {
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', 'Valor', 'Participação']);

      const entry = FUNNEL_STAGES[0].value;
      const rows = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(FUNNEL_STAGES.length);
      for (const [i, row] of rows.entries()) {
        await expect(row.querySelector('th')?.textContent?.trim()).toBe(FUNNEL_STAGES[i].label);
        const cells = [...row.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells[0]).toBe(String(FUNNEL_STAGES[i].value));
        await expect(cells[1]).toBe(`${Math.round((FUNNEL_STAGES[i].value / entry) * 1000) / 10}%`);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança a faixa', async () => {
      // WCAG 1.4.1 — a faixa é forma PREENCHIDA, então a hachura chega nela
      // como chega à barra e à fatia. Aqui se mede que ela chegou; que ela é
      // traçada na cor do fundo, e não na lista padrão da lib, é propriedade do
      // tema compartilhado pelos tipos e está medida na story de contraste
      // gráfico.
      await expect(tramasAplicadas(root).size).toBeGreaterThanOrEqual(1);
    });
  },
};
