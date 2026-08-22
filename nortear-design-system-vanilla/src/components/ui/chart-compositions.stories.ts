import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  desenhoEscreve,
  desenhoPintado,
  exigirRaiz,
  formasDeDado,
} from '@shared/testing/chart-probe';
import { createChart } from './chart';
import { cardSourceWithChart, chartSource, chartSourceWith } from './chart.source';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from './card';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const chartData = MESES.map((label, i) => ({
  label,
  value: [186, 305, 237, 73, 209, 214][i],
}));

const TITULO_DO_CARD = 'Acessos mensais';
const TITLE_INLINE = 'Vendas mensais';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
  title: 'UI/Chart/Compositions',
};

export default meta;
type Story = StoryObj;

// ─── Dentro de um Card ────────────────────────────────────────────────────────

export const WithCard: Story = {
  parameters: {
    docs: {
      // Override de story: a forma do snippet é outra — o Card é uma família de
      // fábricas a mais, e o que se ensina é onde o desenho entra nela.
      source: {
        transform: cardSourceWithChart({
          height: 220,
          'aria-label': 'Acessos mensais de janeiro a junho de 2024',
          cardTitle: TITULO_DO_CARD,
        }),
      },
      description: {
        story: 'Gráfico dentro de um Card: o título e o recorte temporal ficam no cabeçalho, em texto de verdade, e o desenho no conteúdo.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-sm' });

    const header = createCardHeader();
    header.appendChild(createCardTitle({ text: TITULO_DO_CARD, level: 3 }));
    header.appendChild(createCardDescription({ text: 'Janeiro — Junho de 2024' }));

    const content = createCardContent();
    content.appendChild(
      createChart({
        data: chartData,
        type: 'bar',
        height: 220,
        'aria-label': 'Acessos mensais de janeiro a junho de 2024',
      }),
    );

    card.appendChild(header);
    card.appendChild(content);
    return card;
  },
  play: async ({ canvasElement, step }) => {
    await step('O cabeçalho do card traz o título em texto', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).not.toBeNull();
      const titulo = canvasElement.querySelector('[data-slot="card-title"]');
      await expect(titulo?.textContent?.trim()).toBe(TITULO_DO_CARD);
    });

    await step('O gráfico está DENTRO do card, não ao lado', async () => {
      const dentro = canvasElement.querySelector('[data-slot="card"] [data-slot="chart"]');
      await expect(dentro).not.toBeNull();
    });

    await step('E o desenho sai dentro dele', async () => {
      const raiz = exigirRaiz(canvasElement);
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(formasDeDado(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });
  },
};

// ─── Título dentro do desenho ─────────────────────────────────────────────────

export const InlineTitle: Story = {
  parameters: {
    docs: {
      // Override de story: o assunto é o título DESENHADO e a ausência de
      // descrição própria — é ela que faz o título virar a alternativa textual.
      source: {
        transform: chartSourceWith({ title: TITLE_INLINE, height: 260, 'aria-label': undefined }),
      },
      description: {
        story: 'Título desenhado acima dos eixos, para quando o gráfico aparece solto, sem moldura que o nomeie. Na falta de descrição própria, o título vira a alternativa textual.',
      },
    },
  },
  render: () => createChart({
    data: chartData,
    type: 'bar',
    title: TITLE_INLINE,
    height: 260,
    class: 'nds-max-w-md',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRaiz(canvasElement);

    await step('O título aparece escrito dentro do desenho', async () => {
      await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(desenhoEscreve(raiz, TITLE_INLINE)).toBe(true), { timeout: 3000 });
    });

    await step('Sem descrição própria, o título é quem descreve o desenho', async () => {
      // O desenho continua sendo anunciado como imagem — o que muda é de onde
      // vem o rótulo. Título escrito e rótulo divergentes anunciariam ao leitor
      // de tela uma coisa e mostrariam outra.
      await expect(raiz.getAttribute('role')).toBe('img');
      await expect(raiz.getAttribute('aria-label')).toBe(TITLE_INLINE);
    });

    await step('E o dado continua desenhado', async () => {
      await expect(formasDeDado(raiz).length).toBeGreaterThan(0);
    });
  },
};
