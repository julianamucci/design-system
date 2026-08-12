import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, CHART_EMPTY_LABEL } from './chart';
import { ChartDocs } from '@/components/docs/ChartDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { desenhoEscreve, desenhoPintado, exigirRaiz } from '@shared/testing/chart-probe';

// Dados do Playground. Ficam sem `export` de propósito: em CSF todo export
// nomeado do arquivo vira story, e uma constante de dados apareceria na sidebar
// como uma story quebrada.
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const ROTULO = 'Acessos mensais no desktop, de janeiro a junho';

type ChartArgs = ComponentProps<typeof ChartContainer>;

/**
 * O painel Code imprimiria a chamada com o espalhamento dos args, que não é o
 * que ninguém escreve. Aqui o trecho é remontado a partir dos controls, então
 * ele acompanha o que a pessoa mexeu em vez de congelar num texto fixo.
 */
function fonteDoPlayground(_gerado: string, ctx: { args: ChartArgs }): string {
  const { renderer, height, emptyLabel, className } = ctx.args;
  const linhas = ['<ChartContainer', '  option={buildBarOption({ xAxis: meses, series })}'];
  if (height !== undefined) linhas.push(`  height={${height}}`);
  if (renderer && renderer !== 'svg') linhas.push(`  renderer="${renderer}"`);
  if (emptyLabel && emptyLabel !== CHART_EMPTY_LABEL) linhas.push(`  emptyLabel="${emptyLabel}"`);
  if (className) linhas.push(`  className="${className}"`);
  // O rótulo é o contrato de acessibilidade do componente: sem ele o desenho
  // não é anunciado, e é isso que o trecho precisa mostrar.
  linhas.push(`  aria-label="${ctx.args['aria-label'] ?? ''}"`, '/>');

  return `import { ChartContainer, buildBarOption } from '@/components/ui/chart';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];

${linhas.join('\n')}`;
}

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ChartDocs),
      source: { transform: fonteDoPlayground },
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
    emptyLabel: CHART_EMPTY_LABEL,
    className: '',
    'aria-label': ROTULO,
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
    const raiz = exigirRaiz(canvasElement);

    await step('O desenho é anunciado como imagem, com a descrição autoral', async () => {
      await expect(raiz).toHaveAttribute('data-slot', 'chart');
      await expect(raiz).toHaveAttribute('role', 'img');
      // Não basta "o atributo existe": o que o leitor de tela lê é o texto, e
      // um rótulo vazio passaria por qualquer verificação de presença.
      await expect(raiz.getAttribute('aria-label')).toBe(args['aria-label']);
    });

    await step('O desenho sai — o container não é casca vazia', async () => {
      // Gráfico tem dimensão calculada: medir antes de o desenho existir é o
      // caminho mais curto para um teste intermitente.
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
    });

    await step('O eixo escreve todas as categorias do dado', async () => {
      await waitFor(
        () => {
          for (const mes of meses) expect(desenhoEscreve(raiz, mes)).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    await step('A altura pedida é a altura entregue', async () => {
      // A entrada `height` existe porque a documentação mandava, havia meses,
      // escrever uma classe que saiu do projeto e não tinha efeito nenhum. Aqui
      // se prova que a nova entrada tem: com tolerância de 1px, porque
      // arredondamento de layout não é defeito.
      const alturaPedida = args.height ?? 0;
      await expect(alturaPedida).toBeGreaterThan(0);
      await expect(Math.abs(raiz.getBoundingClientRect().height - alturaPedida)).toBeLessThanOrEqual(1);
    });
  },
};
