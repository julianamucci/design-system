import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { INVOICES } from "./table.fixtures";
import {
  tableLoadingSource,
  tableLineSelecionadaSource,
  tableSource,
  tableVaziaSource,
} from "./table.source";

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "UI/Table/States",
  tags: ["tables"],
  parameters: {
    layout: "padded",
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: tableSource } },
  },
};

export default meta;
type Story = StoryObj;

const COLUMNS = ["Fatura", "Status", "Método", "Valor"];

// ─── Empty ───────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item2"],
    docs: {
      // A linha de mensagem com colSpan é composição do render.
      source: { transform: tableVaziaSource },
    },
  },
  render: () => (
    <Table>
      <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((coluna) => (
            <TableHead key={coluna}>{coluna}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          {/* colspan derivado do cabeçalho: com um número escrito à mão,
              acrescentar uma coluna deixaria a mensagem torta e ninguém veria
              até a próxima captura visual. */}
          <TableCell colSpan={COLUMNS.length} className="nds-table-empty">
            Nenhuma fatura encontrada.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A mensagem ocupa a largura inteira da tabela", async () => {
      // functional.item2 — sem o colspan a mensagem cairia sob a primeira
      // coluna e as outras três ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>("tbody td")!;
      await expect(celula).toHaveAttribute("colspan", String(COLUMNS.length));
      await expect(celula).toHaveTextContent("Nenhuma fatura encontrada.");
      await expect(canvasElement.querySelectorAll("tbody tr").length).toBe(1);
    });

    await step("A tabela continua nomeada e com os cabeçalhos no lugar", async () => {
      // Estado vazio não é motivo para desmontar a estrutura: quem usa leitor de
      // tela precisa saber que colunas voltarão a existir quando houver dados.
      await expect(canvas.getByRole("table", { name: /faturas recentes/ })).toBeTruthy();
      await expect(canvasElement.querySelectorAll("th").length).toBe(COLUMNS.length);
    });

    await step("A mensagem é centralizada e reserva a altura da caixa", async () => {
      // visual.item2 — `.nds-table-empty` é a regra compartilhada: centraliza,
      // apaga a cor e reserva ~96px. Antes a altura vinha de `style` inline em
      // cada stack, que é justamente o que sai da folha de estilo e do tema.
      const celula = canvasElement.querySelector<HTMLElement>("tbody td")!;
      await expect(getComputedStyle(celula).textAlign).toBe("center");
      await expect(celula.getBoundingClientRect().height).toBeGreaterThanOrEqual(90);
    });
  },
};

// ─── Linha Selecionada ───────────────────────────────────────────────────────

export const SelectedRow: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item5"],
    docs: {
      // O `data-state="selected"` só existe no render desta story.
      source: { transform: tableLineSelecionadaSource },
    },
  },
  render: () => (
    <Table>
      <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead className="nds-text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.slice(0, 3).map((invoice, i) => (
          <TableRow key={invoice.id} data-state={i === 1 ? "selected" : undefined}>
            <TableCell className="nds-font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="nds-text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha marcada carrega data-state="selected"', async () => {
      // functional.item4 — o estado é do `<tr>`, e é ele que o CSS compartilhado
      // pinta. Marcar a célula não pintaria a linha.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")];
      await expect(lines.length).toBe(3);
      await expect(lines[1]).toHaveAttribute("data-state", "selected");
      for (const i of [0, 2]) {
        await expect(lines[i].hasAttribute("data-state")).toBe(false);
      }
    });

    await step("A linha marcada se destaca das demais", async () => {
      // visual.item5 — `.nds-table tbody tr[data-state="selected"]` pinta
      // hsl(var(--muted)). Sem contraste, a seleção existe só no atributo.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")];
      await expect(getComputedStyle(lines[1]).backgroundColor).not.toBe(
        getComputedStyle(lines[0]).backgroundColor,
      );
    });
  },
};

// ─── Carregando ──────────────────────────────────────────────────────────────

const LINES_SKELETON = [1, 2, 3];

export const Loading: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item6"],
    docs: {
      // A região com aria-busy em volta e os esqueletos são do render.
      source: { transform: tableLoadingSource },
    },
  },
  render: () => (
    // aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem o
    // container quem usa leitor de tela ouve uma tabela vazia sem saber que os
    // dados estão a caminho.
    <div role="status" aria-busy="true" aria-label="Carregando faturas">
      <Table>
        <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((coluna) => (
              <TableHead key={coluna}>{coluna}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {LINES_SKELETON.map((line) => (
            <TableRow key={line}>
              {COLUMNS.map((coluna) => (
                <TableCell key={coluna}>
                  {/* Forma por atributo, nunca altura cravada: o esqueleto de
                      uma linha mede o que a linha vai medir quando o texto
                      chegar, e cresce junto com a fonte do navegador
                      (guideline 12, WCAG 1.4.4). */}
                  <Skeleton data-shape="text" data-width="3-4" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Uma célula de esqueleto por coluna, em cada linha", async () => {
      // visual.item6 — o esqueleto mede a caixa que o dado vai ocupar; a grade
      // não pode encolher enquanto carrega, senão a tabela salta ao chegar.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")];
      await expect(lines.length).toBe(LINES_SKELETON.length);
      for (const line of lines) {
        await expect(line.querySelectorAll('[data-slot="skeleton"]').length).toBe(
          COLUMNS.length,
        );
      }
      await expect(canvasElement.querySelectorAll("thead th").length).toBe(COLUMNS.length);
    });

    await step("O esqueleto some da árvore de acessibilidade; a região anuncia", async () => {
      // functional.item7 — o par é sempre este: esqueleto `aria-hidden` dentro
      // de região com nome e `aria-busy`. Esqueleto anunciado seria ruído;
      // região sem nome não seria anunciada de jeito nenhum.
      const regiao = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]')!;
      await expect(regiao).toHaveAttribute("role", "status");
      await expect(regiao).toHaveAttribute("aria-label", "Carregando faturas");
      for (const sk of canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')) {
        await expect(sk).toHaveAttribute("aria-hidden", "true");
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
      }
    });
  },
};
