import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { DataTable } from './index';
import { type Invoice, invoices, baseColumns } from './data-table.fixtures';
import {
  dataTablePaginadaSource,
  lineDataTableLabelSource,
  dataTableVirtualizadaSource,
} from './data-table.source';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable/Settings',
  component: DataTable as never,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: dataTablePaginadaSource } },
  },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

// Paginação ─────────────────────────────────────────────────────────────────

/** Doze faturas em páginas de cinco: três páginas, a última incompleta. */
const PAGE_SIZE = 5;
const TOTAL_PAGES = Math.ceil(invoices.length / PAGE_SIZE);

export const Paginated: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: invoices, tamanho: PAGE_SIZE, tamanhos: [PAGE_SIZE, 10] };
    },
    // O tamanho inicial precisa existir entre as opções do seletor: fora da
    // lista, o `select` não tem opção marcada e passa a exibir a primeira,
    // dizendo "10" numa tabela que mostra cinco.
    template: `<DataTable
      :columns="columns"
      :data="data"
      :enable-global-filter="false"
      :page-size="tamanho"
      :page-size-options="tamanhos"
    />`,
  }),
  parameters: {
    covers: ['functional.item8'],
    controls: { disable: true },
    actions: { disable: true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** Identificador da primeira linha — o que prova qual fatia está na tela. */
    const firstInvoice = () => linhas()[0].textContent!.trim();

    const primeira = () => canvas.getByRole('button', { name: 'Primeira página' }) as HTMLButtonElement;
    const previous = () => canvas.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
    const next = () => canvas.getByRole('button', { name: 'Próxima página' }) as HTMLButtonElement;
    const last = () => canvas.getByRole('button', { name: 'Última página' }) as HTMLButtonElement;

    // Precondição do passo, e não herança do anterior: o replay reexecuta a play
    // no MESMO DOM, e a última rodada pode ter parado em qualquer página. Na
    // primeira montagem o botão nasce desabilitado — e clicar em botão
    // desabilitado é impossível para quem usa, então nem o teste tenta.
    await step('Voltar ao começo deixa os dois botões de volta apagados', async () => {
      if (!primeira().disabled) await userEvent.click(primeira());
      await waitFor(async () => {
        await expect(firstInvoice()).toContain('INV-001');
      });
      await expect(linhas().length).toBe(PAGE_SIZE);
      await expect(canvas.getByText(`Página 1 de ${TOTAL_PAGES}`)).toBeInTheDocument();

      await expect(primeira()).toBeDisabled();
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
      await expect(primeira()).toBeEnabled();
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
      await expect(linhas().length).toBe(invoices.length % PAGE_SIZE);
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
        await expect(linhas().length).toBe(10);
      });
      // Trocar o tamanho da página não pode deixar o leitor numa página que
      // deixou de existir.
      await expect(canvas.getByText('Página 1 de 2')).toBeInTheDocument();

      // Fecha o ciclo: a rodada seguinte — e a captura de regressão visual —
      // partem da fatia de cinco, na página 1.
      await userEvent.selectOptions(selector, String(PAGE_SIZE));
      await waitFor(async () => {
        await expect(linhas().length).toBe(PAGE_SIZE);
      });
      if (!primeira().disabled) await userEvent.click(primeira());
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
  render: () => ({
    components: { DataTable },
    setup() {
      return {
        columns: baseColumns,
        data: invoices,
        chave: (f: Invoice) => f.id,
        rotulo: (f: Invoice) => f.customer,
      };
    },
    template: `<DataTable
      :columns="columns"
      :data="data"
      :enable-row-selection="true"
      :enable-global-filter="false"
      :enable-pagination="false"
      :row-key="chave"
      :row-label="rotulo"
    />`,
  }),
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // Aqui entram DUAS props que a paginada não tem — a chave e o rótulo da
    // linha —, e a paginação sai de cena.
    docs: { source: { transform: lineDataTableLabelSource } },
  },
  play: async ({ canvasElement, step }) => {
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const lineBox = (linha: HTMLElement) =>
      linha.querySelector<HTMLElement>("[role='checkbox']")!;
    /** Terceira célula: a coluna "Cliente", de onde `rowLabel` tira o texto. */
    const cliente = (linha: HTMLElement) =>
      linha.querySelectorAll('td')[2]!.textContent!.trim();

    await step('O nome do controle sai de rowLabel, e não da primeira coluna', async () => {
      // A prova precisa do CONTRASTE: se `rowLabel` fosse ignorado, o nome
      // cairia no identificador da primeira coluna ("INV-001") e a asserção
      // seguinte reprovaria.
      for (const linha of linhas()) {
        await expect(lineBox(linha)).toHaveAttribute(
          'aria-label',
          `Selecionar linha ${cliente(linha)}`,
        );
      }
    });

    await step('Nenhuma linha repete o nome de outra', async () => {
      const names = linhas().map((l) => lineBox(l).getAttribute('aria-label') ?? '');
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
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: bigData };
    },
    template: `<DataTable
      :columns="columns"
      :data="data"
      :virtualized="true"
      max-height="400px"
      :enable-column-visibility="false"
    />`,
  }),
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    controls: { disable: true },
    actions: { disable: true },
    // Mil linhas geradas e a janela de altura máxima: nada disso está no
    // snippet da paginada, que parte das doze faturas escritas à mão.
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
      const alvo = rolador();
      const firstBefore = datumLines()[0].textContent!.trim();
      alvo.scrollTop = 0;
      alvo.scrollTop = 4000;
      alvo.dispatchEvent(new Event('scroll'));

      await waitFor(async () => {
        await expect(datumLines()[0].textContent!.trim()).not.toBe(firstBefore);
      });
      await expect(alvo.scrollTop).toBe(4000);
      await expect(datumLines().length).toBeLessThan(100);
    });
  },
};
