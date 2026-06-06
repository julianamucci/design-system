import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Table/Variantes',
  component: Table,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basica: Story = {
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
          <TableRow>
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
          <TableRow>
            <TableCell class="font-medium">#INV-004</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de débito</TableCell>
            <TableCell class="text-right">R$ 450,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-005</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Transferência</TableCell>
            <TableCell class="text-right">R$ 200,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();
  },
};

export const ComRodape: Story = {
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableFooter,
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
          <TableRow>
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
          <TableRow>
            <TableCell class="font-medium">#INV-004</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de débito</TableCell>
            <TableCell class="text-right">R$ 450,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-005</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Transferência</TableCell>
            <TableCell class="text-right">R$ 200,00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell :col-span="3">Total</TableCell>
            <TableCell class="text-right">R$ 1.400,00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();
  },
};

export const CaptionSrOnly: Story = {
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
      <div>
        <h2 class="text-lg font-semibold mb-4">Faturas recentes</h2>
        <Table>
          <TableCaption class="sr-only">Lista de faturas recentes</TableCaption>
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
            <TableRow>
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
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();
  },
};

export const ComAcoesPorLinha: Story = {
  render: () => ({
    components: {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
      Button,
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
            <TableHead scope="col" class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">#INV-001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de crédito</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-001">Ações</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Boleto bancário</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-002">Ações</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-003</TableCell>
            <TableCell>Cancelado</TableCell>
            <TableCell>Pix</TableCell>
            <TableCell class="text-right">R$ 350,00</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-003">Ações</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-004</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão de débito</TableCell>
            <TableCell class="text-right">R$ 450,00</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-004">Ações</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">#INV-005</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>Transferência</TableCell>
            <TableCell class="text-right">R$ 200,00</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" aria-label="Ações para fatura #INV-005">Ações</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    await expect(table).toBeInTheDocument();
  },
};
