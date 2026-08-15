import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { alvosAbaixoDoMinimo } from '@shared/testing/pagination-probe';
import PaginationStory from './PaginationStory.svelte';

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

const meta: Meta = {
  title: 'UI/Pagination/Variants',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do PaginationLink: Default (link inativo), Active (página atual, com aria-current=page) e Directional (Previous/Next com ícone e rótulo).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
    rotulo: 'Paginação com link inativo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link inativo — fundo transparente. Padrão para toda página que não é a atual.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inativo = canvas.getByRole('button', { name: 'Ir para página 3' });
    await expect(inativo).not.toHaveAttribute('aria-current');
    // `data-active` só existe quando é verdade — atributo presente com valor
    // "false" faria `[data-active]` casar o item errado.
    await expect(inativo.hasAttribute('data-active')).toBe(false);
    await expect(inativo).toHaveClass('nds-button-ghost');
  },
};

export const Active: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 3,
    siblingCount: 2,
    demonstration: 'simples',
    rotulo: 'Paginação com página atual',
  },
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      description: {
        story:
          'Página atual — destaque visual permanente e aria-current="page" para o leitor de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um controle se anuncia como página atual', async () => {
      // accessibility.item4 — o contrato é o atributo, não a classe: é ele que
      // o leitor de tela lê.
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent('3');
    });

    await step('O destaque acompanha a marcação', async () => {
      const ativo = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(ativo).toHaveAttribute('data-active', 'true');
      await expect(ativo).toHaveClass('nds-button-outline');
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Directional: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 2,
    demonstration: 'directional',
    rotulo: 'Paginação direcional',
  },
  parameters: {
    covers: ['accessibility.item5', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo em tela
      // pequena. Antes daqui o rótulo saía em inglês.
      const anterior = canvas.getByRole('button', { name: ROTULO_ANTERIOR });
      const proxima = canvas.getByRole('button', { name: ROTULO_PROXIMA });
      await expect(anterior.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(proxima.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(anterior).toHaveClass('nds-pagination-prev');
      await expect(proxima).toHaveClass('nds-pagination-next');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px.
      await expect(JSON.stringify(alvosAbaixoDoMinimo(canvasElement))).toBe('[]');
    });
  },
};
