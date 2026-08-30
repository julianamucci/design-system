import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';
import { paginationSource } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

const meta: Meta = {
  title: 'Primitives/Navigation/Pagination/Compositions',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: paginationSource },
      description: {
        component:
          'Composições típicas: Simple (5 páginas), WithEllipsis (12 páginas), LastPage (Próxima desabilitado), Controlled (estado externo) e CompleteTable (rodapé de tabela).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Simple: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
    label: 'Paginação simples',
    onPageChange,
  },
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Total pequeno: todos os números aparecem em sequência, sem reticências. Previous e Next nas pontas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa mostra todos os números, sem reticências', async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const numbered = canvasElement.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numbered.length).toBe(5);
      await expect([...numbered].map((l) => l.textContent?.trim())).toEqual([
        '1', '2', '3', '4', '5',
      ]);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
    });

    await step('A primeira página é a atual e Anterior está desabilitado', async () => {
      await expect(canvas.getByRole('button', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(canvas.getByRole('button', { name: LABEL_PREVIOUS })).toBeDisabled();
    });
  },
};

export const WithEllipsis: Story = {
  args: {
    count: 120,
    perPage: 10,
    page: 6,
    siblingCount: 1,
    demonstration: 'simples',
    label: 'Paginação com reticências',
    onPageChange,
  },
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Lista longa: primeira, última, atual e vizinhas ficam visíveis; o resto vira reticências decorativas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As páginas distantes colapsam em reticências', async () => {
      // visual.item2
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      await expect(reticencias.length).toBe(2);
      for (const item of reticencias) {
        // notes.item3: o caractere tipográfico, não três pontos e não um ícone.
        await expect(item.textContent?.trim()).toBe('…');
        await expect(item.tagName).toBe('SPAN');
      }
    });

    await step('As reticências não são lidas nem tabuladas', async () => {
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      for (const item of reticencias) {
        await expect(item).toHaveAttribute('aria-hidden', 'true');
        await expect(item.hasAttribute('tabindex')).toBe(false);
      }
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-link"]').length,
      ).toBe(5);
    });
  },
};

export const LastPage: Story = {
  args: {
    count: 100,
    perPage: 10,
    page: 10,
    siblingCount: 1,
    demonstration: 'simples',
    label: 'Paginação na última página',
    onPageChange,
  },
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: LABEL_NEXT });

    await step('Próxima está marcado como desabilitado', async () => {
      await expect(next).toBeDisabled();
      await expect(getComputedStyle(next).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3 — o clique sintético do elemento, e não `fireEvent`:
      // aqui o controle é um <button> com `disabled` nativo, e o navegador barra
      // tanto o clique real quanto o `click()` de um script. `fireEvent`
      // despacharia o evento à força e mediria uma rota que não existe fora do
      // teste.
      onPageChange.mockClear();
      next.click();
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('A página atual é a última da faixa', async () => {
      await expect(canvas.getByRole('button', { name: 'Ir para página 10' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};

export const Controlled: Story = {
  args: {
    count: 40,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'controlada',
    label: 'Paginação controlada',
  },
  parameters: {
    docs: {
      description: {
        story:
          'O estado da página atual vive fora do componente. Cada clique reposiciona o destaque, o aria-current e o contador.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const irTo = async (n: number) => {
      // Par idempotente: só clica quando ainda não é a página atual. O painel
      // Interactions reexecuta a play no mesmo DOM, e um clique cego partiria
      // do estado que a rodada anterior deixou.
      const target = canvas.getByRole('button', { name: `Ir para página ${n}` });
      if (target.getAttribute('aria-current') !== 'page') await userEvent.click(target);
      await expect(canvas.getByRole('button', { name: `Ir para página ${n}` })).toHaveAttribute(
        'aria-current',
        'page',
      );
    };

    await step('Clicar numa página move o destaque e o contador', async () => {
      await irTo(3);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        'Página 3 de 4',
      );
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current="page"]').length).toBe(1);
    });

    await step('O estado volta ao início para a próxima rodada', async () => {
      await irTo(1);
      await expect(canvasElement.querySelector('[data-slot="pagina-atual"]')).toHaveTextContent(
        'Página 1 de 4',
      );
    });
  },
};

export const CompleteTable: Story = {
  args: {
    count: 120,
    perPage: 10,
    page: 2,
    siblingCount: 1,
    demonstration: 'tabela',
    label: 'Paginação do rodapé da tabela',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cenário canônico: rodapé de tabela com o contador de resultados à esquerda e a faixa encostada à direita, via data-align="end".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa encosta na borda direita do rodapé', async () => {
      // O alinhamento é o PONTO desta composição, e antes ele era escrito com
      // classes inertes: a faixa ocupava a linha inteira e ficava centrada.
      const nav = canvas.getByRole('navigation', { name: 'Paginação do rodapé da tabela' });
      await expect(getComputedStyle(nav).justifyContent).toBe('flex-end');
      await expect(nav.getBoundingClientRect().width).toBeLessThan(
        (nav.parentElement as HTMLElement).getBoundingClientRect().width,
      );
    });

    await step('O contador e a faixa dividem a mesma linha', async () => {
      const footer = canvasElement.querySelector('.nds-cluster') as HTMLElement;
      await expect(getComputedStyle(footer).justifyContent).toBe('space-between');
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
};
