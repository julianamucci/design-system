import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from './pagination';
import {
  paginationDirectionalSource,
  LABEL_NEXT,
  LABEL_PREVIOUS,
} from './pagination.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.
//
// `Simple`, `WithEllipsis` e `Interactive` saíram deste arquivo para
// `pagination-compositions.stories.ts`: nas outras quatro stacks as três são
// composições, e o grupo da barra lateral sai do ARQUIVO.

const meta: Meta = {
  title: 'Components/Navigation/Pagination/Variants',
  tags: ['navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsPagination,
        NdsPaginationContent,
        NdsPaginationItem,
        NdsPaginationLink,
        NdsPaginationPrevious,
        NdsPaginationNext,
        NdsPaginationEllipsis,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Configurações da paginação: a faixa reduzida aos controles de direção, sem números.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Direcional ───────────────────────────────────────────────────────────────

export const Directional: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      source: { transform: paginationDirectionalSource },
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  render: () => ({
    props: {
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
    },
    template: `
      <nav ndsPagination label="Paginação direcional">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button ndsPaginationPrevious type="button" text="Anterior" [label]="labelPrevious"></button>
          </li>
          <li ndsPaginationItem>
            <button ndsPaginationNext type="button" text="Próxima" [label]="labelNext"></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo justamente em
      // tela pequena.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-pagination-next');
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      const icons = canvasElement.querySelectorAll('svg');
      await expect(icons.length).toBe(2);
      for (const icon of icons) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });
  },
};
