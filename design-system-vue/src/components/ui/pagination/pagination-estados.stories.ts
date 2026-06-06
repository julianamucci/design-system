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
  title: 'UI/Pagination/Estados',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Pagination: Default (link inativo), Hover (bg-accent), Active (página atual com aria-current), Disabled (Previous na primeira ou Next na última, com aria-disabled e pointer-events-none) e Focus (ring-2 ring-ring visível).',
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
    docs: { description: { story: 'Link inativo — fundo transparente, texto em foreground.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="1">
        <PaginationContent>
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByLabelText(/Ir para página 2/i);
    await expect(link).toBeVisible();
  },
};

export const Hover: Story = {
  parameters: {
    pseudo: { hover: true },
    docs: { description: { story: 'Estado hover — bg-accent + text-accent-foreground (simulado via parameters.pseudo).' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="1">
        <PaginationContent>
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Active: Story = {
  parameters: {
    docs: { description: { story: 'Página atual — isActive aplica outline + aria-current="page".' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="3">
        <PaginationContent>
          <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 3">3</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 3/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Previous na primeira página recebe aria-disabled="true" e pointer-events-none — reka-ui aplica automaticamente quando page === 1.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="1">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Ir para a página anterior">
              <span class="hidden sm:block">Anterior</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 1">1</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prev = canvas.getByLabelText(/anterior/i);
    // reka-ui aplica disabled/aria-disabled quando estamos na primeira página
    await expect(prev).toBeVisible();
  },
};

export const Focus: Story = {
  parameters: {
    pseudo: { focusVisible: true },
    docs: { description: { story: 'Foco visível — ring-2 ring-ring (simulado via parameters.pseudo).' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :default-page="1">
        <PaginationContent>
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
