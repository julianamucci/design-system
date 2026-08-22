import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsChart } from './chart';
import { MONTHS, SERIES_TRIO, SERIE_UNICA } from './chart.fixtures';
import {
  NdsCard,
  NdsCardContent,
  NdsCardDescription,
  NdsCardHeader,
  NdsCardTitle,
} from './card';

// A composição `inCard` estava documentada e desenhada na docs page, e não
// existia como story: nenhuma foto de regressão visual olhava para ela nesta
// stack, enquanto olhava nas outras quatro.
//
// Os dados e os rótulos são os MESMOS do preview da docs page de propósito —
// exemplo diferente entre os dois artefatos faz a regressão visual proteger
// outra coisa.

const meta: Meta = {
  title: 'UI/Chart/Compositions',
  decorators: [
    moduleMetadata({
      imports: [NdsChart, NdsCard, NdsCardHeader, NdsCardTitle, NdsCardDescription, NdsCardContent],
    }),
  ],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const WithCard: Story = {
  render: () => ({
    props: { meses: MONTHS, series: SERIES_TRIO },
    template: `
      <div ndsCard class="nds-w-lg">
        <div ndsCardHeader>
          <p ndsCardTitle>Acessos mensais</p>
          <p ndsCardDescription>Total de acessos</p>
        </div>
        <div ndsCardContent>
          <div ndsChart
            type="bar"
            [xAxis]="meses"
            [series]="series"
            label="Acessos mensais por dispositivo"
          ></div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Gráfico dentro de um Card, com título e descrição do recorte no cabeçalho — o padrão para dashboards.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('O gráfico está dentro do Card, não ao lado dele', async () => {
      const dentro = canvasElement.querySelector('[data-slot="card"] [data-slot="chart"]');
      await expect(dentro).not.toBeNull();
    });

    await step('O Card nomeia o recorte por escrito', async () => {
      const titulo = canvasElement.querySelector('[data-slot="card-title"]');
      await expect(titulo?.textContent?.trim()).toBe('Acessos mensais');
      const descricao = canvasElement.querySelector('[data-slot="card-description"]');
      await expect(descricao?.textContent?.trim()).toBe('Total de acessos');
    });

    await step('O desenho e a tabela sobrevivem à moldura', async () => {
      const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
      await expect(chart.querySelector('svg')).not.toBeNull();
      await expect([...chart.querySelectorAll('tbody tr')]).toHaveLength(MONTHS.length);
    });
  },
};

export const InlineTitle: Story = {
  render: () => ({
    props: { meses: MONTHS, series: SERIE_UNICA },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        chartTitle="Vendas mensais"
        label="Vendas mensais no desktop, de janeiro a junho"
      ></div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Título desenhado dentro do próprio gráfico — útil quando ele aparece sozinho, sem moldura em volta.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('O título aparece escrito no desenho', async () => {
      const textos = [...chart.querySelectorAll('svg text')].map((t) => t.textContent?.trim());
      await expect(textos).toContain('Vendas mensais');
    });

    await step('O título não rouba o lugar da descrição do gráfico', async () => {
      // São duas coisas diferentes: o título é decoração desenhada, a descrição
      // é o que o leitor de tela anuncia. Trocar um pelo outro deixaria a
      // legenda da tabela de dados dizendo apenas "Vendas mensais".
      const svg = chart.querySelector('svg')!;
      await expect(svg.getAttribute('aria-label'))
        .toBe('Vendas mensais no desktop, de janeiro a junho');
      await expect(chart.querySelector('caption')?.textContent?.trim())
        .toBe('Vendas mensais no desktop, de janeiro a junho');
    });
  },
};
