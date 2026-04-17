import type { Meta, StoryObj } from '@storybook/vue3';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './index';

const meta = {
  title: 'UI/Table/Densidades',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  name: 'Compact (h-8)',
  render: () => ({
    components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="h-8" scope="col">Fatura</TableHead>
            <TableHead class="h-8" scope="col">Status</TableHead>
            <TableHead class="h-8 text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="py-1 font-medium">INV001</TableCell>
            <TableCell class="py-1">Pago</TableCell>
            <TableCell class="py-1 text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="py-1 font-medium">INV002</TableCell>
            <TableCell class="py-1">Pendente</TableCell>
            <TableCell class="py-1 text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="py-1 font-medium">INV003</TableCell>
            <TableCell class="py-1">Em aberto</TableCell>
            <TableCell class="py-1 text-right">R$ 350,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade compacta (`h-8` no `TableHead`, `py-1` no `TableCell`). Use em dashboards com muitos dados onde a compactação visual é prioritária.',
      },
    },
  },
};

export const Default: Story = {
  name: 'Default (h-10)',
  render: () => ({
    components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead class="text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">INV001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV003</TableCell>
            <TableCell>Em aberto</TableCell>
            <TableCell class="text-right">R$ 350,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade padrão — o `TableHead` já vem com `h-10` por padrão e o `TableCell` com `p-2`. Use em uso geral: equilíbrio entre densidade e legibilidade.',
      },
    },
  },
};

export const Comfortable: Story = {
  name: 'Comfortable (h-12)',
  render: () => ({
    components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="h-12" scope="col">Fatura</TableHead>
            <TableHead class="h-12" scope="col">Status</TableHead>
            <TableHead class="h-12 text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="py-4 font-medium">INV001</TableCell>
            <TableCell class="py-4">Pago</TableCell>
            <TableCell class="py-4 text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="py-4 font-medium">INV002</TableCell>
            <TableCell class="py-4">Pendente</TableCell>
            <TableCell class="py-4 text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="py-4 font-medium">INV003</TableCell>
            <TableCell class="py-4">Em aberto</TableCell>
            <TableCell class="py-4 text-right">R$ 350,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Densidade confortável (`h-12` no `TableHead`, `py-4` no `TableCell`). Use quando células contêm conteúdo rico: avatares, badges, múltiplas ações ou descrições.',
      },
    },
  },
};
