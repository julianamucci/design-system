import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption,
} from './index';
import {
  desenhoEscreve, desenhoPintado, exigirRaiz, formasDeDado,
} from '@shared/testing/chart-probe';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr'];
const VALORES = [186, 305, 237, 73];
const SERIE_UNICA = [{ name: 'Vendas', data: VALORES }];
const SERIES_MULTI = [
  { name: 'Desktop', data: VALORES },
  { name: 'Mobile', data: [80, 200, 120, 190] },
];
const DADOS_DISPOSITIVO = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Variants',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

/** Espera o desenho sair antes de qualquer medição. */
async function aguardarDesenho(raiz: HTMLElement) {
  await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
}

/**
 * Alturas das colunas de barra, na ordem do eixo.
 *
 * Cada barra chega ao DOM como DUAS formas sobrepostas — a cor e a trama —, com
 * a mesma geometria. Agrupar pelo centro em x junta o par e devolve uma medida
 * por categoria, sem depender da ordem em que a lib emite os nós.
 */
function alturasPorCategoria(raiz: HTMLElement): number[] {
  const porCentro = new Map<number, number>();
  for (const forma of formasDeDado(raiz)) {
    const r = forma.getBoundingClientRect();
    const centro = Math.round(r.x + r.width / 2);
    porCentro.set(centro, Math.max(porCentro.get(centro) ?? 0, r.height));
  }
  return [...porCentro.entries()].sort((a, b) => a[0] - b[0]).map(([, altura]) => altura);
}

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: { description: { story: 'Barras — comparação entre categorias discretas.' } },
  },
  args: {
    option: buildBarOption({ xAxis: MESES, series: SERIE_UNICA }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);
    await aguardarDesenho(raiz);

    await step('Toda categoria aparece escrita no eixo', async () => {
      await waitFor(() => {
        for (const mes of MESES) expect(desenhoEscreve(raiz, mes)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('Uma coluna por mês, com altura proporcional ao valor', async () => {
      // Dentro do `waitFor` porque as barras CRESCEM: a lib anima a altura a
      // partir da linha de base, e enquanto a animação corre a ordem medida
      // ainda não é a ordem final. Compara ORDEM, não pixel — o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const maiorValor = VALORES.indexOf(Math.max(...VALORES));
      const menorValor = VALORES.indexOf(Math.min(...VALORES));
      await waitFor(() => {
        const alturas = alturasPorCategoria(raiz);
        expect(alturas).toHaveLength(MESES.length);
        expect(alturas.indexOf(Math.max(...alturas))).toBe(maiorValor);
        expect(alturas.indexOf(Math.min(...alturas))).toBe(menorValor);
      }, { timeout: 3000 });
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: { description: { story: 'Linhas — tendência ao longo de uma sequência contínua.' } },
  },
  args: {
    option: buildLineOption({ xAxis: MESES, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);
    await aguardarDesenho(raiz);

    await step('Uma linha traçada por série', async () => {
      // O traçado é o caminho SEM preenchimento; o `C` no comando separa a
      // curva da série das linhas de grade, que também são `fill: none` mas
      // vão de um ponto a outro em reta.
      const tracos = [...raiz.querySelectorAll<SVGPathElement>('svg path')].filter(
        (p) => getComputedStyle(p).fill === 'none' && (p.getAttribute('d') ?? '').includes('C'),
      );
      await expect(tracos).toHaveLength(SERIES_MULTI.length);
      for (const traco of tracos) {
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A legenda nomeia cada série, e o eixo traz as categorias', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(desenhoEscreve(raiz, serie.name)).toBe(true);
      }
      for (const mes of MESES) await expect(desenhoEscreve(raiz, mes)).toBe(true);
    });
  },
};

export const Area: Story = {
  parameters: {
    docs: { description: { story: 'Área — linha com a região sob ela preenchida, para volume acumulado.' } },
  },
  args: {
    option: buildAreaOption({ xAxis: MESES, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);
    await aguardarDesenho(raiz);

    await step('Cada série tem traçado E região preenchida', async () => {
      const caminhos = [...raiz.querySelectorAll<SVGPathElement>('svg path')];
      const tracos = caminhos.filter(
        (p) => getComputedStyle(p).fill === 'none' && (p.getAttribute('d') ?? '').includes('C'),
      );
      await expect(tracos).toHaveLength(SERIES_MULTI.length);

      // A região é o que distingue a área da linha: preenchida, e translúcida
      // para não esconder a série de baixo.
      const regioes = caminhos.filter((p) => {
        const s = getComputedStyle(p);
        const opacidade = Number(s.fillOpacity);
        return s.fill !== 'none' && opacidade > 0 && opacidade < 1;
      });
      await expect(regioes.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('As categorias continuam escritas no eixo', async () => {
      for (const mes of MESES) await expect(desenhoEscreve(raiz, mes)).toBe(true);
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { description: { story: 'Pizza (rosca) — composição de um total entre poucas partes.' } },
  },
  args: {
    option: buildPieOption({ data: DADOS_DISPOSITIVO }),
    height: 280,
    class: 'nds-w-full',
    'aria-label': 'Distribuição de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);
    await aguardarDesenho(raiz);

    await step('A legenda escreve o nome de cada fatia — a cor não é o único sinal', async () => {
      await waitFor(() => {
        for (const ponto of DADOS_DISPOSITIVO) {
          expect(desenhoEscreve(raiz, ponto.label)).toBe(true);
        }
      }, { timeout: 3000 });
    });

    await step('Uma forma desenhada por fatia, no mínimo', async () => {
      await expect(formasDeDado(raiz).length).toBeGreaterThanOrEqual(DADOS_DISPOSITIVO.length);
    });
  },
};
