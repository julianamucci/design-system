import type { Meta, StoryObj } from '@storybook/vue3';
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

const meta = {
  title: 'UI/Table/Composições',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Básica',
  render: () => ({
    components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead class="text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium">INV001</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Cartão</TableCell>
            <TableCell class="text-right">R$ 250,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV002</TableCell>
            <TableCell>Pendente</TableCell>
            <TableCell>PayPal</TableCell>
            <TableCell class="text-right">R$ 150,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">INV003</TableCell>
            <TableCell>Em aberto</TableCell>
            <TableCell>Transferência</TableCell>
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
          'Composição mais comum: apenas cabeçalho e corpo. Use quando a tabela não precisa de caption descritiva ou totais.',
      },
    },
  },
};

export const WithCaption: Story = {
  name: 'Com Caption',
  render: () => ({
    components: { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableCaption>Lista das faturas recentes.</TableCaption>
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
        </TableBody>
      </Table>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`TableCaption` é renderizada abaixo da tabela (`caption-bottom`) e anunciada por leitores de tela antes dos cabeçalhos. Obrigatória quando a tabela precisa de contexto descritivo.',
      },
    },
  },
};

export const WithFooter: Story = {
  name: 'Com Footer (totais)',
  render: () => ({
    components: { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableCaption>Resumo das faturas do mês.</TableCaption>
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
        <TableFooter>
          <TableRow>
            <TableCell :colspan="2">Total</TableCell>
            <TableCell class="text-right">R$ 750,00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`TableFooter` agrega valores do corpo. Use `colspan` para que o rótulo "Total" ocupe as colunas não-numéricas e o valor fique alinhado com a coluna correspondente.',
      },
    },
  },
};

export const WithSelection: Story = {
  name: 'Com linha selecionada',
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
          <TableRow data-state="selected">
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
          'O atributo `data-state="selected"` na `<tr>` aplica fundo `bg-muted` persistente. Use em combinação com `Checkbox` para seleção múltipla.',
      },
    },
  },
};
