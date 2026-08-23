import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { INVOICES, TOTAL } from "./table.fixtures";
import {
  lineTableActionsSource,
  tableBasicaSource,
  tableCaptionOcultaSource,
  tableScrollHorizontalSource,
  tableSource,
} from "./table.source";

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "UI/Table/Variants",
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

// O cabeçalho da coluna numérica recebe `nds-text-right` junto com as células:
// número se lê pela unidade, alinhado à direita, e o rótulo tem de acompanhar.
// A classe só passou a valer no `<th>` quando o CSS compartilhado rebaixou o
// seletor para `:where(.nds-table) th`; antes disso estas páginas alinhavam por
// `style` inline. É por isso que as stories afirmam o alinhamento COMPUTADO, e
// não a presença da classe.

// ─── Básica ──────────────────────────────────────────────────────────────────

export const Basic: Story = {
  parameters: {
    covers: ["functional.item1", "visual.item1"],
    docs: {
      // A legenda visível e a ausência de rodapé são afirmadas no render.
      source: { transform: tableBasicaSource },
    },
  },
  render: () => (
    <Table>
      <TableCaption>Lista de faturas recentes</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead className="nds-text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((invoice) => (
          <TableRow key={invoice.id}>
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
    const canvas = within(canvasElement);

    await step("Uma linha por registro, quatro colunas por linha", async () => {
      // functional.item1 — a conta sai da fixture, nunca de um número escrito à
      // mão: um dado a menos deixaria a asserção verde e a tabela errada.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")];
      await expect(lines.length).toBe(INVOICES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line).toHaveAttribute("data-slot", "table-row");
        await expect(line.querySelectorAll("td").length).toBe(4);
        await expect(line).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step("A coluna de valores alinha à direita, rótulo junto com os números", async () => {
      // visual.item1 — é o caso de uso central de `nds-text-right`. A asserção é
      // do alinhamento computado: por muito tempo a classe existia no markup e
      // não pintava nada, e nenhuma story reprovava por isso.
      const ths = [...canvasElement.querySelectorAll<HTMLElement>("thead th")];
      await expect(ths[3]).toHaveTextContent("Valor");
      await expect(getComputedStyle(ths[3]).textAlign).toBe("right");
      const valueTd = canvasElement.querySelector<HTMLElement>("tbody tr td:last-child")!;
      await expect(getComputedStyle(valueTd).textAlign).toBe("right");
      // A coluna descritiva continua à esquerda: o alinhamento é escolha por
      // coluna, não estilo da tabela.
      await expect(getComputedStyle(ths[0]).textAlign).toBe("left");
    });

    await step("A legenda visível é o nome acessível da tabela", async () => {
      const tabela = canvas.getByRole("table", { name: /faturas recentes/ });
      const caption = tabela.querySelector<HTMLElement>("caption")!;
      await expect(caption.classList.contains("nds-sr-only")).toBe(false);
    });
  },
};

// ─── Com Rodapé ──────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: { covers: ["functional.item3", "visual.item3"] },
  render: () => (
    <Table>
      <TableCaption className="nds-sr-only">Faturas recentes com total</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead className="nds-text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="nds-font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="nds-text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="nds-text-right">{TOTAL}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    await step("O rodapé fica depois do corpo e cobre as três primeiras colunas", async () => {
      // functional.item3 — o `colspan` é o que faz o rótulo "Total" ocupar a
      // largura das colunas descritivas e o valor cair sob a coluna certa.
      const tabela = canvasElement.querySelector<HTMLElement>("table")!;
      const tfoot = tabela.querySelector<HTMLElement>("tfoot")!;
      await expect(tfoot).toHaveAttribute("data-slot", "table-footer");
      const position = tabela.querySelector("tbody")!.compareDocumentPosition(tfoot);
      await expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await expect(tfoot.querySelector("td")).toHaveAttribute("colspan", "3");
      await expect(tfoot).toHaveTextContent(TOTAL);
      // O total não é registro: o corpo continua com as mesmas cinco linhas.
      await expect(tabela.querySelectorAll("tbody tr").length).toBe(INVOICES.length);
    });

    await step("O rodapé se distingue do corpo por fundo próprio", async () => {
      // visual.item3 — `.nds-table tfoot tr` pinta hsl(var(--muted) / 0.5). Sem
      // a distinção o sumário some no meio dos registros.
      const lineFooter = canvasElement.querySelector<HTMLElement>("tfoot tr")!;
      const lineBody = canvasElement.querySelector<HTMLElement>("tbody tr")!;
      await expect(getComputedStyle(lineFooter).backgroundColor).not.toBe(
        getComputedStyle(lineBody).backgroundColor,
      );
    });
  },
};

// ─── Legenda só para leitor de tela ──────────────────────────────────────────

export const CaptionSrOnly: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item2"],
    docs: {
      // O título visível ao lado da legenda invisível é o par que a story ensina.
      source: { transform: tableCaptionOcultaSource },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <h2 className="nds-text-h3 nds-m-0">Faturas recentes</h2>
      <Table>
        <TableCaption className="nds-sr-only">Lista de faturas recentes</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fatura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="nds-text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="nds-font-medium">{invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell className="nds-text-right">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A legenda está no DOM e fora da tela", async () => {
      // functional.item6 — `display: none` tiraria também da árvore de
      // acessibilidade; a classe de leitor de tela recorta a caixa e mantém a
      // leitura. A asserção é do EFEITO: verificar o nome da classe deixava
      // passar o caso em que ela existe no markup e não existe no CSS — foi
      // exatamente o que aconteceu no Vanilla, com um `sr-only` sem prefixo.
      const caption = canvasElement.querySelector<HTMLElement>("caption")!;
      await expect(caption).toHaveTextContent("Lista de faturas recentes");
      await expect(getComputedStyle(caption).position).toBe("absolute");
      const r = caption.getBoundingClientRect();
      await expect(Math.max(r.width, r.height)).toBeLessThanOrEqual(2);
    });

    await step("A tabela continua nomeada para o leitor de tela", async () => {
      // accessibility.item2 — é isto que a legenda invisível existe para
      // garantir; sem ela o leitor anuncia só "tabela".
      await expect(canvas.getByRole("table", { name: /Lista de faturas recentes/ })).toBeTruthy();
    });
  },
};

// ─── Com Ações por Linha ─────────────────────────────────────────────────────

export const WithRowActions: Story = {
  parameters: {
    covers: ["accessibility.item3", "visual.item4"],
    docs: {
      // A coluna de ações é composição do render, com Button e ícone mudo.
      source: { transform: lineTableActionsSource },
    },
  },
  render: () => (
    <Table>
      <TableCaption className="nds-sr-only">Faturas recentes com ações</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead className="nds-text-right">Valor</TableHead>
          {/* O cabeçalho da coluna de ações não é decorativo: sem ele a coluna
              existe para quem vê e some para quem navega por cabeçalhos. O
              rótulo fica só para leitor de tela porque a coluna não tem título
              visível no desenho. */}
          <TableHead>
            <span className="nds-sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="nds-font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="nds-text-right">{invoice.amount}</TableCell>
            <TableCell className="nds-text-right">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Ações para fatura ${invoice.id}`}
              >
                <MoreHorizontal className="nds-icon" aria-hidden="true" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cada ação diz a qual fatura pertence", async () => {
      // accessibility.item3 — cinco botões chamados "Ações" seriam cinco
      // controles indistinguíveis na lista de elementos do leitor de tela. O
      // nome acessível sai do aria-label, nunca do ícone.
      const buttons = canvas.getAllByRole("button");
      await expect(buttons.length).toBe(INVOICES.length);
      for (const [i, button] of buttons.entries()) {
        await expect(button).toHaveAccessibleName(`Ações para fatura ${INVOICES[i].id}`);
        // O botão mora dentro da própria linha do registro que ele opera.
        await expect(button.closest("tr")).toHaveTextContent(INVOICES[i].id);
      }
    });

    await step("O botão de ação é discreto (variante ghost) e o ícone é mudo", async () => {
      // visual.item4 — a coluna de ações não pode competir com o dado; o ghost
      // é o que o conteúdo compartilhado documenta para ação por linha.
      const button = canvas.getAllByRole("button")[0];
      await expect(button).toHaveClass("nds-button-ghost");
      await expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  },
};

// ─── Rolagem horizontal ──────────────────────────────────────────────────────

// Dois anos de competência, não um: com doze colunas a tabela ainda cabe num
// canvas largo, e a story provaria a rolagem só nos viewports estreitos.
const MONTHS = ["2025", "2026"].flatMap((year) =>
  ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(
    (month) => `${month}/${year}`,
  ),
);

export const HorizontalScroll: Story = {
  parameters: {
    covers: ["functional.item5"],
    docs: {
      // As 24 colunas que provocam a rolagem só existem no render.
      source: { transform: tableScrollHorizontalSource },
    },
  },
  render: () => (
    <Table>
      <TableCaption className="nds-sr-only">Faturas por mês de competência</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fatura</TableHead>
          {MONTHS.map((month) => (
            <TableHead key={month}>{month}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.slice(0, 3).map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="nds-font-medium">{invoice.id}</TableCell>
            {MONTHS.map((month) => (
              <TableCell key={month} className="nds-text-right">
                {invoice.amount}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Quem rola é o container, e ele aceita foco", async () => {
      // functional.item5 — sem o wrapper a tabela empurraria a página inteira
      // para o lado; sem o tabindex a rolagem existiria só para o mouse
      // (axe scrollable-region-focusable, WCAG 2.1.1).
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      await expect(wrapper).toHaveClass("nds-table-wrapper");
      await expect(wrapper).toHaveAttribute("tabindex", "0");
      await expect(getComputedStyle(wrapper).overflowX).toBe("auto");
      await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    });

    await step("A rolagem chega ao fim da tabela", async () => {
      const wrapper = canvasElement.querySelector<HTMLElement>('[data-slot="table-container"]')!;
      wrapper.focus();
      await expect(wrapper).toHaveFocus();
      wrapper.scrollLeft = wrapper.scrollWidth;
      await expect(wrapper.scrollLeft).toBeGreaterThan(0);
    });
  },
};
