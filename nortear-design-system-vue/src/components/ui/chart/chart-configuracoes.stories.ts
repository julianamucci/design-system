import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  desenhoEscreve,
  desenhoPintado,
  exigirRaiz,
  formasDeDado,
  textosDoDesenho,
} from '@shared/testing/chart-probe';
import { ChartContainer, buildBarOption } from './index';
import {
  chartComDicaSource,
  chartComLegendaSource,
  chartMultiSerieSource,
} from './chart.source';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73] }];
const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile',  data: [80, 200, 120, 190] },
  { name: 'Tablet',  data: [40, 90, 60, 100] },
];
const TITULO = 'Acessos por dispositivo';

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartComDicaSource } },
  },
  title: 'UI/Chart/Settings',
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const WithTooltip: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: { description: { story: 'Ponteiro sobre um ponto de dado — a dica traz a categoria e o valor.' } },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MESES, series: SERIE_UNICA }),
    height: 240,
    'aria-label': 'Acessos mensais no desktop',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);
    await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });

    await step('A dica aparece com o nome da série e o valor do ponto', async () => {
      const forma = formasDeDado(raiz)[0];
      await expect(forma).toBeDefined();

      const caixa = forma.getBoundingClientRect();
      const desenho = raiz.querySelector('svg')!;
      // `userEvent.hover` não serve aqui: ele não carrega coordenada, e a lib
      // faz o acerto do alvo por coordenada — o ponteiro cairia em (0,0), fora
      // do desenho, e a dica nunca abriria. Daí o evento cru, com posição.
      // `pointerMove` vem primeiro porque é o que a lib escuta em navegador com
      // PointerEvent; o de mouse fica como rede para o caso contrário.
      const posicao = {
        clientX: caixa.left + caixa.width / 2,
        clientY: caixa.top + caixa.height / 2,
        bubbles: true,
      };
      fireEvent.pointerMove(desenho, posicao);
      fireEvent.mouseMove(desenho, posicao);

      await waitFor(
        () => {
          const texto = raiz.textContent ?? '';
          // Com uma série só não há legenda: o nome da série não está escrito em
          // nenhum outro lugar da tela, então encontrá-lo prova que é a dica.
          expect(texto).toContain(SERIE_UNICA[0].name);
          // E os valores não coincidem com nenhuma marca do eixo, que é redonda.
          expect(SERIE_UNICA[0].data.some((v) => texto.includes(String(v)))).toBe(true);
        },
        { timeout: 3000 },
      );
    });
  },
};

export const WithCaption: Story = {
  parameters: {
    // A legenda automática só aparece com mais de uma série: o dado literal do
    // snippet É a lição, e a do meta traz uma série só.
    docs: {
      source: { transform: chartComLegendaSource },
      description: { story: 'Com mais de uma série, a legenda entra sozinha.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MESES, series: SERIES_MULTI }),
    height: 280,
    'aria-label': 'Acessos mensais por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);

    await step('A legenda nomeia cada série', async () => {
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => {
          for (const serie of SERIES_MULTI) expect(textosDoDesenho(raiz)).toContain(serie.name);
        },
        { timeout: 3000 },
      );
    });

    await step('E o eixo continua escrevendo as categorias', async () => {
      for (const mes of MESES) {
        await expect(desenhoEscreve(raiz, mes)).toBe(true);
      }
    });
  },
};

export const MultipleSeries: Story = {
  parameters: {
    // O título entra dentro do option, e não como elemento em volta: é a opção
    // do builder que o snippet precisa mostrar.
    docs: {
      source: { transform: chartMultiSerieSource },
      description: { story: 'Multi-série com título no próprio option — o caso típico de painel.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MESES, series: SERIES_MULTI, title: TITULO }),
    height: 300,
    'aria-label': 'Acessos mensais por dispositivo, de janeiro a abril',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);

    await step('O título do option é desenhado junto do gráfico', async () => {
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(desenhoEscreve(raiz, TITULO)).toBe(true), { timeout: 3000 });
    });

    await step('Cada série usa um token de cor distinto', async () => {
      // A trama entra como preenchimento `url(#…)`; tirando essas, o que sobra
      // são as cores de série de verdade.
      const cores = new Set(
        formasDeDado(raiz)
          .map((forma) => getComputedStyle(forma).fill)
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(cores.size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });
  },
};
