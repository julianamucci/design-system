import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "UI/Table/Composições",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { invoice: "INV001", status: "Pago", method: "Cartão", amount: "R$ 250,00" },
  { invoice: "INV002", status: "Pendente", method: "PayPal", amount: "R$ 150,00" },
  { invoice: "INV003", status: "Em aberto", method: "Transferência", amount: "R$ 350,00" },
] as const;

export const Basic: Story = {
  name: "Básica",
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead className="text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Composição mais comum: apenas cabeçalho e corpo. Use quando a tabela não precisa de caption descritiva ou totais.",
      },
    },
  },
};

export const WithCaption: Story = {
  name: "Com Caption",
  render: () => (
    <Table>
      <TableCaption>Lista das faturas recentes.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead className="text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "`TableCaption` é renderizada abaixo da tabela (`caption-bottom`) e anunciada por leitores de tela antes dos cabeçalhos. Obrigatória quando a tabela precisa de contexto descritivo.",
      },
    },
  },
};

export const WithFooter: Story = {
  name: "Com Footer (totais)",
  render: () => (
    <Table>
      <TableCaption>Resumo das faturas do mês.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead className="text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">R$ 750,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "`TableFooter` agrega valores do corpo. Use `colSpan` para que o rótulo 'Total' ocupe as colunas não-numéricas e o valor fique alinhado com a coluna correspondente.",
      },
    },
  },
};

export const WithSelection: Story = {
  name: "Com linha selecionada",
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead className="text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Pago</TableCell>
          <TableCell className="text-right">R$ 250,00</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pendente</TableCell>
          <TableCell className="text-right">R$ 150,00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>Em aberto</TableCell>
          <TableCell className="text-right">R$ 350,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "O atributo `data-state=\"selected\"` na `<tr>` aplica fundo `bg-muted` persistente. Use em combinação com `Checkbox` para seleção múltipla.",
      },
    },
  },
};
