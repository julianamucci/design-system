import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, CHART_EMPTY_LABEL } from './index';
import { dataOf, drawingOf } from './chart.fixtures';
import {
  designEscreve, designPintado, exigirRoot, datumFormas,
} from '@shared/testing/chart-probe';
import ChartDocs from '@/components/docs/ChartDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { chartSource } from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Vendas', data: [186, 305, 237, 73, 209, 214] }];

const LABEL = 'Acessos mensais no desktop, de janeiro a junho';

const meta: Meta = {
  title: 'Primitives/Display/Chart',
  component: ChartContainer,
  tags: ['autodocs', 'display'],
  parameters: {
    // `padded` e não `centered`: o container do gráfico é `width: 100%` e num
    // wrapper centralizado ele mede a si mesmo antes de ter largura.
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ChartDocs),
      // O painel Code não tem docgen no Svelte (desligado no
      // `.storybook/main.ts`), e sem `transform` o gerador monta a tag a partir
      // do nome interno da função compilada. O snippet vai montado a partir dos
      // args, para acompanhar os controls.
      source: { transform: chartSource },
    },
  },
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes.
  argTypes: {
    option: {
      control: false,
      description:
        'Objeto de configuração declarativa do gráfico: séries, eixos, dica do ponteiro, legenda. Monte com os builders auxiliares nos casos típicos.',
      table: { type: { summary: 'EChartsCoreOption' } },
    },
    renderer: {
      control: 'select',
      options: ['svg', 'canvas'],
      description:
        'Tecnologia de desenho. SVG imprime, exporta e escala melhor; canvas aguenta mais elementos e animação pesada.',
      table: { type: { summary: "'svg' | 'canvas'" }, defaultValue: { summary: "'svg'" } },
    },
    height: {
      control: { type: 'number', min: 80, step: 20 },
      description:
        'Altura do container em pixels. Sem valor, vale o piso de altura do próprio bloco (200px, no CSS compartilhado).',
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
        'Frase exibida no lugar do desenho quando nenhuma série tem dado. Use uma frase completa, que oriente a próxima ação.',
      table: { type: { summary: 'string' }, defaultValue: { summary: `'${CHART_EMPTY_LABEL}'` } },
    },
    class: {
      control: 'text',
      description:
        'Classes utilitárias nds-* no container. Use para largura e espaçamento; a altura tem prop própria. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
    'aria-label': {
      control: 'text',
      description:
        'Descrição textual do gráfico para leitor de tela. É o que substitui o desenho para quem não o enxerga: diga o que o gráfico mostra, não que ele é um gráfico.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Gráfico'" } },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    renderer: 'svg' as const,
    height: 300,
    showData: false,
    emptyLabel: CHART_EMPTY_LABEL,
    class: 'nds-w-full',
    'aria-label': LABEL,
  },
};

export default meta;
type Story = StoryObj;

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
    // Procura pela classe, não pelo data-slot: é o que o CSS compartilhado
    // define, e é o mesmo colhedor nas cinco stacks.
    const root = exigirRoot(canvasElement);

    await step('O desenho é anunciado como imagem, com a descrição da story', async () => {
      // O papel vai no elemento do DESENHO, não no bloco em volta: no bloco ele
      // podaria a tabela de dados junto, e a alternativa textual sumiria da
      // árvore de acessibilidade.
      const design = drawingOf(root);
      await expect(design).toHaveAttribute('role', 'img');
      // O valor exato, não só a presença do atributo: rótulo vazio ou genérico
      // passa em "tem aria-label" e não descreve nada.
      await expect(design.getAttribute('aria-label')).toBe(args['aria-label']);
      await expect(root.getAttribute('role')).toBeNull();
    });

    await step('A alternativa textual traz os mesmos números do desenho', async () => {
      // Um desenho mudo é conteúdo perdido: quem lê com leitor de tela, quem
      // busca na página e quem copia o dado alcançam a TABELA, não o desenho.
      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(MONTHS.length);
      await expect(lines[0].querySelector('th')?.getAttribute('scope')).toBe('row');
      await expect(lines[0].querySelector('th')?.textContent?.trim()).toBe(MONTHS[0]);
      await expect(lines[0].querySelector('td')?.textContent?.trim())
        .toBe(String(SERIE_UNICA[0].data[0]));
      // A legenda da tabela é o mesmo texto que nomeia o desenho: uma descrição
      // para os dois, e nenhuma chance de descreverem coisas diferentes.
      await expect(root.querySelector('caption')?.textContent?.trim()).toBe(args['aria-label']);
      await expect(root.querySelector('thead th')?.getAttribute('scope')).toBe('col');
    });

    await step('E, por padrão, ela existe só para quem lê o DOM', async () => {
      // Visível é escolha do consumidor (showData); presente é contrato.
      await expect(dataOf(root)).toHaveClass('nds-sr-only');
      await expect(dataOf(root).getAttribute('tabindex')).toBeNull();
    });

    await step('O desenho sai', async () => {
      // Gráfico mede a si mesmo antes de desenhar: espera o desenho existir em
      // vez de medir no primeiro quadro.
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
    });

    // Os controls trocam o renderer, e canvas não tem texto nem forma no DOM.
    // As duas medições abaixo valem para o desenho em SVG, que é o padrão e o
    // que a suíte roda.
    if (args.renderer === 'svg') {
      await step('O eixo escreve todas as categorias dos dados', async () => {
        await waitFor(() => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        }, { timeout: 3000 });
      });

      await step('Cada mês vira forma desenhada — o SVG não é casca vazia', async () => {
        await waitFor(
          () => expect(datumFormas(root).length).toBeGreaterThanOrEqual(MONTHS.length),
          { timeout: 3000 },
        );
      });
    }
  },
};
