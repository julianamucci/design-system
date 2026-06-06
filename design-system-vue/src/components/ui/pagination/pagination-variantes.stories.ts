import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';

const meta = {
  title: 'UI/Pagination/Variantes',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Pagination: Default (link de página inativo, ghost), Active (página atual com outline + aria-current="page") e Directional (Previous/Next com ícone e label).',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Link de página inativo — variant=ghost, fundo transparente, sem aria-current.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="1">
        <PaginationContent>
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 3">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 4">4</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByLabelText(/Ir para página 3/i);
    await expect(link).not.toHaveAttribute('aria-current');
  },
};

export const Active: Story = {
  parameters: {
    docs: { description: { story: 'Página atual — isActive=true aplica variant=outline e aria-current="page".' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="3">
        <PaginationContent>
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 3">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 4">4</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 3/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
    await expect(active).toHaveAttribute('data-active', '');
  },
};

export const Directional: Story = {
  parameters: {
    docs: { description: { story: 'Previous e Next — link com ícone e label visível a partir do breakpoint sm.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Ir para a página anterior">
              <span class="hidden sm:block">Anterior</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext aria-label="Ir para a próxima página">
              <span class="hidden sm:block">Próxima</span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prev = canvas.getByLabelText(/anterior/i);
    const next = canvas.getByLabelText(/próxima/i);
    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();
  },
};
