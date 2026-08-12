import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  desenhoEscreve,
  desenhoPintado,
  exigirRaiz,
  formasDeDado,
} from '@shared/testing/chart-probe';
import { createChart, type ChartType } from './chart';
import { createChartDocs } from '@/components/docs/ChartDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const chartData = MESES.map((label, i) => ({
  label,
  value: [186, 305, 237, 73, 209, 214][i],
}));

// ─── Args ─────────────────────────────────────────────────────────────────────

type ChartArgs = {
  type: ChartType;
  label: string;
  title: string;
  showLegend: boolean | undefined;
  height: number;
  renderer: 'svg' | 'canvas';
  className: string;
};

/**
 * O painel Code de uma factory imprime a chamada gerada pelo renderer, que não
 * é o que a pessoa escreve. `transform` devolve o uso real e — o que importa
 * mais — acompanha os controls: código fixo mentiria assim que alguém mexesse
 * no primeiro seletor.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ChartArgs> }): string {
  const a = ctx.args ?? {};
  const linhas = [
    `  data: acessosMensais,`,
    `  type: '${a.type ?? 'bar'}',`,
    `  label: '${a.label ?? ''}',`,
  ];
  if (a.title) linhas.push(`  title: '${a.title}',`);
  if (a.showLegend !== undefined) linhas.push(`  showLegend: ${a.showLegend},`);
  if (a.height) linhas.push(`  height: ${a.height},`);
  if (a.renderer && a.renderer !== 'svg') linhas.push(`  renderer: '${a.renderer}',`);
  if (a.className) linhas.push(`  class: '${a.className}',`);

  return `import { createChart } from '@/components/ui/chart';

const acessosMensais = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];

const grafico = createChart({
${linhas.join('\n')}
});

document.body.appendChild(grafico);`;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ChartArgs> = {
  title: 'UI/Chart',
  component: createChart as unknown as Meta<ChartArgs>['component'],
  tags: ['autodocs', 'display'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createChartDocs),
      source: { transform: playgroundSource },
    },
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['bar', 'line', 'area', 'pie'] satisfies ChartType[],
      description: 'Tipo do gráfico. Quem escolhe é o dado, não o estilo.',
      table: { type: { summary: "'bar' | 'line' | 'area' | 'pie'" }, defaultValue: { summary: "'bar'" } },
    },
    label: {
      control: 'text',
      description: 'Descrição do gráfico. Vira o aria-label do container, que é anunciado como imagem.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "título do gráfico, ou 'Gráfico'" } },
    },
    title: {
      control: 'text',
      description: 'Título desenhado acima dos eixos.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    showLegend: {
      control: 'boolean',
      description: 'Força mostrar ou esconder a legenda. Sem valor, ela aparece com mais de uma série.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'mais de uma série' } },
    },
    height: {
      control: { type: 'range', min: 120, max: 480, step: 10 },
      description: 'Altura do container em pixels. Sem valor, vale o piso de altura do próprio bloco.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '200 (piso do CSS)' } },
    },
    renderer: {
      control: 'inline-radio',
      options: ['svg', 'canvas'],
      description: 'Tecnologia de desenho. SVG serve melhor a impressão e exportação; canvas, a volumes grandes.',
      table: { type: { summary: "'svg' | 'canvas'" }, defaultValue: { summary: "'svg'" } },
    },
    className: {
      control: 'text',
      name: 'class',
      description: 'Classes adicionais no container. Use para largura e espaçamento; a altura tem entrada própria.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    type: 'bar',
    label: 'Acessos mensais no desktop, de janeiro a junho',
    title: '',
    showLegend: undefined,
    height: 240,
    renderer: 'svg',
    className: 'nds-max-w-md',
  },
};

export default meta;
type Story = StoryObj<ChartArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
  render: (args) =>
    createChart({
      data: chartData,
      type: args.type,
      label: args.label,
      title: args.title || undefined,
      showLegend: args.showLegend,
      height: args.height,
      renderer: args.renderer,
      class: args.className || undefined,
    }),
  play: async ({ canvasElement, step, args }) => {
    // Procura pela classe, e não pelo data-slot: `.nds-chart` é o que o CSS
    // compartilhado define, e é o contrato que as cinco stacks têm em comum.
    const raiz = exigirRaiz(canvasElement);

    await step('O desenho é anunciado como imagem, com a descrição da story', async () => {
      await expect(raiz.dataset.slot).toBe('chart');
      await expect(raiz.getAttribute('role')).toBe('img');
      // A descrição EXATA, não "existe o atributo": um aria-label vazio ou
      // genérico passaria pelo teste de presença e não descreveria nada.
      await expect(raiz.getAttribute('aria-label')).toBe(args.label);
    });

    await step('O desenho sai — e sai com forma, não como casca vazia', async () => {
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(formasDeDado(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      // A marca de eixo é a alternativa textual do valor: categoria que o
      // desenho não escreve é dado que só existe como pixel.
      for (const mes of MESES) {
        await expect(desenhoEscreve(raiz, mes)).toBe(true);
      }
    });
  },
};
