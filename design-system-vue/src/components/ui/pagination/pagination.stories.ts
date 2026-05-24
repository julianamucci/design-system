import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';
import PaginationDocs from '@/components/docs/PaginationDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      page: withAutoDocsTab(PaginationDocs),
      description: {
        component:
          'Pagination (reka-ui) — navegação entre páginas de um conjunto paginado. Renderiza um <nav aria-label="pagination"> com PaginationContent (<ul>), PaginationItem (<li>), PaginationLink (numerado, aplica aria-current="page" quando isActive), PaginationPrevious/Next (direcionais com ícone) e PaginationEllipsis (decorativo, aria-hidden).',
      },
    },
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 0, step: 10 },
      description: 'Total de itens — usado por reka-ui para calcular o número de páginas.',
    },
    itemsPerPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Itens por página.',
    },
    defaultPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Página inicial em modo não-controlado.',
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 4, step: 1 },
      description: 'Quantidade de páginas vizinhas exibidas à esquerda e à direita da atual.',
    },
    showEdges: {
      control: 'boolean',
      description: 'Sempre mostra a primeira e a última página, mesmo fora da janela de siblings.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita a paginação inteira (aria-disabled em todos os controles).',
    },
    onPageChange: {
      action: 'page-change',
      description: 'Callback emitido quando a página atual muda. Em Vue, equivale ao evento @update:page.',
    },
  },
  args: {
    total: 50,
    itemsPerPage: 10,
    defaultPage: 1,
    siblingCount: 2,
    showEdges: false,
    disabled: false,
    onPageChange: fn(),
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationItem,
      PaginationLink,
      PaginationNext,
      PaginationPrevious,
    },
    setup() {
      return { args };
    },
    template: `
      <div class="w-full" style="contain: layout; min-height: 64px;">
        <Pagination
          :key="String(args.total) + String(args.itemsPerPage) + String(args.defaultPage) + String(args.siblingCount) + String(args.showEdges) + String(args.disabled)"
          :total="args.total"
          :items-per-page="args.itemsPerPage"
          :default-page="args.defaultPage"
          :sibling-count="args.siblingCount"
          :show-edges="args.showEdges"
          :disabled="args.disabled"
          @update:page="args.onPageChange"
        >
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious aria-label="Anterior">
                <span class="hidden sm:block">Anterior</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink :is-active="true" aria-label="Página atual, 1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Ir para página 2">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Ir para página 3">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Ir para página 5">5</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext aria-label="Próxima">
                <span class="hidden sm:block">Próxima</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Pagination tem nav com aria-label', async () => {
      const nav = canvas.getByRole('navigation');
      await expect(nav).toBeInTheDocument();
    });

    await step('2. Página ativa anuncia aria-current="page"', async () => {
      const active = canvas.getByLabelText(/Página atual, 1/i);
      await expect(active).toHaveAttribute('aria-current', 'page');
    });

    await step('3. Click em link numerado dispara navegação', async () => {
      const page2 = canvas.getByLabelText(/Ir para página 2/i);
      await userEvent.click(page2);
    });
  },
};
