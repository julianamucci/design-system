import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  designEscreve,
  designPintado,
  exigirRoot,
} from '@shared/testing/chart-probe';
import { createChart } from './chart';
import { drawingSettled, filledShapes } from './chart.fixtures';
import { cardSourceWithChart, chartSource, chartSourceWith } from './chart.source';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from './card';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const chartData = MONTHS.map((label, i) => ({
  label,
  value: [186, 305, 237, 73, 209, 214][i],
}));

const CARD_TITLE = 'Acessos mensais';
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
          cardTitle: CARD_TITLE,
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
    header.appendChild(createCardTitle({ text: CARD_TITLE, level: 3 }));
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
      const title = canvasElement.querySelector('[data-slot="card-title"]');
      await expect(title?.textContent?.trim()).toBe(CARD_TITLE);
    });

    await step('O gráfico está DENTRO do card, não ao lado', async () => {
      const inside = canvasElement.querySelector('[data-slot="card"] [data-slot="chart"]');
      await expect(inside).not.toBeNull();
    });

    await step('E o desenho sai dentro dele, com uma coluna por categoria', async () => {
      const root = exigirRoot(canvasElement);
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade: o desenho não perde nem ganha dado por estar embrulhado no
      // card. Com "mais de zero", este passo passava com qualquer número.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(chartData.length),
        { timeout: 3000 },
      );
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
    const root = exigirRoot(canvasElement);

    await step('O título aparece escrito dentro do desenho', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(designEscreve(root, TITLE_INLINE)).toBe(true), { timeout: 3000 });
    });

    await step('Sem descrição própria, o título é quem descreve o desenho', async () => {
      // O desenho continua sendo anunciado como imagem — o que muda é de onde
      // vem o rótulo. Título escrito e rótulo divergentes anunciariam ao leitor
      // de tela uma coisa e mostrariam outra.
      //
      // O papel mora no elemento do DESENHO: no bloco em volta ele podaria a
      // tabela de dados da árvore de acessibilidade.
      const canvas = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]')!;
      await expect(canvas.getAttribute('role')).toBe('img');
      await expect(canvas.getAttribute('aria-label')).toBe(TITLE_INLINE);
      await expect(root.getAttribute('role')).toBeNull();
      // E a legenda da tabela acompanha a mesma frase — o desenho e a
      // alternativa textual dele não descrevem coisas diferentes.
      await expect(root.querySelector('caption')?.textContent?.trim()).toBe(TITLE_INLINE);
    });

    await step('E o dado continua desenhado, categoria por categoria', async () => {
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade: o título desenhado ocupa espaço acima dos eixos, e o que este
      // passo promete é que nenhuma coluna se perdeu para ele.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(chartData.length),
        { timeout: 3000 },
      );
    });
  },
};
