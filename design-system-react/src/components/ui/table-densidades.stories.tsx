import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "UI/Table/Densidades",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { invoice: "INV001", status: "Pago", amount: "R$ 250,00" },
  { invoice: "INV002", status: "Pendente", amount: "R$ 150,00" },
  { invoice: "INV003", status: "Em aberto", amount: "R$ 350,00" },
] as const;

export const Compact: Story = {
  name: "Compact (h-8)",
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="h-8" scope="col">Fatura</TableHead>
          <TableHead className="h-8" scope="col">Status</TableHead>
          <TableHead className="h-8 text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="py-1 font-medium">{row.invoice}</TableCell>
            <TableCell className="py-1">{row.status}</TableCell>
            <TableCell className="py-1 text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Densidade compacta (`h-8` no `TableHead`, `py-1` no `TableCell`). Use em dashboards com muitos dados onde a compactação visual é prioritária.",
      },
    },
  },
};

export const Default: Story = {
  name: "Default (h-10)",
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
        story: "Densidade padrão — o `TableHead` já vem com `h-10` por padrão e o `TableCell` com `p-2`. Use em uso geral: equilíbrio entre densidade e legibilidade.",
      },
    },
  },
};

export const Comfortable: Story = {
  name: "Comfortable (h-12)",
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="h-12" scope="col">Fatura</TableHead>
          <TableHead className="h-12" scope="col">Status</TableHead>
          <TableHead className="h-12 text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="py-4 font-medium">{row.invoice}</TableCell>
            <TableCell className="py-4">{row.status}</TableCell>
            <TableCell className="py-4 text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: "Densidade confortável (`h-12` no `TableHead`, `py-4` no `TableCell`). Use quando células contêm conteúdo rico: avatares, badges, múltiplas ações ou descrições.",
      },
    },
  },
};
