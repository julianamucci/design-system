import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createDataTable } from './data-table';
import { dataTableSource, dataTableSourceWith } from './data-table.source';
import { type Invoice, baseColumns, invoices } from './data-table.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['tables'],
  title: 'Primitives/Tables/DataTable/States',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: dataTableSource } },
  },
};

export default meta;
type Story = StoryObj;

// ─── NoResults ─────────────────────────────────────────────────────────────

export const NoResults: Story = {
  render: () =>
    createDataTable<Invoice>({
      columns: baseColumns,
      data: [],
      enableRowSelection: true,
      emptyMessage: 'Nenhuma fatura encontrada.',
    }),
  parameters: {
    covers: ['visual.item6'],
    controls: { disable: true },
    actions: { disable: true },
    // Sem resultado é DADO vazio com a grade montada, e o texto da mensagem
    // difere do padrão da fábrica.
    docs: {
      source: {
        transform: dataTableSourceWith({
          semDados: true,
          enableRowSelection: true,
          emptyMessage: 'Nenhuma fatura encontrada.',
        }),
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // visual.item6 — sem o colspan a mensagem cairia sob a primeira coluna e
      // as outras cinco ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>(
        '.nds-data-table-empty',
      )!;
      // Seis: as cinco colunas mais a de seleção. Derivado, nunca escrito à mão.
      await expect(celula).toHaveAttribute('colspan', String(baseColumns.length + 1));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A estrutura e a toolbar sobrevivem ao vazio', async () => {
      // Estado vazio não é motivo para desmontar a grade: quem usa leitor de
      // tela precisa saber que colunas voltarão quando houver dados — e quem
      // esvaziou o resultado com um filtro precisa do campo para desfazer.
      await expect(canvas.getByRole('table')).toBeInTheDocument();
      await expect(canvasElement.querySelectorAll('thead tr:first-child th').length).toBe(
        baseColumns.length + 1,
      );
      await expect(canvas.getByRole('searchbox')).toBeInTheDocument();
    });

    await step('Sem linha nenhuma, o cabeçalho de seleção não fica marcado', async () => {
      // "Todas selecionadas" com zero linhas seria verdade vazia — e o checkbox
      // nasceria marcado numa tabela sem nada para marcar.
      const allBox = canvas.getByRole('checkbox', {
        name: 'Selecionar todas as linhas',
      });
      await expect(allBox).toHaveAttribute('aria-checked', 'false');
      await expect(canvasElement.querySelector("[role='status']")).toHaveTextContent(
        '0 de 0 linha(s) selecionada(s).',
      );
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => probeHost(
    'Sonda de limpeza: a tabela é montada, o menu de colunas é aberto, o estado muda duas vezes e a tabela sai da página.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createDataTable<Invoice>({
          columns: baseColumns,
          data: invoices.slice(0, 3),
          enableColumnVisibility: true,
          enablePagination: false,
        }),
        exercitar: (no) => {
          const table = (no as HTMLElement & { __table?: { setGlobalFilter: (v: string) => void } }).__table;
          no.querySelector<HTMLElement>('.nds-data-table-columns-btn')?.click();
          table?.setGlobalFilter('a');
          table?.setGlobalFilter('');
        },
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
