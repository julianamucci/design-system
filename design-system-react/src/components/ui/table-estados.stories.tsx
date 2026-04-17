import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta = {
  title: "UI/Table/Estados",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hover: Story = {
  name: "Hover (automático)",
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
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pendente</TableCell>
          <TableCell className="text-right">R$ 150,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Hover em linha do body aplica bg-muted/50", async () => {
      const firstRow = canvas.getAllByRole("row")[1];
      await userEvent.hover(firstRow);
      await expect(firstRow.className).toContain("hover:bg-muted/50");
    });
  },
  parameters: {
    docs: {
      description: {
        story: "`TableRow` aplica `hover:bg-muted/50` automaticamente — sem prop. O efeito vale para linhas do `<tbody>` e do `<tfoot>`.",
      },
    },
  },
};

export const Selected: Story = {
  name: "Selecionada (data-state)",
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
        <TableRow data-state="selected">
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Pago</TableCell>
          <TableCell className="text-right">R$ 250,00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pendente</TableCell>
          <TableCell className="text-right">R$ 150,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Linha com data-state=selected aplica bg-muted persistente", async () => {
      const selected = canvasElement.querySelector('tr[data-state="selected"]');
      await expect(selected).toBeInTheDocument();
      await expect(selected?.className).toContain("data-[state=selected]:bg-muted");
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Aplique `data-state=\"selected\"` na `<tr>` para marcar uma linha como selecionada. O fundo `bg-muted` persiste independente de hover.",
      },
    },
  },
};

export const Empty: Story = {
  name: "Vazio",
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
          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
            Nenhuma fatura encontrada. Crie a primeira para começar.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Renderiza linha única com colSpan cobrindo todas as colunas", async () => {
      const cells = canvasElement.querySelectorAll("tbody td");
      await expect(cells.length).toBe(1);
      await expect(cells[0].getAttribute("colspan")).toBe("3");
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Estado vazio: linha única com `colSpan` igual ao número de colunas da tabela. O texto deve descrever o vazio e sugerir próxima ação — nunca apenas 'Vazio'.",
      },
    },
  },
};

export const Scroll: Story = {
  name: "Scroll horizontal (automático)",
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fatura</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Método</TableHead>
            <TableHead scope="col">Data</TableHead>
            <TableHead scope="col">Cliente</TableHead>
            <TableHead className="text-right" scope="col">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium whitespace-nowrap">INV001</TableCell>
            <TableCell className="whitespace-nowrap">Pago</TableCell>
            <TableCell className="whitespace-nowrap">Cartão de crédito</TableCell>
            <TableCell className="whitespace-nowrap">12/04/2026</TableCell>
            <TableCell className="whitespace-nowrap">Empresa Alpha Ltda</TableCell>
            <TableCell className="text-right whitespace-nowrap">R$ 2.500,00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium whitespace-nowrap">INV002</TableCell>
            <TableCell className="whitespace-nowrap">Pendente</TableCell>
            <TableCell className="whitespace-nowrap">Transferência bancária</TableCell>
            <TableCell className="whitespace-nowrap">13/04/2026</TableCell>
            <TableCell className="whitespace-nowrap">Fornecedor Beta S.A.</TableCell>
            <TableCell className="text-right whitespace-nowrap">R$ 1.150,00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Wrapper aplica overflow-x-auto quando tabela excede a largura", async () => {
      const wrapper = canvasElement.querySelector("div.overflow-x-auto");
      await expect(wrapper).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "O wrapper de `Table` aplica `overflow-x-auto`, fazendo a barra de rolagem horizontal aparecer automaticamente quando a tabela excede a largura do container.",
      },
    },
  },
};
