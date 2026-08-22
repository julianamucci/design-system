import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  desenhoEscreve,
  desenhoPintado,
  exigirRaiz,
  formasDeDado,
} from '@shared/testing/chart-probe';
import { createChart, type ChartType } from './chart';
import { chartSource } from './chart.source';
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
  'aria-label': string;
  title: string;
  showLegend: boolean | undefined;
  height: number;
  renderer: 'svg' | 'canvas';
  className: string;
};

// A `playgroundSource` que morava aqui virou `chartSource`, em `chart.source.ts`.
//
// Ela era uma função NÃO EXPORTADA: nenhum teste a alcançava, e os outros quatro
// arquivos de story do componente não tinham como reaproveitá-la — cada um
// seguia despejando o `outerHTML` no painel Code. O conteúdo bom dela (a chamada
// real da fábrica, e o acompanhamento dos controls em vez de um snippet fixo)
// está preservado no módulo novo, agora com teste unitário próprio.

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ChartArgs> = {
  title: 'UI/Chart',
  component: createChart as unknown as Meta<ChartArgs>['component'],
  tags: ['autodocs', 'display'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createChartDocs),
      source: { transform: chartSource },
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
    'aria-label': {
      control: 'text',
      description: 'Descrição do gráfico. Vira o nome acessível do container, que é anunciado como imagem. O apelido depreciado label continua aceito; quando os dois vêm, aria-label vence.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "título do gráfico, ou 'Gráfico'" } },
    },
    title: {
      control: 'text',
      description: 'Título VISÍVEL, desenhado acima dos eixos — outro conceito, e não sinônimo do nome acessível.',
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
    'aria-label': 'Acessos mensais no desktop, de janeiro a junho',
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
      'aria-label': args['aria-label'],
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
      await expect(raiz.getAttribute('aria-label')).toBe(args['aria-label']);
    });

    await step('O desenho sai — e sai com forma, não como casca vazia', async () => {
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(formasDeDado(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // No chart `label` era o nome acessível e `title` é o texto VISÍVEL
      // desenhado acima dos eixos: dois conceitos no mesmo arquivo. O canônico
      // entrou para o primeiro, e o antigo ficou como apelido — apagá-lo
      // quebraria chamador em silêncio, e sem asserção isso é só promessa.
      const antigo = createChart({ data: chartData, label: 'Acessos mensais' });
      await expect(antigo.getAttribute('aria-label')).toBe('Acessos mensais');

      const ambos = createChart({
        data: chartData,
        label: 'Antigo',
        'aria-label': 'Canônico',
      });
      await expect(ambos.getAttribute('aria-label')).toBe('Canônico');

      // E `title` não disputa o nome acessível: ele é o ÚLTIMO recurso, não um
      // sinônimo — quem descreve o desenho ganha dele.
      const withTitle = createChart({
        data: chartData,
        title: 'Título visível',
        'aria-label': 'Descrição do desenho',
      });
      await expect(withTitle.getAttribute('aria-label')).toBe('Descrição do desenho');
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
