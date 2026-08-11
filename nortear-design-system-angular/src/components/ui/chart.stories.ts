import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsChart, type ChartType } from './chart';
import { MESES, SERIE_UNICA } from './chart.fixtures';
import { NdsChartDocs } from '@/components/docs/ChartDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type ChartArgs = {
  type: ChartType;
  label: string;
  chartTitle: string;
  showLegend: boolean | undefined;
  showData: boolean;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `[type]`
 * ligado ao arg, que não é o que a pessoa escreve. Devolve o uso real.
 * Ver a nota em separator.stories.ts.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ChartArgs> }): string {
  const { type = 'bar', label = '', chartTitle = '', showData = false } = ctx.args ?? {};
  const linhas = [
    `<div ndsChart`,
    `  type="${type}"`,
    `  [xAxis]="meses"`,
    `  [series]="series"`,
    // O rótulo é o contrato de acessibilidade do componente: sem ele o
    // compilador reclama, e é isso que o snippet precisa mostrar.
    `  label="${label}"`,
  ];
  if (chartTitle) linhas.push(`  chartTitle="${chartTitle}"`);
  if (showData) linhas.push(`  [showData]="true"`);
  linhas.push(`></div>`);

  return `import { NdsChart } from '@/components/ui/chart';

@Component({
  imports: [NdsChart],
  template: \`
${linhas.map((l) => `    ${l}`).join('\n')}
  \`,
})
export class Exemplo {
  readonly meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  readonly series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
}`;
}

const meta: Meta<ChartArgs> = {
  title: 'UI/Chart',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsChartDocs),
      source: { transform: playgroundSource },
    },
  },
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['bar', 'line', 'area', 'pie'] satisfies ChartType[],
      description: 'Tipo do gráfico. O tipo é o dado, não um estilo.',
    },
    label: {
      control: 'text',
      description: 'Descrição do gráfico: vira o aria-label do desenho e a legenda da tabela.',
    },
    chartTitle: { control: 'text', description: 'Título desenhado acima dos eixos.' },
    showLegend: {
      control: 'boolean',
      description: 'Força mostrar ou esconder a legenda. Sem valor, aparece com mais de uma série.',
    },
    showData: {
      control: 'boolean',
      description: 'Mostra para todo mundo a tabela de dados que já existe para leitor de tela.',
    },
  },
  args: {
    type: 'bar',
    label: 'Acessos mensais no desktop, de janeiro a junho',
    chartTitle: '',
    showLegend: undefined,
    showData: false,
  },
};

export default meta;
type Story = StoryObj<ChartArgs>;

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
  render: (args) => ({
    props: { ...args, meses: MESES, series: SERIE_UNICA },
    template: `
      <div ndsChart
        [type]="type"
        [label]="label"
        [xAxis]="meses"
        [series]="series"
        [chartTitle]="chartTitle"
        [showLegend]="showLegend"
        [showData]="showData"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    // Procura pela classe, não pelo data-slot: é o que o CSS compartilhado
    // define e o que não some se outra diretiva dividir o mesmo host.
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('O desenho é anunciado como imagem, com descrição', async () => {
      const svg = chart.querySelector('svg')!;
      await expect(svg).toHaveAttribute('role', 'img');
      await expect(svg.getAttribute('aria-label')).toBe(args.label);
    });

    await step('As barras existem e têm área — o SVG não é casca vazia', async () => {
      // Também guarda o namespace: elemento SVG criado fora do namespace certo
      // fica no DOM e mede zero.
      const formas = [...chart.querySelectorAll<SVGRectElement>('rect[data-series]')];
      await expect(formas).toHaveLength(SERIE_UNICA[0].data.length);
      for (const forma of formas) {
        await expect(forma.getBoundingClientRect().width).toBeGreaterThan(0);
      }
    });

    await step('A alternativa textual traz os mesmos números', async () => {
      // O <svg> sozinho é conteúdo perdido: a tabela é o que leitor de tela lê.
      const linhas = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(linhas).toHaveLength(MESES.length);
      await expect(linhas[0].querySelector('th')?.textContent?.trim()).toBe(MESES[0]);
      await expect(linhas[0].querySelector('td')?.textContent?.trim())
        .toBe(String(SERIE_UNICA[0].data[0]));
      await expect(chart.querySelector('caption')?.textContent?.trim()).toBe(args.label);
    });
  },
};
