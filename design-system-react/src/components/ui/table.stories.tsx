import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
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
import { TableDocs } from "@/components/docs/TableDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

// ─── Mock de dados ───────────────────────────────────────────────────────────

const invoices = [
  { invoice: "INV001", status: "Pago", method: "Cartão de crédito", amount: "R$ 250,00" },
  { invoice: "INV002", status: "Pendente", method: "PayPal", amount: "R$ 150,00" },
  { invoice: "INV003", status: "Em aberto", method: "Transferência", amount: "R$ 350,00" },
  { invoice: "INV004", status: "Pago", method: "Cartão de crédito", amount: "R$ 450,00" },
  { invoice: "INV005", status: "Pago", method: "PayPal", amount: "R$ 550,00" },
] as const;

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(TableDocs) },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────

/**
 * Tabela completa com `<caption>`, `<thead>`, `<tbody>` e `<tfoot>`.
 * Cobre a estrutura semântica recomendada para dados tabulares.
 *
 * @summary Demonstração interativa do componente Table.
 */
export const Playground: Story = {
  render: () => (
    <Table>
      <TableCaption>Lista das faturas recentes.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]" scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead className="text-right" scope="col">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">R$ 1.750,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Renderiza elemento <table>", async () => {
      const table = canvas.getByRole("table");
      await expect(table).toBeInTheDocument();
    });

    await step("Renderiza <caption> visível abaixo da tabela", async () => {
      const caption = canvasElement.querySelector("caption");
      await expect(caption).toBeInTheDocument();
      await expect(caption).toHaveTextContent("Lista das faturas recentes.");
    });

    await step("Todos os <th> usam scope=col", async () => {
      const headers = canvasElement.querySelectorAll("th");
      await expect(headers.length).toBeGreaterThan(0);
      headers.forEach((th) => {
        expect(th.getAttribute("scope")).toBe("col");
      });
    });

    await step("Corpo da tabela tem 5 linhas de dados", async () => {
      const bodyRows = canvasElement.querySelectorAll("tbody tr");
      await expect(bodyRows.length).toBe(5);
    });

    await step("Footer renderiza célula com colSpan=3", async () => {
      const footerCell = canvasElement.querySelector("tfoot td");
      await expect(footerCell).toBeInTheDocument();
      await expect(footerCell?.getAttribute("colspan")).toBe("3");
    });

    await step("Hover em linha aplica bg-muted/50", async () => {
      const firstRow = canvasElement.querySelectorAll("tbody tr")[0];
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain("hover:bg-muted/50");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Cobre os critérios de estrutura semântica: <caption> presente, <th> com scope, body e footer com colSpan, hover automático em linhas. Veja a aba **Interactions** para acompanhar a execução.",
      },
    },
  },
};
