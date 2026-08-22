import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createPagination } from './pagination';
import { paginationWithStateSource } from './pagination.source';
import { createPaginationDocs } from '@/components/docs/PaginationDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type PaginationArgs = {
  total: number;
  current: number;
  showPrevNext: boolean;
  'aria-label': string;
};

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

const meta: Meta<PaginationArgs> = {
  title: 'UI/Pagination',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createPaginationDocs),
      source: { transform: paginationWithStateSource },
    },
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Total de páginas. Acima de 7 ativa as reticências automáticas.',
    },
    current: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Página atual (1-based). Recebe aria-current="page".',
    },
    showPrevNext: {
      control: 'boolean',
      description: 'Exibe os controles de página anterior e próxima nas extremidades.',
    },
    'aria-label': {
      control: 'text',
      description: 'Nome acessível do landmark de navegação. O apelido depreciado label continua aceito; quando os dois vêm, aria-label vence.',
    },
  },
  args: {
    total: 5,
    current: 1,
    showPrevNext: true,
    'aria-label': 'Paginação',
  },
};

export default meta;
type Story = StoryObj<PaginationArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => {
    // A factory não guarda estado: quem consome mantém a página e remonta a
    // faixa. É o que esta story demonstra.
    const container = document.createElement('div');
    container.className = 'nds-cluster nds-w-full nds-p-2 nds-min-h-24';
    container.dataset.justify = 'center';
    container.dataset.align = 'center';

    let atual = Math.min(Math.max(1, args.current), args.total);

    function remontar(): void {
      container.replaceChildren(
        createPagination({
          total: args.total,
          current: atual,
          showPrevNext: args.showPrevNext,
          'aria-label': args['aria-label'],
          onPageChange: (page) => {
            atual = page;
            onPageChange(page);
            remontar();
          },
        }),
      );
    }

    remontar();
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A paginação é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem nome o leitor de tela anuncia só "navegação",
      // e o axe acusa `landmark-unique` quando a página mostra mais de uma.
      const nav = canvas.getByRole('navigation', { name: args['aria-label'] });
      await expect(nav.tagName).toBe('NAV');
      await expect(nav).toHaveAttribute('data-slot', 'pagination');
      await expect(nav).toHaveClass('nds-pagination');
    });

    await step('Todo controle tem rótulo com contexto', async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta. Antes daqui
      // a faixa saía com "Page 2" e "Go to previous page", em inglês, e o link
      // da página atual não tinha rótulo nenhum.
      for (let n = 1; n <= args.total; n++) {
        const link = canvas.getByRole('link', { name: `Ir para página ${n}` });
        await expect(link).toHaveAttribute('data-slot', 'pagination-link');
      }
      await expect(canvas.getByRole('link', { name: ROTULO_ANTERIOR })).toHaveAttribute(
        'data-slot',
        'pagination-previous',
      );
      await expect(canvas.getByRole('link', { name: ROTULO_PROXIMA })).toHaveAttribute(
        'data-slot',
        'pagination-next',
      );
    });

    await step('A página atual é marcada e o extremo é desabilitado', async () => {
      // accessibility.item4
      const ativo = canvas.getByRole('link', { name: `Ir para página ${args.current}` });
      await expect(ativo).toHaveAttribute('aria-current', 'page');
      await expect(ativo).toHaveAttribute('data-active', 'true');

      const anterior = canvas.getByRole('link', { name: ROTULO_ANTERIOR });
      await expect(anterior).toHaveAttribute('aria-disabled', 'true');
      await expect(anterior).toHaveAttribute('tabindex', '-1');
    });

    await step('Clicar numa página avisa quem controla o estado', async () => {
      // functional.item1 — a story remonta a faixa a cada clique, então o passo
      // VOLTA ao valor inicial no fim: o painel Interactions reexecuta a play no
      // mesmo DOM, e sem isso a segunda rodada partiria de outra página.
      const alvo = args.current === 1 ? 2 : 1;
      onPageChange.mockClear();
      await userEvent.click(canvas.getByRole('link', { name: `Ir para página ${alvo}` }));
      await expect(onPageChange).toHaveBeenLastCalledWith(alvo);
      await expect(
        canvas.getByRole('link', { name: `Ir para página ${alvo}` }),
      ).toHaveAttribute('aria-current', 'page');

      await userEvent.click(
        canvas.getByRole('link', { name: `Ir para página ${args.current}` }),
      );
      await expect(
        canvas.getByRole('link', { name: `Ir para página ${args.current}` }),
      ).toHaveAttribute('aria-current', 'page');
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // `label` era o único nome do landmark aqui. O canônico entrou e o antigo
      // ficou como apelido: apagá-lo quebraria chamador em silêncio, e sem
      // asserção a compatibilidade é promessa, não contrato.
      const antigo = createPagination({ total: 3, current: 1, label: 'Paginação antiga' });
      await expect(antigo).toHaveAttribute('aria-label', 'Paginação antiga');

      // E o canônico vence quando os dois vierem.
      const ambos = createPagination({
        total: 3,
        current: 1,
        label: 'Antigo',
        'aria-label': 'Canônico',
      });
      await expect(ambos).toHaveAttribute('aria-label', 'Canônico');
    });
  },
};
