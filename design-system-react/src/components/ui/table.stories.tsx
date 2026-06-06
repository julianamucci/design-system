import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
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
import { TableDocs } from "@/components/docs/TableDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

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
  title: "UI/Table",
  component: Table,
  tags: ["autodocs", "tables"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(TableDocs) },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
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
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">R$ 1.400,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Elemento table está presente no DOM", async () => {
      const table = canvasElement.querySelector("table");
      await expect(table).not.toBeNull();
    });

    await step("thead e tbody estão presentes", async () => {
      const thead = canvasElement.querySelector("thead");
      const tbody = canvasElement.querySelector("tbody");
      await expect(thead).not.toBeNull();
      await expect(tbody).not.toBeNull();
    });

    await step("Número correto de linhas de dados (5)", async () => {
      const tbody = canvasElement.querySelector("tbody");
      const rows = tbody?.querySelectorAll("tr");
      await expect(rows?.length).toBe(5);
    });

    await step("TableHead tem scope='col'", async () => {
      const headers = canvasElement.querySelectorAll("th");
      for (const th of Array.from(headers)) {
        await expect(th.getAttribute("scope")).toBe("col");
      }
    });

    await step("TableCaption sr-only está no DOM", async () => {
      const caption = canvasElement.querySelector("caption");
      await expect(caption).not.toBeNull();
    });

    await step("TableFooter com total está presente", async () => {
      const tfoot = canvasElement.querySelector("tfoot");
      await expect(tfoot).not.toBeNull();
      const totalCell = canvas.getByText("R$ 1.400,00");
      await expect(totalCell).toBeInTheDocument();
    });
  },
};
