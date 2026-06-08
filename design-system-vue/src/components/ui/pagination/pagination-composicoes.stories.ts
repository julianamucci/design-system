import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { within, expect } from 'storybook/test';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';

const meta = {
  title: 'UI/Pagination/Composicoes',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Pagination: Simples (5 páginas), ComEllipsis (lista longa com primeira/última fixas), UltimaPagina (Next desabilitado), Controlada (page sincronizada com state externo) e CompletaTabela (cabeçalho de DataTable).',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

export const Simples: Story = {
  parameters: {
    docs: { description: { story: 'Paginação básica de 5 páginas — página 1 ativa, Previous desabilitado.' } },
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
          <PaginationItem><PaginationLink aria-label="Ir para página 2">2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 3">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 4">4</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 5">5</PaginationLink></PaginationItem>
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
    const nav = canvas.getByRole('navigation');
    await expect(nav).toBeInTheDocument();
    const active = canvas.getByLabelText(/Página atual, 1/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const ComEllipsis: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '12 páginas com página 6 ativa — primeira (1), siblings (5,6,7) e última (12) visíveis, ellipsis nas lacunas. Reticências tipográficas (…) com aria-hidden.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="120" :items-per-page="10" :default-page="6" :sibling-count="1">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Ir para a página anterior">
              <span class="hidden sm:block">Anterior</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 1">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 5">5</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 6">6</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 7">7</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 12">12</PaginationLink></PaginationItem>
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
    const active = canvas.getByLabelText(/Página atual, 6/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const UltimaPagina: Story = {
  parameters: {
    docs: { description: { story: 'Última página ativa — Next deve ficar visualmente desabilitado pelo consumidor.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="100" :items-per-page="10" :default-page="10">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Ir para a página anterior">
              <span class="hidden sm:block">Anterior</span>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 1">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationLink aria-label="Ir para página 9">9</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 10">10</PaginationLink></PaginationItem>
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
    const active = canvas.getByLabelText(/Página atual, 10/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const Controlada: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Controlled — page sincronizada com state externo (ref). Cada PaginationLink recebe :is-active dinâmico baseado em current.value.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const current = ref(2);
      const totalPages = 5;
      return { current, totalPages };
    },
    template: `
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm text-muted-foreground">Página atual: {{ current }} de {{ totalPages }}</span>
        <Pagination :total="50" :items-per-page="10" :page="current" @update:page="(v) => current = v">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious aria-label="Ir para a página anterior" @click="current = Math.max(1, current - 1)">
                <span class="hidden sm:block">Anterior</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem v-for="n in totalPages" :key="n">
              <PaginationLink
                :is-active="current === n"
                :aria-label="current === n ? \`Página atual, \${n}\` : \`Ir para página \${n}\`"
                @click="current = n"
              >
                {{ n }}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext aria-label="Ir para a próxima página" @click="current = Math.min(totalPages, current + 1)">
                <span class="hidden sm:block">Próxima</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByLabelText(/Página atual, 2/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};

export const CompletaTabela: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cenário canônico: rodapé de tabela com contador de itens à esquerda e Pagination à direita.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div class="w-full max-w-2xl border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">Mostrando 11–20 de 120 resultados</span>
        <Pagination :total="120" :items-per-page="10" :default-page="2" :sibling-count="1" class="!justify-end !mx-0 !w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious aria-label="Ir para a página anterior">
                <span class="hidden sm:block">Anterior</span>
              </PaginationPrevious>
            </PaginationItem>
            <PaginationItem><PaginationLink aria-label="Ir para página 1">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink :is-active="true" aria-label="Página atual, 2">2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink aria-label="Ir para página 3">3</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationLink aria-label="Ir para página 12">12</PaginationLink></PaginationItem>
            <PaginationItem>
              <PaginationNext aria-label="Ir para a próxima página">
                <span class="hidden sm:block">Próxima</span>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation');
    await expect(nav).toBeInTheDocument();
    const active = canvas.getByLabelText(/Página atual, 2/i);
    await expect(active).toHaveAttribute('aria-current', 'page');
  },
};
