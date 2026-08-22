import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  designEscreve,
  designPintado,
  exigirRoot,
  datumFormas,
} from '@shared/testing/chart-probe';
import { ChartContainer, buildBarOption } from './index';
import ChartDocs from '@/components/docs/ChartDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { chartSource } from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];

/**
 * Altura pedida pelo Playground. Vive numa constante porque a play compara o
 * tamanho medido com ela — a prop `height` existe justamente porque a
 * documentação mandava escrever uma classe de altura que não existe mais.
 */
const ALTURA = 300;

/**
 * O rótulo é o contrato de acessibilidade do componente: `role="img"` sem nome
 * acessível é violação de axe, e desenho mudo é conteúdo perdido. Fica em
 * constante para a play poder comparar o VALOR — "tem o atributo" não prova que
 * o rótulo certo chegou.
 */
const ROTULO = 'Acessos mensais no desktop, de janeiro a junho';

const meta = {
  title: 'UI/Chart',
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
        'Configuração declarativa do gráfico: séries, eixos, dica, legenda. Para os casos comuns, monte com os builders (buildBarOption, buildLineOption, buildAreaOption, buildPieOption).',
      table: { type: { summary: 'EChartsCoreOption' } },
    },
    renderer: {
      control: 'select',
      options: ['svg', 'canvas'],
      description:
        'Tecnologia de desenho. svg imprime e exporta melhor e é o padrão; canvas aguenta mais elementos e animação pesada.',
      table: { type: { summary: "'svg' | 'canvas'" }, defaultValue: { summary: "'svg'" } },
    },
    height: {
      control: { type: 'number', min: 80, step: 20 },
      description:
        'Altura do container em pixels. Sem valor, vale o piso de altura do próprio bloco.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    emptyLabel: {
      control: 'text',
      description:
        'Frase mostrada no lugar do desenho quando nenhuma série tem dado. Use uma frase completa, que oriente a próxima ação.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Sem dados para exibir'" } },
    },
    class: {
      control: false,
      description:
        'Classes .nds-* extras no container. Use para largura e espaçamento; a altura tem prop própria.',
      table: { type: { summary: 'string' } },
    },
    // A chave é o nome da prop; `name` é como se escreve no template. Storybook
    // casa argTypes com args pela chave, e a prop declarada é `ariaLabel`.
    ariaLabel: {
      name: 'aria-label',
      control: false,
      description:
        'Descrição do desenho para leitor de tela. Sem valor, cai no título do option e, por último, numa palavra genérica.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    renderer: 'svg' as const,
    height: ALTURA,
    emptyLabel: 'Nenhum dado disponível para o período selecionado.',
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
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
  },
  render: (args) => h(ChartContainer, { ...args, 'aria-label': ROTULO }),
  play: async ({ canvasElement, step }) => {
    // Procura pela classe compartilhada, não pelo data-slot: é o que o CSS das
    // cinco stacks define e o que não some se o wrapper mudar de forma.
    const raiz = exigirRoot(canvasElement);

    await step('O desenho é anunciado como imagem, com descrição', async () => {
      await expect(raiz).toHaveAttribute('role', 'img');
      // O valor, não só a presença: rótulo errado passa em "tem o atributo".
      await expect(raiz.getAttribute('aria-label')).toBe(ROTULO);
    });

    await step('O desenho sai, e não é casca vazia', async () => {
      // Gráfico tem dimensão calculada: esperar o desenho existir antes de medir
      // é o que separa asserção de contrato de teste intermitente.
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await expect(datumFormas(raiz).length).toBeGreaterThan(0);
      await expect(raiz.querySelector('.nds-chart-empty')).toBeNull();
    });

    await step('O eixo escreve todas as categorias do dado', async () => {
      await waitFor(
        () => {
          for (const mes of MONTHS) expect(designEscreve(raiz, mes)).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    await step('A altura pedida é a altura entregue', async () => {
      // Sem a prop, a única saída documentada era uma classe de altura que não
      // existe mais no CSS — e o bloco caía no piso de 200px calado.
      const altura = raiz.getBoundingClientRect().height;
      await expect(Math.abs(altura - ALTURA)).toBeLessThanOrEqual(1);
    });
  },
};
