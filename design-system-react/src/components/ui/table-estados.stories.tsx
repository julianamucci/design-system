import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: "UI/Table/Estados",
  tags: ["tables"],
  component: Table,
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Empty ───────────────────────────────────────────────────────────────────

export const Empty: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("mensagem de empty state visível", async () => {
      const msg = canvas.getByText("Nenhum dado encontrado.");
      await expect(msg).toBeInTheDocument();
    });
    await step("tbody tem 1 linha com colSpan", async () => {
      const cell = canvasElement.querySelector("td[colspan]");
      await expect(cell).not.toBeNull();
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
        <TableRow>
          <TableCell
            colSpan={4}
            className="h-24 text-center text-muted-foreground"
          >
            Nenhum dado encontrado.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// ─── Linha Selecionada ───────────────────────────────────────────────────────

export const LinhaSelecionada: Story = {
  play: async ({ canvasElement, step }) => {
    await step("TableRow com data-state='selected' presente", async () => {
      const selected = canvasElement.querySelector('[data-state="selected"]');
      await expect(selected).not.toBeNull();
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
        <TableRow>
          <TableCell className="font-medium">#INV-001</TableCell>
          <TableCell>Pago</TableCell>
          <TableCell>Cartão de crédito</TableCell>
          <TableCell className="text-right">R$ 250,00</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell className="font-medium">#INV-002</TableCell>
          <TableCell>Pendente</TableCell>
          <TableCell>Boleto bancário</TableCell>
          <TableCell className="text-right">R$ 150,00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">#INV-003</TableCell>
          <TableCell>Cancelado</TableCell>
          <TableCell>Pix</TableCell>
          <TableCell className="text-right">R$ 350,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// ─── Carregando ──────────────────────────────────────────────────────────────

export const Carregando: Story = {
  play: async ({ canvasElement, step }) => {
    await step("linhas de skeleton renderizadas (3 linhas)", async () => {
      const rows = canvasElement.querySelectorAll("tbody tr");
      await expect(rows.length).toBe(3);
    });
    await step("skeleton com animate-pulse presente", async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]');
      await expect(skeleton).not.toBeNull();
    });
  },
  render: () => (
    <Table>
      <TableCaption className="sr-only">Carregando faturas...</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Fatura</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Método</TableHead>
          <TableHead scope="col" className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
