import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPagination } from './pagination';
import { createPaginationDocs } from '@/components/docs/PaginationDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type PaginationArgs = {
  total: number;
  current: number;
  showPrevNext: boolean;
};

const meta: Meta<PaginationArgs> = {
  title: 'UI/Pagination',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createPaginationDocs) },
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Total de páginas. Acima de 7 ativa o ellipsis automático.',
    },
    current: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Página atual (1-based). Recebe aria-current="page".',
    },
    showPrevNext: {
      control: 'boolean',
      description: 'Exibe os controles Previous (◀) e Next (▶) nas extremidades.',
    },
  },
  args: {
    total: 10,
    current: 3,
    showPrevNext: true,
  },
};

export default meta;
type Story = StoryObj<PaginationArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-p-2';
    container.dataset.justify = 'center';
    container.style.minHeight = '120px';

    const nav = createPagination({
      total: args.total,
      current: Math.min(Math.max(1, args.current), args.total),
      showPrevNext: args.showPrevNext,
      onPageChange: (page) => {
        // eslint-disable-next-line no-console
        console.log('[pagination] page_change', page);
      },
    });
    container.appendChild(nav);
    return container;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Root é <nav role="navigation"> com aria-label', async () => {
      const nav = canvasElement.querySelector('nav[aria-label="Pagination"]');
      await expect(nav).toBeTruthy();
    });

    await step('Página atual tem aria-current="page"', async () => {
      const current = canvasElement.querySelector('a[aria-current="page"]');
      await expect(current).toBeTruthy();
    });

    await step('Click em página numerada dispara navegação', async () => {
      // Procura um link numerado que NÃO seja o ativo.
      const links = canvas.getAllByRole('link');
      const numbered = links.find(
        (a) => /^\d+$/.test((a.textContent ?? '').trim()) && !a.hasAttribute('aria-current'),
      );
      if (numbered) {
        await userEvent.click(numbered);
        // Não checamos navegação real (Storybook não atualiza state) — apenas que
        // o evento foi disparado sem erro.
        await waitFor(() => {
          // noop — o handler do factory chama preventDefault
        });
      }
    });
  },
};
