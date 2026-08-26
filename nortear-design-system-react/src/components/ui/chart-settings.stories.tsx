import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';
import {
  designEscreve,
  datumFormas,
  designTexts,
} from '@shared/testing/chart-probe';
import { dataOf, designPronto, drawingOf, headerOf, rowsOf } from './chart.fixtures';
import {
  chartWithTitleSource,
  chartMultiSerieSource,
  chartSource,
  chartVisibleDataSource,
} from './chart.source';

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
    const root = await designPronto(canvasElement);
    const value = String(serieUnica[0].data[0]);

    await step('O valor do ponto não está escrito no desenho', async () => {
      // Precondição da medida seguinte: se o número já aparecesse numa marca de
      // eixo, encontrá-lo depois não provaria que a dica abriu. Os dados foram
      // escolhidos para isso — 186 não cai em nenhuma marca.
      await expect(designTexts(root)).not.toContain(value);
    });

    await step('Com o ponteiro sobre a barra, a dica escreve categoria e valor', async () => {
      const forma = datumFormas(root)[0];
      await expect(forma).toBeDefined();
      const box = forma.getBoundingClientRect();
      const svg = root.querySelector('svg')!;

      // `userEvent.hover` não serve aqui: ele não leva coordenada, e a lib faz
      // o teste de acerto por coordenada — o ponteiro cairia em (0, 0), fora do
      // gráfico. `fireEvent.mouseMove` carrega o par clientX/clientY.
      fireEvent.mouseMove(svg, {
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
      });

      // A leitura é do DESENHO, não do bloco. A tabela de dados mora no bloco e
      // traz os mesmos números por escrito: procurar o valor no bloco inteiro
      // encontraria a tabela e passaria com ou sem dica — portão sem dentes.
      // A lib insere a dica dentro do elemento em que desenha, então é ali que
      // ela aparece.
      const drawing = drawingOf(root);
      await waitFor(
        () => {
          const text = drawing.textContent ?? '';
          expect(text).toContain(value);
          expect(text).toContain(meses[0]);
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
    const root = await designPronto(canvasElement);

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(root, serie.name)).toBe(true);
    });

    await step('E há uma forma desenhada por categoria em cada série', async () => {
      // Piso, não igualdade: além das barras o desenho carrega a camada de
      // trama e o ícone da legenda, que também são formas preenchidas.
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThanOrEqual(meses.length * seriesMulti.length);
    });
  },
};

/**
 * A tabela de dados à vista.
 *
 * Ela é emitida SEMPRE — o que esta entrada decide é se quem enxerga também a
 * vê. Serve para painel impresso, para conferência de número e para quem
 * simplesmente prefere ler o dado a estimá-lo no desenho.
 */
export const VisibleData: Story = {
  parameters: {
    docs: {
      // O assunto é uma entrada que o snippet do meta não passa; sem ela na
      // chamada, o exemplo ensinaria o contrário do que a story mostra.
      source: { transform: chartVisibleDataSource },
      description: {
        story: 'A alternativa textual à vista: os mesmos números do desenho, em tabela.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={260}
      showData
      aria-label="Acessos mensais por dispositivo: desktop, mobile e tablet"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);
    const data = dataOf(root);

    await step('A tabela está à vista, e não escondida do leitor comum', async () => {
      await expect(data.className).not.toContain('nds-sr-only');
      await expect(data.className).toContain('nds-table-wrapper');
      // Medida, não classe: uma caixa de 1px continuaria escondida com a classe
      // certa. O que prova que a tabela aparece é ela ocupar espaço na tela.
      await expect(data.getBoundingClientRect().height).toBeGreaterThan(50);
    });

    await step('À vista, a caixa que rola é alcançável por teclado', async () => {
      // Região rolável precisa de foco (scrollable-region-focusable). Escondida
      // ela NÃO leva `tabindex`: seria uma parada de teclado sem nada para
      // rolar, num elemento que ninguém enxerga.
      await expect(data).toHaveAttribute('tabindex', '0');
    });

    await step('E o bloco cresce para caber a tabela, em vez de recortá-la', async () => {
      // A altura pedida é do DESENHO. Se ela fosse do bloco, a tabela cairia
      // fora dele e o `overflow: hidden` de `.nds-chart` a esconderia — a
      // entrada de acessibilidade ligada e nada na tela.
      const drawing = drawingOf(root);
      await expect(Math.abs(drawing.getBoundingClientRect().height - 260)).toBeLessThanOrEqual(1);
      await expect(root.getBoundingClientRect().height).toBeGreaterThan(
        drawing.getBoundingClientRect().height,
      );
    });

    await step('E ela traz os mesmos números do desenho', async () => {
      await expect(headerOf(root)).toEqual(['Categoria', ...seriesMulti.map((s) => s.name)]);
      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(meses);
      for (const [iSeries, serie] of seriesMulti.entries()) {
        await expect(rows.map((row) => row[iSeries + 1])).toEqual(serie.data.map(String));
      }
    });
  },
};

export const MultipleSeries: Story = {
  parameters: {
    docs: {
      // Título dentro da configuração E rótulo autoral: dois textos com papéis
      // diferentes, e o snippet precisa mostrar os dois convivendo.
      source: { transform: chartWithTitleSource },
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
    const root = await designPronto(canvasElement);

    await step('O título passado na configuração é escrito acima dos eixos', async () => {
      await expect(designEscreve(root, 'Acessos por dispositivo')).toBe(true);
    });

    await step('O rótulo autoral vence o título — é ele que o leitor de tela lê', async () => {
      // Sem rótulo o container cairia no título do gráfico; com rótulo, o texto
      // autoral prevalece, e é isso que separa descrição de acessibilidade de
      // título visual. O rótulo mora no DESENHO: no bloco, o papel de imagem
      // podaria a tabela de dados da árvore de acessibilidade.
      await expect(drawingOf(root).getAttribute('aria-label')).toBe(
        'Acessos por dispositivo, de janeiro a junho',
      );
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(root, serie.name)).toBe(true);
    });
  },
};
