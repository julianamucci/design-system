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
import { dataOf, drawingOf } from './chart.fixtures';
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
const HEIGHT = 300;

/**
 * O rótulo é o contrato de acessibilidade do componente: `role="img"` sem nome
 * acessível é violação de axe, e desenho mudo é conteúdo perdido. Fica em
 * constante para a play poder comparar o VALOR — "tem o atributo" não prova que
 * o rótulo certo chegou.
 */
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
    showData: {
      control: 'boolean',
      description:
        'Mostra a tabela de dados para todo mundo. Ela existe sempre, com os mesmos números do desenho; sem esta opção, existe só para leitor de tela e para quem lê o DOM.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
    height: HEIGHT,
    showData: false,
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
  render: (args) => h(ChartContainer, { ...args, 'aria-label': LABEL }),
  play: async ({ canvasElement, step }) => {
    // Procura pela classe compartilhada, não pelo data-slot: é o que o CSS das
    // cinco stacks define e o que não some se o wrapper mudar de forma.
    const root = exigirRoot(canvasElement);

    await step('O desenho é anunciado como imagem, com descrição', async () => {
      // O papel vai no elemento do DESENHO, não no bloco em volta: no bloco ele
      // podaria a tabela de dados junto, e a alternativa textual sumiria da
      // árvore de acessibilidade.
      const design = drawingOf(root);
      await expect(design).toHaveAttribute('role', 'img');
      // O valor, não só a presença: rótulo errado passa em "tem o atributo".
      await expect(design.getAttribute('aria-label')).toBe(LABEL);
      await expect(root.getAttribute('role')).toBeNull();
    });

    await step('O desenho sai, e não é casca vazia', async () => {
      // Gráfico tem dimensão calculada: esperar o desenho existir antes de medir
      // é o que separa asserção de contrato de teste intermitente.
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await expect(datumFormas(root).length).toBeGreaterThan(0);
      await expect(root.querySelector('.nds-chart-empty')).toBeNull();
    });

    await step('O eixo escreve todas as categorias do dado', async () => {
      await waitFor(
        () => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    await step('A alternativa textual traz os mesmos números do desenho', async () => {
      // Um `<svg>` mudo é conteúdo perdido: quem lê com leitor de tela, quem
      // busca na página e quem copia o dado alcançam a TABELA, não o desenho.
      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(MONTHS.length);
      await expect(lines[0].querySelector('th')?.getAttribute('scope')).toBe('row');
      await expect(lines[0].querySelector('th')?.textContent?.trim()).toBe(MONTHS[0]);
      await expect(lines[0].querySelector('td')?.textContent?.trim())
        .toBe(String(SERIE_UNICA[0].data[0]));
      // A legenda da tabela é o mesmo texto que nomeia o desenho: uma descrição
      // para os dois, e nenhuma chance de descreverem coisas diferentes.
      await expect(root.querySelector('caption')?.textContent?.trim()).toBe(LABEL);
      await expect(root.querySelector('thead th')?.getAttribute('scope')).toBe('col');
    });

    await step('E, por padrão, ela existe só para quem lê o DOM', async () => {
      // Visível é escolha do consumidor (`showData`); presente é contrato.
      await expect(dataOf(root)).toHaveClass('nds-sr-only');
      await expect(dataOf(root).getAttribute('tabindex')).toBeNull();
    });

    await step('A altura pedida é a altura entregue', async () => {
      // Sem a prop, a única saída documentada era uma classe de altura que não
      // existe mais no CSS — e o bloco caía no piso de 200px calado.
      const height = root.getBoundingClientRect().height;
      await expect(Math.abs(height - HEIGHT)).toBeLessThanOrEqual(1);
    });
  },
};
