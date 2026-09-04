import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, CHART_EMPTY_LABEL } from './chart';
import { chartSource } from './chart.source';
import { ChartDocs } from '@/components/docs/ChartDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { designEscreve, designPintado, exigirRoot } from '@shared/testing/chart-probe';
import { dataOf, drawingOf, headerOf, rowsOf } from './chart.fixtures';

// Dados do Playground. Ficam sem `export` de propósito: em CSF todo export
// nomeado do arquivo vira story, e uma constante de dados apareceria na sidebar
// como uma story quebrada.
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const LABEL = 'Acessos mensais no desktop, de janeiro a junho';

const meta = {
  title: 'Components/Display/Chart',
  component: ChartContainer,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ChartDocs),
      source: { transform: chartSource },
    },
  },
  argTypes: {
    option: {
      control: false,
      description:
        'Objeto de configuração declarativa do gráfico — séries, eixos, dica e legenda. Use os builders auxiliares para os casos comuns.',
      table: { type: { summary: 'EChartsCoreOption' }, defaultValue: { summary: '—' } },
    },
    renderer: {
      control: 'select',
      options: ['svg', 'canvas'],
      description:
        'Tecnologia de desenho. SVG é melhor para impressão, exportação e poucos elementos; canvas para conjuntos grandes ou animação pesada.',
      table: { type: { summary: '"svg" | "canvas"' }, defaultValue: { summary: '"svg"' } },
    },
    height: {
      control: { type: 'number', min: 120, step: 20 },
      description:
        'Altura do container em pixels. Sem valor, vale o piso de altura do próprio bloco — a altura é dado do consumidor, por isso é entrada e não classe.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'piso do bloco (200px)' } },
    },
    showData: {
      control: 'boolean',
      description:
        'Mostra a tabela de dados para todo mundo. Ela é emitida sempre — escondida, existe para leitor de tela, para a busca do navegador e para quem copia; ligada, aparece abaixo do desenho.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    emptyLabel: {
      control: 'text',
      description:
        'Frase exibida no lugar do desenho quando nenhuma série tem dado. Prefira uma frase completa que oriente a próxima ação.',
      table: { type: { summary: 'string' }, defaultValue: { summary: `"${CHART_EMPTY_LABEL}"` } },
    },
    className: {
      control: 'text',
      description: 'Classes utilitárias extras do design system — largura e espaçamento.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    'aria-label': {
      control: 'text',
      description:
        'Descrição textual do gráfico. É a alternativa que o leitor de tela lê no lugar do desenho; sem ela sobra o título do objeto de configuração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'título do gráfico' } },
    },
  },
  args: {
    option: buildBarOption({ xAxis: meses, series }),
    renderer: 'svg',
    height: 300,
    showData: false,
    emptyLabel: CHART_EMPTY_LABEL,
    className: '',
    'aria-label': LABEL,
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item4',
      'visual.item1',
    ],
  },
  play: async ({ canvasElement, args, step }) => {
    // Procura pela classe do CSS compartilhado, não pelo `data-slot`: é o que o
    // design system define, e o mesmo seletor serve nas cinco stacks.
    const root = exigirRoot(canvasElement);

    await step('O desenho é anunciado como imagem, com a descrição autoral', async () => {
      await expect(root).toHaveAttribute('data-slot', 'chart');
      // O papel e o rótulo ficam no DESENHO, não no bloco. `role="img"` poda a
      // subárvore da árvore de acessibilidade: no bloco, a tabela de dados
      // ficaria escondida junto e a alternativa textual sumiria.
      await expect(root.getAttribute('role')).toBeNull();
      const drawing = drawingOf(root);
      await expect(drawing).toHaveAttribute('role', 'img');
      // Não basta "o atributo existe": o que o leitor de tela lê é o texto, e
      // um rótulo vazio passaria por qualquer verificação de presença.
      await expect(drawing.getAttribute('aria-label')).toBe(args['aria-label']);
    });

    await step('O desenho sai — o container não é casca vazia', async () => {
      // Gráfico tem dimensão calculada: medir antes de o desenho existir é o
      // caminho mais curto para um teste intermitente.
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
    });

    await step('O eixo escreve todas as categorias do dado', async () => {
      await waitFor(
        () => {
          for (const month of meses) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    await step('E a tabela de dados repete, em texto, os números do desenho', async () => {
      // Um `<svg>` mudo é conteúdo perdido: a tabela É o conteúdo, e ela sai
      // sempre — escondida para quem enxerga, presente para leitor de tela,
      // para a busca do navegador e para quem copia.
      const data = dataOf(root);
      await expect(data.className).toContain('nds-sr-only');
      // Escondida, ela não é região rolável: sem foco e sem nada para rolar,
      // seria uma armadilha de teclado anunciada a quem nem a enxerga.
      await expect(data.getAttribute('tabindex')).toBeNull();

      const caption = data.querySelector('caption');
      await expect(caption?.textContent?.trim()).toBe(args['aria-label']);

      // Cabeçalho de coluna por série, e a categoria na primeira coluna.
      await expect(headerOf(root)).toEqual(['Categoria', series[0].name]);

      // O número da tabela é o número desenhado — as duas leituras saem do
      // mesmo dado, e é isso que impede a alternativa textual de divergir.
      const rows = rowsOf(root);
      await expect(rows).toHaveLength(meses.length);
      await expect(rows.map((row) => row[0])).toEqual(meses);
      await expect(rows.map((row) => row[1])).toEqual(series[0].data.map(String));

      // Cada linha é nomeada por um `th scope="row"`; o resto é célula comum.
      for (const tr of data.querySelectorAll('tbody tr')) {
        await expect(tr.firstElementChild?.tagName).toBe('TH');
        await expect(tr.firstElementChild).toHaveAttribute('scope', 'row');
      }
      for (const th of data.querySelectorAll('thead th')) {
        await expect(th).toHaveAttribute('scope', 'col');
      }
    });

    await step('A altura pedida é a altura entregue', async () => {
      // A entrada `height` existe porque a documentação mandava, havia meses,
      // escrever uma classe que saiu do projeto e não tinha efeito nenhum. Aqui
      // se prova que a nova entrada tem: com tolerância de 1px, porque
      // arredondamento de layout não é defeito.
      const heightPedida = args.height ?? 0;
      await expect(heightPedida).toBeGreaterThan(0);
      await expect(Math.abs(root.getBoundingClientRect().height - heightPedida)).toBeLessThanOrEqual(1);
    });
  },
};
