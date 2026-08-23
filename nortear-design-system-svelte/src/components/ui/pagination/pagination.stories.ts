import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { fn, userEvent, within, expect } from 'storybook/test';
import PaginationStory from './PaginationStory.svelte';
import PaginationDocs from '@/components/docs/PaginationDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { paginationSource } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

const meta: Meta = {
  title: 'UI/Pagination',
  component: PaginationStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(PaginationDocs),
      source: { transform: paginationSource },
      description: {
        component:
          'Pagination — navegação entre páginas de um conjunto paginado. Renderiza um <nav> nomeado com PaginationContent (<ul>), PaginationItem (<li>), PaginationLink (numerado, aplica aria-current="page" quando isActive), PaginationPrevious/Next (direcionais com ícone) e PaginationEllipsis (decorativo, aria-hidden).',
      },
    },
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 10, step: 10 },
      description: 'Total de itens — usado para calcular o número de páginas.',
    },
    perPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Itens por página.',
    },
    page: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Página exibida ao montar.',
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 4, step: 1 },
      description: 'Quantidade de páginas vizinhas exibidas à esquerda e à direita da atual.',
    },
    demonstration: {
      control: 'select',
      options: ['simples', 'directional', 'controlada', 'tabela'],
      description: 'Composição interna usada na demonstração.',
    },
    label: {
      control: 'text',
      description: 'Nome acessível do landmark de navegação.',
    },
    onPageChange: { control: false, table: { disable: true } },
  },
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
    label: 'Paginação',
    onPageChange,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A paginação é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem nome o leitor de tela anuncia só "navegação",
      // e o axe acusa `landmark-unique` quando a página mostra mais de uma.
      // O primitivo entrega um `<div>`; a tag `nav` vem do snippet `child`.
      const nav = canvas.getByRole('navigation', { name: 'Paginação' });
      await expect(nav.tagName).toBe('NAV');
      await expect(nav).toHaveAttribute('data-slot', 'pagination');
      await expect(nav).toHaveClass('nds-pagination');
    });

    await step('Todo controle tem rótulo com contexto', async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta. O primitivo
      // fixa "Page N", em inglês; o rótulo em português vem do snippet `child`.
      for (let n = 1; n <= 5; n++) {
        const target = canvas.getByRole('button', { name: `Ir para página ${n}` });
        await expect(target).toHaveAttribute('data-slot', 'pagination-link');
      }
      await expect(canvas.getByRole('button', { name: LABEL_PREVIOUS })).toHaveAttribute(
        'data-slot',
        'pagination-previous',
      );
      await expect(canvas.getByRole('button', { name: LABEL_NEXT })).toHaveAttribute(
        'data-slot',
        'pagination-next',
      );
    });

    await step('A página atual é marcada e o extremo é desabilitado', async () => {
      // accessibility.item4
      const active = canvas.getByRole('button', { name: 'Ir para página 1' });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(canvas.getByRole('button', { name: LABEL_PREVIOUS })).toBeDisabled();
    });

    await step('Clicar numa página avisa quem controla o estado', async () => {
      // functional.item1 — o passo VOLTA ao valor inicial no fim: o painel
      // Interactions reexecuta a play no mesmo DOM, e sem isso a segunda rodada
      // partiria de outra página e inverteria as asserções acima.
      onPageChange.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para página 2' }));
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );

      await userEvent.click(canvas.getByRole('button', { name: 'Ir para página 1' }));
      await expect(canvas.getByRole('button', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await step('Tab percorre os controles na ordem visual', async () => {
      // functional.item4 — a lista esperada é DERIVADA do DOM: o controle
      // desabilitado sai da tabulação, e uma lista escrita à mão só valeria
      // com os controls no valor padrão.
      const esperados = [
        canvas.getByRole('button', { name: LABEL_PREVIOUS }),
        canvas.getByRole('button', { name: 'Ir para página 1' }),
        canvas.getByRole('button', { name: 'Ir para página 2' }),
      ].filter((el) => !(el as HTMLButtonElement).disabled);

      (document.activeElement as HTMLElement | null)?.blur();
      for (const target of esperados) {
        await userEvent.tab();
        await expect(target).toHaveFocus();
      }
    });
  },
};
