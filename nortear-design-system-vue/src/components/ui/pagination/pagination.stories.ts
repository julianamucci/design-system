import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, fn, userEvent, expect } from 'storybook/test';
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
import { paginationSource } from './pagination.source';

/**
 * Args do Playground.
 *
 * Tipados à parte, e não por `Meta<any>`: o `render` faz conta com `total` e
 * `itemsPerPage` e chama o espião, e sem o tipo o `vue-tsc` os enxergava como
 * `undefined` ou como props do próprio componente.
 */
type PlaygroundArgs = {
  total: number;
  itemsPerPage: number;
  defaultPage: number;
  textoAnterior: string;
  textoProxima: string;
  onPageChange: (page: number) => void;
};

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
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
    total: {
      control: { type: 'number', min: 10, step: 10 },
      description: 'Total de itens — usado para calcular o número de páginas.',
    },
    itemsPerPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Itens por página.',
    },
    defaultPage: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Página exibida ao montar.',
    },
    textoAnterior: {
      control: 'text',
      description: 'Rótulo visível do controle de página anterior.',
    },
    textoProxima: {
      control: 'text',
      description: 'Rótulo visível do controle de próxima página.',
    },
    onPageChange: {
      action: 'page-change',
      description: 'Chamado com o número da página quando ela muda.',
    },
  },
  args: {
    total: 50,
    itemsPerPage: 10,
    defaultPage: 1,
    textoAnterior: 'Anterior',
    textoProxima: 'Próxima',
    onPageChange: fn(),
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

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
      // O estado da página vive aqui, como em qualquer consumidor: a faixa não
      // guarda página atual. `key` no root remonta quando os controls mudam.
      const atual = ref(args.defaultPage);
      const totalPaginas = Math.ceil(args.total / args.itemsPerPage);
      const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
      const irPara = (n: number) => {
        if (n < 1 || n > totalPaginas) return;
        atual.value = n;
        args.onPageChange(n);
      };
      return { args, atual, paginas, totalPaginas, irPara };
    },
    template: `
      <Pagination
        :key="String(args.total) + String(args.itemsPerPage) + String(args.defaultPage)"
        :total="args.total"
        :items-per-page="args.itemsPerPage"
        :page="atual"
      >
        <PaginationContent>
          <PaginationItem>
            <!-- O primitivo já desabilita nos extremos a partir de :page. -->
            <PaginationPrevious :text="args.textoAnterior" @click="irPara(atual - 1)" />
          </PaginationItem>
          <PaginationItem v-for="n in paginas" :key="n">
            <PaginationLink
              href="#"
              :is-active="atual === n"
              :aria-label="\`Ir para página \${n}\`"
              @click.prevent="irPara(n)"
            >
              {{ n }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext :text="args.textoProxima" @click="irPara(atual + 1)" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const totalPaginas = Math.ceil(args.total / args.itemsPerPage);

    await step('A paginação é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem nome o leitor de tela anuncia só "navegação",
      // e o axe acusa `landmark-unique` quando a página mostra mais de uma.
      const nav = canvas.getByRole('navigation', { name: 'Paginação' });
      await expect(nav.tagName).toBe('NAV');
      await expect(nav).toHaveAttribute('data-slot', 'pagination');
      await expect(nav).toHaveClass('nds-pagination');
    });

    await step('Todo controle tem rótulo com contexto', async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta.
      for (let n = 1; n <= totalPaginas; n++) {
        const link = canvas.getByRole('link', { name: `Ir para página ${n}` });
        await expect(link).toHaveAttribute('data-slot', 'pagination-link');
      }
      await expect(canvas.getByRole('button', { name: ROTULO_ANTERIOR })).toHaveAttribute(
        'data-slot',
        'pagination-previous',
      );
      await expect(canvas.getByRole('button', { name: ROTULO_PROXIMA })).toHaveAttribute(
        'data-slot',
        'pagination-next',
      );
    });

    await step('A página atual é marcada e o extremo é desabilitado', async () => {
      // accessibility.item4
      const ativo = canvas.getByRole('link', { name: `Ir para página ${args.defaultPage}` });
      await expect(ativo).toHaveAttribute('aria-current', 'page');
      await expect(ativo).toHaveAttribute('data-active', 'true');
      await expect(canvas.getByRole('button', { name: ROTULO_ANTERIOR })).toBeDisabled();
    });

    await step('Clicar numa página avisa quem controla o estado', async () => {
      // functional.item1 — a story guarda a página, então o passo VOLTA ao
      // valor inicial no fim: o painel Interactions reexecuta a play no mesmo
      // DOM, e sem isso a segunda rodada partiria de outra página.
      const alvo = args.defaultPage === 1 ? 2 : 1;
      (args.onPageChange as unknown as { mockClear: () => void }).mockClear();
      await userEvent.click(canvas.getByRole('link', { name: `Ir para página ${alvo}` }));
      await expect(args.onPageChange).toHaveBeenLastCalledWith(alvo);
      await expect(
        canvas.getByRole('link', { name: `Ir para página ${alvo}` }),
      ).toHaveAttribute('aria-current', 'page');

      await userEvent.click(
        canvas.getByRole('link', { name: `Ir para página ${args.defaultPage}` }),
      );
      await expect(
        canvas.getByRole('link', { name: `Ir para página ${args.defaultPage}` }),
      ).toHaveAttribute('aria-current', 'page');
    });

    await step('Tab percorre os controles na ordem visual', async () => {
      // functional.item4 — a lista esperada é DERIVADA do DOM: o controle
      // desabilitado sai da tabulação, e uma lista escrita à mão só valeria
      // com os controls no valor padrão.
      const esperados = [
        canvas.getByRole('button', { name: ROTULO_ANTERIOR }),
        canvas.getByRole('link', { name: 'Ir para página 1' }),
        canvas.getByRole('link', { name: 'Ir para página 2' }),
      ].filter((el) => !(el as HTMLButtonElement).disabled);

      (document.activeElement as HTMLElement | null)?.blur();
      for (const alvo of esperados) {
        await userEvent.tab();
        await expect(alvo).toHaveFocus();
      }
    });
  },
};
