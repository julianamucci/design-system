import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, CHART_EMPTY_LABEL } from './index';
import {
  desenhoEscreve, desenhoPintado, exigirRaiz, formasDeDado,
} from '@shared/testing/chart-probe';
import ChartDocs from '@/components/docs/ChartDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { chartSource } from './chart.source';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Vendas', data: [186, 305, 237, 73, 209, 214] }];

const ROTULO = 'Acessos mensais no desktop, de janeiro a junho';

const meta: Meta = {
  title: 'UI/Chart',
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
    option: buildBarOption({ xAxis: MESES, series: SERIE_UNICA }),
    renderer: 'svg' as const,
    height: 300,
    emptyLabel: CHART_EMPTY_LABEL,
    class: 'nds-w-full',
    'aria-label': ROTULO,
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
    const raiz = exigirRaiz(canvasElement);

    await step('O desenho é anunciado como imagem, com a descrição da story', async () => {
      await expect(raiz).toHaveAttribute('role', 'img');
      // O valor exato, não só a presença do atributo: rótulo vazio ou genérico
      // passa em "tem aria-label" e não descreve nada.
      await expect(raiz.getAttribute('aria-label')).toBe(args['aria-label']);
    });

    await step('O desenho sai', async () => {
      // Gráfico mede a si mesmo antes de desenhar: espera o desenho existir em
      // vez de medir no primeiro quadro.
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
    });

    // Os controls trocam o renderer, e canvas não tem texto nem forma no DOM.
    // As duas medições abaixo valem para o desenho em SVG, que é o padrão e o
    // que a suíte roda.
    if (args.renderer === 'svg') {
      await step('O eixo escreve todas as categorias dos dados', async () => {
        await waitFor(() => {
          for (const mes of MESES) expect(desenhoEscreve(raiz, mes)).toBe(true);
        }, { timeout: 3000 });
      });

      await step('Cada mês vira forma desenhada — o SVG não é casca vazia', async () => {
        await waitFor(
          () => expect(formasDeDado(raiz).length).toBeGreaterThanOrEqual(MESES.length),
          { timeout: 3000 },
        );
      });
    }
  },
};
