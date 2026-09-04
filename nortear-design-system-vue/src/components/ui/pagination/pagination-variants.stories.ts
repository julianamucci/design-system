import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';
import {
  paginationDirecionalSource,
  paginationLinkActiveSource,
  paginationLinkInactiveSource,
} from './pagination.source';

const meta = {
  title: 'Components/Navigation/Pagination/Variants',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: paginationLinkInactiveSource },
      description: {
        component:
          'Variantes do PaginationLink: Default (link inativo), Active (página atual, com aria-current=page) e Directional (Previous/Next com ícone e rótulo).',
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

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Link inativo — fundo transparente. Padrão para toda página que não é a atual.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :page="1" aria-label="Paginação com link inativo">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Ir para página 2' });
    await expect(link).not.toHaveAttribute('aria-current');
    // `data-active` só existe quando é verdade — atributo presente com valor
    // "false" faria `[data-active]` casar o item errado.
    await expect(link.hasAttribute('data-active')).toBe(false);
    await expect(link).toHaveClass('nds-button-ghost');
  },
};

export const Active: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      // A marcação só se vê CONTRA um vizinho inativo: um link sozinho, como o
      // do meta, não mostra o que `is-active` separa.
      source: { transform: paginationLinkActiveSource },
      description: { story: 'Página atual — destaque visual permanente e aria-current="page" para o leitor de tela.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :page="2" aria-label="Paginação com página atual">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" aria-label="Ir para página 1" @click.prevent>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" :is-active="true" aria-label="Ir para página 2" @click.prevent>2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um link se anuncia como página atual', async () => {
      // accessibility.item4 — o contrato é o atributo, não a classe: é ele que
      // o leitor de tela lê.
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent('2');
    });

    await step('O destaque acompanha a marcação', async () => {
      const active = canvas.getByRole('link', { name: 'Ir para página 2' });
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(active).toHaveClass('nds-button-outline');
      await expect(canvas.getByRole('link', { name: 'Ir para página 1' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Directional: Story = {
  parameters: {
    covers: ['accessibility.item5', 'accessibility.item6'],
    docs: {
      // Outras peças: os direcionais no lugar do link numerado, e nenhum número
      // na faixa — a ausência é o assunto.
      source: { transform: paginationDirecionalSource },
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Pagination :total="50" :items-per-page="10" :page="2" aria-label="Paginação direcional">
        <PaginationContent>
          <PaginationItem><PaginationPrevious /></PaginationItem>
          <PaginationItem><PaginationNext /></PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo em tela
      // pequena. Antes daqui o rótulo vinha do primitivo, em inglês.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-pagination-next');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px. O direcional media
      // 32×16 enquanto o rótulo estava escondido por uma classe morta: sem
      // texto, não sobrava nada para o padding crescer.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};
