import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import { createPagination } from './pagination';
import { wrap } from './pagination.fixtures';
import { paginationSource, paginationSourceWith } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Pagination/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          'Variantes do link de paginação: Default (inativo), Active (página atual, com aria-current=page) e Directional (anterior/próxima com ícone). A factory não expõe uma prop de variante — a marcação da página atual é aplicada quando `page === current`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    // Override de story: a supressão dos direcionais é o assunto aqui, e
    // `showPrevNext` não passa por control nenhum neste arquivo.
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 5,
          current: 2,
          showPrevNext: false,
          'aria-label': 'Paginação com link inativo',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        showPrevNext: false,
        'aria-label': 'Paginação com link inativo',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cinco números visíveis, sem controles direcionais', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(5);
      await expect(canvasElement.querySelector('[data-slot="pagination-previous"]')).toBeNull();
    });

    await step('O link inativo não se anuncia como página atual', async () => {
      const inactive = canvas.getByRole('link', { name: 'Ir para página 3' });
      await expect(inactive).not.toHaveAttribute('aria-current');
      // `data-active` só existe quando é verdade — atributo presente com valor
      // "false" faria `[data-active]` casar o item errado.
      await expect(inactive.hasAttribute('data-active')).toBe(false);
    });
  },
};

export const Active: Story = {
  name: 'Active (current page)',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 7,
          current: 4,
          showPrevNext: false,
          'aria-label': 'Paginação com página atual',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 7,
        current: 4,
        showPrevNext: false,
        'aria-label': 'Paginação com página atual',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um link é a página atual', async () => {
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0].textContent?.trim()).toBe('4');
    });

    await step('A página atual continua rotulada e destacada', async () => {
      const active = canvas.getByRole('link', { name: 'Ir para página 4' });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
    });
  },
};

export const Directional: Story = {
  name: 'Directional (previous/next)',
  parameters: { covers: ['accessibility.item5', 'accessibility.item6'] },
  render: () =>
    wrap(
      createPagination({
        total: 8,
        current: 4,
        showPrevNext: true,
        'aria-label': 'Paginação direcional',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os controles de direção têm rótulo em português', async () => {
      // accessibility.item5 — o ícone não tem texto: sem o rótulo, o controle
      // fica mudo. Antes daqui ele saía como "Go to previous page".
      const previous = canvas.getByRole('link', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('link', { name: LABEL_NEXT });
      await expect(previous).toHaveClass('nds-pagination-icon');
      await expect(next).toHaveClass('nds-pagination-icon');
      await expect(previous.querySelector('svg')).not.toBeNull();
      await expect(next.querySelector('svg')).not.toBeNull();
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      for (const icone of canvasElement.querySelectorAll('svg')) {
        await expect(icone).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};
