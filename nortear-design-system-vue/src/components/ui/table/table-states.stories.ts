import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from './index';
import { Skeleton } from '@/components/ui/skeleton';
import { INVOICES } from './table.fixtures';
import {
  tableLoadingSource,
  tableLineSelecionadaSource,
  tableVaziaSource,
} from './table.source';

const meta: Meta = {
  title: 'UI/Table/States',
  tags: ['tables'],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: tableVaziaSource } },
  },
};

export default meta;
type Story = StoryObj;

const COLUMNS = ['Fatura', 'Status', 'Método', 'Valor'];

const COMPONENTES = {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};

export const Empty: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    components: { ...COMPONENTES, TableEmpty },
    setup() {
      return { colunas: COLUMNS };
    },
    template: `
      <Table>
        <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead v-for="coluna in colunas" :key="coluna">{{ coluna }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- colspan derivado do cabeçalho: com um número escrito à mão,
               acrescentar uma coluna deixaria a mensagem torta. -->
          <TableEmpty :colspan="colunas.length">
            Nenhuma fatura encontrada.
          </TableEmpty>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // functional.item2 — sem o colspan a mensagem cairia sob a primeira
      // coluna e as outras três ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>('tbody td')!;
      await expect(celula).toHaveAttribute('colspan', String(COLUMNS.length));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A tabela continua nomeada e com os cabeçalhos no lugar', async () => {
      // Estado vazio não é motivo para desmontar a estrutura: quem usa leitor de
      // tela precisa saber que colunas voltarão a existir quando houver dados.
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('th').length).toBe(COLUMNS.length);
    });

    await step('A mensagem é centralizada e reserva a altura da caixa', async () => {
      // visual.item2 — `.nds-table-empty` é a regra compartilhada do slug
      // `table`: centraliza, apaga a cor e reserva ~96px. A célula usava a regra
      // homônima do DataTable, que é outro slug.
      const celula = canvasElement.querySelector<HTMLElement>('tbody td')!;
      await expect(celula).toHaveClass('nds-table-empty');
      await expect(getComputedStyle(celula).textAlign).toBe('center');
      await expect(celula.getBoundingClientRect().height).toBeGreaterThanOrEqual(90);
    });
  },
};

export const SelectedRow: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item5'],
    // Há registros e há estado de seleção por linha: o corpo volta a ser
    // iterado, o oposto do vazio que o meta mostra.
    docs: { source: { transform: tableLineSelecionadaSource } },
  },
  render: () => ({
    components: COMPONENTES,
    setup() {
      return { invoices: INVOICES.slice(0, 3) };
    },
    template: `
      <Table>
        <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead class="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(invoice, i) in invoices"
            :key="invoice.id"
            :data-state="i === 1 ? 'selected' : undefined"
          >
            <TableCell class="nds-font-medium">{{ invoice.id }}</TableCell>
            <TableCell>{{ invoice.status }}</TableCell>
            <TableCell>{{ invoice.method }}</TableCell>
            <TableCell class="nds-text-right">{{ invoice.amount }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha marcada carrega data-state="selected"', async () => {
      // functional.item4 — o estado é do `<tr>`, e é ele que o CSS compartilhado
      // pinta. Marcar a célula não pintaria a linha.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(3);
      await expect(lines[1]).toHaveAttribute('data-state', 'selected');
      for (const i of [0, 2]) {
        await expect(lines[i].hasAttribute('data-state')).toBe(false);
      }
    });

    await step('A linha marcada se destaca das demais', async () => {
      // visual.item5 — `.nds-table tbody tr[data-state="selected"]` pinta
      // hsl(var(--muted)). Sem contraste, a seleção existe só no atributo.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(getComputedStyle(lines[1]).backgroundColor).not.toBe(
        getComputedStyle(lines[0]).backgroundColor,
      );
    });
  },
};

const LINES_SKELETON = [1, 2, 3];

export const Loading: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item6'],
    // A tabela entra dentro de uma região com `aria-busy` e as células viram
    // esqueleto: o invólucro é metade da lição e o meta não o tem.
    docs: { source: { transform: tableLoadingSource } },
  },
  render: () => ({
    components: { ...COMPONENTES, Skeleton },
    setup() {
      return { colunas: COLUMNS, lines: LINES_SKELETON };
    },
    template: `
      <!-- aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem
           o container quem usa leitor de tela ouve uma tabela vazia sem saber
           que os dados estão a caminho. -->
      <div role="status" aria-busy="true" aria-label="Carregando faturas">
        <Table>
          <TableCaption class="nds-sr-only">Lista de faturas recentes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead v-for="coluna in colunas" :key="coluna">{{ coluna }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="line in lines" :key="line">
              <TableCell v-for="coluna in colunas" :key="coluna">
                <!-- Forma por atributo, nunca altura cravada: o esqueleto de uma
                     linha mede o que a linha vai medir quando o texto chegar, e
                     cresce junto com a fonte do navegador (WCAG 1.4.4). -->
                <Skeleton data-shape="text" data-width="3-4" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Uma célula de esqueleto por coluna, em cada linha', async () => {
      // visual.item6 — o esqueleto mede a caixa que o dado vai ocupar; a grade
      // não pode encolher enquanto carrega, senão a tabela salta ao chegar.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(LINES_SKELETON.length);
      for (const line of lines) {
        await expect(line.querySelectorAll('[data-slot="skeleton"]').length).toBe(
          COLUMNS.length,
        );
      }
      await expect(canvasElement.querySelectorAll('thead th').length).toBe(COLUMNS.length);
    });

    await step('O esqueleto some da árvore de acessibilidade; a região anuncia', async () => {
      // functional.item7 — o par é sempre este: esqueleto `aria-hidden` dentro
      // de região com nome e `aria-busy`. Esqueleto anunciado seria ruído;
      // região sem nome não seria anunciada de jeito nenhum.
      const regiao = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]')!;
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-label', 'Carregando faturas');
      for (const sk of canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
      }
    });
  },
};
