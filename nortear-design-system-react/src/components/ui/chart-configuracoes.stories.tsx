import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';
import {
  desenhoEscreve,
  formasDeDado,
  textosDoDesenho,
} from '@shared/testing/chart-probe';
import { desenhoPronto } from './chart.fixtures';
import { chartComTituloSource, chartMultiSerieSource, chartSource } from './chart.source';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const serieUnica = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const seriesMulti = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
  { name: 'Tablet', data: [40, 60, 55, 48, 70, 66] },
];

const meta: Meta = {
  title: 'UI/Chart/Settings',
  tags: ['display'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
};
export default meta;
type Story = StoryObj;

export const WithTooltip: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: { description: { story: 'A dica do ponteiro traz o rótulo da categoria e o valor do ponto.' } },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: serieUnica })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Acessos mensais no desktop"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await desenhoPronto(canvasElement);
    const valor = String(serieUnica[0].data[0]);

    await step('O valor do ponto não está escrito no desenho', async () => {
      // Precondição da medida seguinte: se o número já aparecesse numa marca de
      // eixo, encontrá-lo depois não provaria que a dica abriu. Os dados foram
      // escolhidos para isso — 186 não cai em nenhuma marca.
      await expect(textosDoDesenho(raiz)).not.toContain(valor);
    });

    await step('Com o ponteiro sobre a barra, a dica escreve categoria e valor', async () => {
      const forma = formasDeDado(raiz)[0];
      await expect(forma).toBeDefined();
      const caixa = forma.getBoundingClientRect();
      const svg = raiz.querySelector('svg')!;

      // `userEvent.hover` não serve aqui: ele não leva coordenada, e a lib faz
      // o teste de acerto por coordenada — o ponteiro cairia em (0, 0), fora do
      // gráfico. `fireEvent.mouseMove` carrega o par clientX/clientY.
      fireEvent.mouseMove(svg, {
        clientX: caixa.left + caixa.width / 2,
        clientY: caixa.top + caixa.height / 2,
      });

      await waitFor(
        () => {
          const texto = raiz.textContent ?? '';
          expect(texto).toContain(valor);
          expect(texto).toContain(meses[0]);
        },
        { timeout: 3000 },
      );
    });
  },
};

export const WithCaption: Story = {
  parameters: {
    docs: {
      // O assunto é o que MAIS DE UMA série produz sozinha; com a série única
      // do meta a legenda nem existiria.
      source: { transform: chartMultiSerieSource },
      description: { story: 'A legenda aparece sozinha a partir da segunda série.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={280}
      aria-label="Acessos mensais por dispositivo: desktop, mobile e tablet"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await desenhoPronto(canvasElement);

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(desenhoEscreve(raiz, serie.name)).toBe(true);
    });

    await step('E há uma forma desenhada por categoria em cada série', async () => {
      // Piso, não igualdade: além das barras o desenho carrega a camada de
      // trama e o ícone da legenda, que também são formas preenchidas.
      const formas = formasDeDado(raiz);
      await expect(formas.length).toBeGreaterThanOrEqual(meses.length * seriesMulti.length);
    });
  },
};

export const MultipleSeries: Story = {
  parameters: {
    docs: {
      // Título dentro da configuração E rótulo autoral: dois textos com papéis
      // diferentes, e o snippet precisa mostrar os dois convivendo.
      source: { transform: chartComTituloSource },
      description: { story: 'Multi-série com título dentro do desenho — o caso típico de painel analítico.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({
        xAxis: meses,
        series: seriesMulti,
        title: 'Acessos por dispositivo',
      })}
      className="nds-max-w-lg"
      height={300}
      aria-label="Acessos por dispositivo, de janeiro a junho"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const raiz = await desenhoPronto(canvasElement);

    await step('O título passado na configuração é escrito acima dos eixos', async () => {
      await expect(desenhoEscreve(raiz, 'Acessos por dispositivo')).toBe(true);
    });

    await step('O rótulo autoral vence o título — é ele que o leitor de tela lê', async () => {
      // Sem rótulo o container cairia no título do gráfico; com rótulo, o texto
      // autoral prevalece, e é isso que separa descrição de acessibilidade de
      // título visual.
      await expect(raiz.getAttribute('aria-label')).toBe('Acessos por dispositivo, de janeiro a junho');
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(desenhoEscreve(raiz, serie.name)).toBe(true);
    });
  },
};
