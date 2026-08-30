import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import DataTable from './data-table.svelte';
import {
  dataTablePaginadaSource,
  lineDataTableLabelSource,
  dataTableSource,
  dataTableVirtualizadaSource,
} from './data-table.source';
import { invoices, baseColumns, type Invoice } from './data-table.fixtures';

const meta: Meta = {
  title: 'Primitives/Tables/DataTable/Settings',
  component: DataTable,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Cascateia para todas as stories do arquivo; cada configuração sobrescreve
    // com a própria composição logo abaixo.
    docs: { source: { transform: dataTableSource } },
  },
};

export default meta;
type Story = StoryObj;

// Paginação ─────────────────────────────────────────────────────────────────

/** Doze faturas em páginas de cinco: três páginas, a última incompleta. */
const PAGE_SIZE = 5;
const TOTAL_PAGES = Math.ceil(invoices.length / PAGE_SIZE);

export const Paginated: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableGlobalFilter: false,
    pageSize: PAGE_SIZE,
    // O tamanho inicial precisa existir entre as opções do seletor: fora da
    // lista, o `select` não tem opção marcada e passa a exibir a primeira,
    // dizendo "10" numa tabela que mostra cinco.
    pageSizeOptions: [PAGE_SIZE, 10],
  },
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: dataTablePaginadaSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** Identificador da primeira linha — o que prova qual fatia está na tela. */
    const firstInvoice = () => lines()[0].textContent!.trim();

    const first = () => canvas.getByRole('button', { name: 'Primeira página' }) as HTMLButtonElement;
    const previous = () => canvas.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
    const next = () => canvas.getByRole('button', { name: 'Próxima página' }) as HTMLButtonElement;
    const last = () => canvas.getByRole('button', { name: 'Última página' }) as HTMLButtonElement;

    // Precondição do passo, e não herança do anterior: o replay reexecuta a play
    // no MESMO DOM, e a última rodada pode ter parado em qualquer página. Na
    // primeira montagem o botão nasce desabilitado — e clicar em botão
    // desabilitado é impossível para quem usa, então nem o teste tenta.
    await step('Voltar ao começo deixa os dois botões de volta apagados', async () => {
      if (!first().disabled) await userEvent.click(first());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-001');
      });
      await expect(lines().length).toBe(PAGE_SIZE);
      await expect(canvas.getByText(`Página 1 de ${TOTAL_PAGES}`)).toBeInTheDocument();

      await expect(first()).toBeDisabled();
      await expect(previous()).toBeDisabled();
      await expect(next()).toBeEnabled();
      await expect(last()).toBeEnabled();
    });

    await step('Avançar uma página troca a fatia de linhas', async () => {
      // functional.item8 — o número da página mudar não bastaria: um rodapé
      // pode contar errado e mostrar sempre as mesmas linhas. A prova é a
      // primeira fatura da página ser outra.
      await userEvent.click(next());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_PAGES}`)).toBeInTheDocument();
      await expect(first()).toBeEnabled();
      await expect(previous()).toBeEnabled();
      await expect(last()).toBeEnabled();
    });

    await step('O salto para a última página respeita a fatia incompleta', async () => {
      await userEvent.click(last());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-011');
      });
      // Doze faturas em páginas de cinco deixam duas na última — número
      // derivado da fixture, nunca escrito à mão.
      await expect(lines().length).toBe(invoices.length % PAGE_SIZE);
      await expect(
        canvas.getByText(`Página ${TOTAL_PAGES} de ${TOTAL_PAGES}`),
      ).toBeInTheDocument();

      await expect(next()).toBeDisabled();
      await expect(last()).toBeDisabled();
      await expect(previous()).toBeEnabled();
    });

    await step('Retroceder uma página é o caminho inverso do avanço', async () => {
      await userEvent.click(previous());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_PAGES}`)).toBeInTheDocument();
    });

    await step('O seletor de tamanho remonta a fatia', async () => {
      const selector = canvas.getByRole('combobox', { name: 'Linhas por página' });
      await userEvent.selectOptions(selector, '10');
      await waitFor(async () => {
        await expect(lines().length).toBe(10);
      });
      // Trocar o tamanho da página não pode deixar o leitor numa página que
      // deixou de existir.
      await expect(canvas.getByText('Página 1 de 2')).toBeInTheDocument();

      // Fecha o ciclo: a rodada seguinte — e a captura de regressão visual —
      // partem da fatia de cinco, na página 1.
      await userEvent.selectOptions(selector, String(PAGE_SIZE));
      await waitFor(async () => {
        await expect(lines().length).toBe(PAGE_SIZE);
      });
      if (!first().disabled) await userEvent.click(first());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-001');
      });
    });
  },
};

// Rótulo de linha explícito ─────────────────────────────────────────────────

/**
 * O primeiro degrau do fallback: quem monta a tabela diz qual campo identifica a
 * linha. O Playground prova o degrau do meio (o identificador sai da primeira
 * coluna); aqui a escolha é explícita e vence a primeira coluna.
 */
export const ExplicitRowLabel: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableRowSelection: true,
    enableGlobalFilter: false,
    enablePagination: false,
    rowKey: (f: Invoice) => f.id,
    rowLabel: (f: Invoice) => f.customer,
  },
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: lineDataTableLabelSource } },
  },
  play: async ({ canvasElement, step }) => {
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const lineBox = (line: HTMLElement) =>
      line.querySelector<HTMLElement>("[role='checkbox']")!;
    /** Terceira célula: a coluna "Cliente", de onde `rowLabel` tira o texto. */
    const cliente = (line: HTMLElement) =>
      line.querySelectorAll('td')[2]!.textContent!.trim();

    await step('O nome do controle sai de rowLabel, e não da primeira coluna', async () => {
      // A prova precisa do CONTRASTE: se `rowLabel` fosse ignorado, o nome
      // cairia no identificador da primeira coluna ("INV-001") e a asserção
      // seguinte reprovaria.
      for (const line of lines()) {
        await expect(lineBox(line)).toHaveAttribute(
          'aria-label',
          `Selecionar linha ${cliente(line)}`,
        );
      }
    });

    await step('Nenhuma linha repete o nome de outra', async () => {
      const names = lines().map((l) => lineBox(l).getAttribute('aria-label') ?? '');
      await expect(names.length).toBe(invoices.length);
      await expect(new Set(names).size).toBe(names.length);
    });
  },
};

// Virtualização ─────────────────────────────────────────────────────────────
const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, '0')}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  // Determinístico de propósito: `Math.random()` faria a captura do Chromatic
  // divergir a cada execução.
  amount: (i * 37) % 2000,
}));

export const Virtualized1000Rows: Story = {
  args: {
    columns: baseColumns as never,
    data: bigData,
    virtualized: true,
    maxHeight: '400px',
    enableColumnVisibility: false,
  },
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      canvas: { sourceState: 'none' },
      source: { transform: dataTableVirtualizadaSource },
    },
  },
  play: async ({ canvasElement, step }) => {
    const rolador = () => canvasElement.querySelector<HTMLElement>('.nds-data-table-scroll')!;
    const datumLines = () =>
      [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')].filter(
        (tr) => !tr.hasAttribute('aria-hidden'),
      );

    await step('Mil linhas, mas só as visíveis existem no DOM', async () => {
      // functional.item7 — o número exato depende da altura medida, então a
      // asserção é sobre a ORDEM DE GRANDEZA: renderizar mil `tr` é o defeito
      // que a virtualização existe para evitar.
      await expect(bigData.length).toBe(1000);
      // O virtualizador só sabe quantas linhas cabem DEPOIS de medir o
      // contêiner, e a medição chega no layout seguinte à montagem. Sem o
      // `waitFor` a leitura pega o estado anterior à medição.
      await waitFor(async () => {
        await expect(datumLines().length).toBeGreaterThan(0);
      });
      await expect(datumLines().length).toBeLessThan(100);
      await expect(rolador()).toHaveClass('nds-data-table-scroll-virtual');
      // Sem paginação: virtualizar e paginar ao mesmo tempo não faria sentido.
      await expect(canvasElement.querySelector('.nds-data-table-pagination')).toBeNull();
    });

    await step('As linhas fantasma reservam a altura do que não está montado', async () => {
      // Sem elas a barra de rolagem mediria só o pedaço renderizado e o polegar
      // pularia a cada scroll.
      const fantasmas = canvasElement.querySelectorAll("tbody tr[aria-hidden='true']");
      await expect(fantasmas.length).toBeGreaterThan(0);
    });

    await step('Rolar troca a janela de linhas e mantém a posição', async () => {
      // visual.item5 — a story termina com o scroll no meio, que é o estado
      // que o item documenta.
      const target = rolador();
      const firstBefore = datumLines()[0].textContent!.trim();
      target.scrollTop = 0;
      target.scrollTop = 4000;
      target.dispatchEvent(new Event('scroll'));

      await waitFor(async () => {
        await expect(datumLines()[0].textContent!.trim()).not.toBe(firstBefore);
      });
      await expect(target.scrollTop).toBe(4000);
      await expect(datumLines().length).toBeLessThan(100);
    });
  },
};
