import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  designEscreve,
  designPintado,
  exigirRoot,
} from '@shared/testing/chart-probe';
import { ChartContainer, buildBarOption } from './index';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { chartWithCardSource, designChartTitleSource } from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];

const CARD_TITLE = 'Acessos mensais';
const DESIGN_TITLE = 'Vendas mensais';

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartWithCardSource } },
  },
  title: 'UI/Chart/Compositions',
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

/**
 * Gráfico dentro de Card — o arranjo mais comum em painel.
 *
 * O card é o componente Card, não um retângulo desenhado à mão: quem escreve a
 * composição à mão fixa borda, sombra e tipografia num lugar que o tema não
 * alcança, e a peça deixa de acompanhar densidade, marca e modo escuro.
 */
export const WithCard: Story = {
  parameters: {
    docs: { description: { story: 'Gráfico dentro de Card, com título e descrição do próprio card.' } },
  },
  render: () => h(Card, { class: 'nds-w-sm' }, () => [
    h(CardHeader, null, () => [
      h(CardTitle, null, () => CARD_TITLE),
      h(CardDescription, null, () => 'Janeiro a junho de 2024'),
    ]),
    h(CardContent, null, () => h(ChartContainer, {
      option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
      height: 200,
      'aria-label': 'Acessos mensais no desktop, de janeiro a junho',
    })),
  ]),
  play: async ({ canvasElement, step }) => {
    await step('O card é o componente da biblioteca, com o título esperado', async () => {
      const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]');
      await expect(card).not.toBeNull();
      await expect(card!.querySelector('[data-slot="card-title"]')?.textContent?.trim())
        .toBe(CARD_TITLE);
    });

    await step('E o gráfico mora dentro dele', async () => {
      // O aninhamento é a composição: gráfico ao lado do card, e não dentro,
      // passaria em qualquer asserção que só procurasse os dois na tela.
      const inside = canvasElement.querySelector<HTMLElement>(
        '[data-slot="card"] [data-slot="chart"]',
      );
      await expect(inside).not.toBeNull();

      const root = exigirRoot(canvasElement);
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
    });
  },
};

/**
 * Título no próprio option — útil quando o gráfico não tem um card em volta
 * para carregar o assunto.
 */
export const InlineTitle: Story = {
  parameters: {
    // O card sai de cena e o rótulo autoral some junto — a ausência é o
    // assunto, e a do meta a esconderia atrás do Card.
    docs: {
      source: { transform: designChartTitleSource },
      description: { story: 'Título dentro do desenho, para o gráfico que aparece sem card.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA, title: DESIGN_TITLE }),
    height: 260,
    class: 'nds-max-w-lg',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O título do option é desenhado junto do gráfico', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(designEscreve(root, DESIGN_TITLE)).toBe(true), {
        timeout: 3000,
      });
    });

    await step('E, sem rótulo autoral, é ele que nomeia o desenho', async () => {
      // A ordem do container é: rótulo passado, título do option, palavra
      // genérica. A story não passa rótulo, então o degrau do meio é o que vale
      // — e um desenho nunca fica mudo para leitor de tela.
      await expect(root.getAttribute('aria-label')).toBe(DESIGN_TITLE);
    });
  },
};
