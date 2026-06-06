import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { MoreHorizontal } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
import { Button } from "@/components/ui/button";

// ─── Dados de exemplo ────────────────────────────────────────────────────────

const invoices = [
  { id: "#INV-001", status: "Pago",      method: "Cartão de crédito",  amount: "R$ 250,00" },
  { id: "#INV-002", status: "Pendente",  method: "Boleto bancário",    amount: "R$ 150,00" },
  { id: "#INV-003", status: "Cancelado", method: "Pix",                amount: "R$ 350,00" },
  { id: "#INV-004", status: "Pago",      method: "Cartão de débito",   amount: "R$ 450,00" },
  { id: "#INV-005", status: "Pendente",  method: "Transferência",      amount: "R$ 200,00" },
];

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Table/Variantes",
  tags: ["tables"],
  component: Table,
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Básica ──────────────────────────────────────────────────────────────────

export const Basica: Story = {
  play: async ({ canvasElement, step }) => {
    await step("table e thead/tbody presentes", async () => {
      await expect(canvasElement.querySelector("table")).not.toBeNull();
      await expect(canvasElement.querySelector("thead")).not.toBeNull();
      await expect(canvasElement.querySelector("tbody")).not.toBeNull();
    });
  },
  render: () => (
    <Table>
      <TableCaption>Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead scope="col" className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ─── Com Rodapé ──────────────────────────────────────────────────────────────

export const ComRodape: Story = {
  play: async ({ canvasElement, step }) => {
    await step("tfoot presente", async () => {
      await expect(canvasElement.querySelector("tfoot")).not.toBeNull();
    });
  },
  render: () => (
    <Table>
      <TableCaption>Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead scope="col" className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">R$ 1.400,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

// ─── Caption sr-only ─────────────────────────────────────────────────────────

export const CaptionSrOnly: Story = {
  play: async ({ canvasElement, step }) => {
    await step("caption no DOM com sr-only", async () => {
      const caption = canvasElement.querySelector("caption");
      await expect(caption).not.toBeNull();
      await expect(caption?.className).toContain("sr-only");
    });
  },
  render: () => (
    <Table>
      <TableCaption className="sr-only">Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead scope="col" className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ─── Com Ações por Linha ─────────────────────────────────────────────────────

export const ComAcoesPorLinha: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("botões de ação têm aria-label contextual", async () => {
      const buttons = canvas.getAllByRole("button");
      await expect(buttons.length).toBe(5);
      await expect(buttons[0]).toHaveAttribute("aria-label", "Ações para fatura #INV-001");
    });
  },
  render: () => (
    <Table>
      <TableCaption>Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead scope="col" className="text-right">Valor</TableHead>
          <TableHead scope="col" className="w-10">
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ações para fatura ${invoice.id}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
