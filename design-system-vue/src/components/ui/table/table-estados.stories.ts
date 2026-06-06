import type { Meta, StoryObj } from '@storybook/vue3';
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

const meta = {
  title: 'UI/Table/Estados',
  component: Table,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableEmpty,
      TableHead,
      TableHeader,
      TableRow,
    },
    setup() { return {}; },
    template: `
      <Table>
        <TableCaption>Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead scope="col" class="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty :colspan="4">
            Nenhuma fatura encontrada.
          </TableEmpty>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tabela está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('Mensagem de empty state visível', async () => {
      await expect(canvas.getByText('Nenhuma fatura encontrada.')).toBeVisible();
    });

    await step('tbody contém apenas uma linha', async () => {
      const rows = canvasElement.querySelectorAll('tbody tr');
      await expect(rows.length).toBe(1);
    });
  },
};

export const LinhaSelecionada: Story = {
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    },
    setup() { return {}; },
    template: `
      <Table>
        <TableCaption>Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead scope="col" class="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">#INV-001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de crédito</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow data-state="selected">
            <TableCell class="font-medium">#INV-002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Boleto bancário</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-003</TableCell>
            <TableCell>Cancelado</TableCell>
            <TableCell>Pix</TableCell>
            <TableCell class="text-right">R$ 350,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tabela está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('Linha selecionada tem data-state="selected"', async () => {
      const selectedRow = canvasElement.querySelector('[data-state="selected"]');
      await expect(selectedRow).toBeInTheDocument();
      await expect(selectedRow?.tagName.toLowerCase()).toBe('tr');
    });

    await step('Apenas uma linha está selecionada', async () => {
      const selectedRows = canvasElement.querySelectorAll('[data-state="selected"]');
      await expect(selectedRows.length).toBe(1);
    });
  },
};

export const Carregando: Story = {
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
      Skeleton,
    },
    setup() { return {}; },
    template: `
      <Table>
        <TableCaption>Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead scope="col" class="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="i in 5" :key="i">
            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
            <TableCell><Skeleton class="h-4 w-16" /></TableCell>
            <TableCell><Skeleton class="h-4 w-28" /></TableCell>
            <TableCell class="text-right"><Skeleton class="h-4 w-16 ml-auto" /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tabela está presente no DOM', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('tbody contém 5 linhas de skeleton', async () => {
      const rows = canvasElement.querySelectorAll('tbody tr');
      await expect(rows.length).toBe(5);
    });

    await step('Skeletons estão presentes nas células', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBeGreaterThan(0);
    });
  },
};
