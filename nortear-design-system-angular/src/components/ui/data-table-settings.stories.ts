import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsDataTable } from './data-table';
import { COLUMNS_INVOICES, INVOICES_DT, LABELS_DT, type InvoiceDT } from './data-table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Primitives/Tables/DataTable/Settings',
  tags: ['tables'],
  decorators: [moduleMetadata({ imports: [NdsDataTable] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Ajustes que mudam quanta tabela cabe na tela de uma vez — hoje, o recorte por página e a navegação entre elas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Doze faturas em páginas de cinco: três páginas, a última incompleta. */
const PAGE_SIZE = 5;
const TOTAL_PAGES = Math.ceil(INVOICES_DT.length / PAGE_SIZE);

// ─── Paginação ────────────────────────────────────────────────────────────────

export const Paginated: Story = {
  parameters: {
    covers: ['functional.item8'],
    docs: {
      description: {
        story:
          'Quatro botões no rodapé: primeira, anterior, próxima e última. Nos extremos os dois do lado sem saída desabilitam — um botão que continua vivo e não leva a lugar nenhum é uma promessa quebrada.',
      },
    },
  },
  render: () => ({
    props: {
      colunas: COLUMNS_INVOICES,
      faturas: INVOICES_DT,
      rotulos: LABELS_DT,
      size: PAGE_SIZE,
    },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [enableGlobalFilter]="false"
        [pageSize]="size"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    /** Identificador da primeira linha da página — o que prova qual fatia está na tela. */
    const firstInvoice = () => lines()[0].textContent!.trim();

    const first = () => canvas.getByRole('button', { name: 'Primeira página' }) as HTMLButtonElement;
    const previous = () => canvas.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
    const next = () => canvas.getByRole('button', { name: 'Próxima página' }) as HTMLButtonElement;
    const last = () => canvas.getByRole('button', { name: 'Última página' }) as HTMLButtonElement;

    await step('A tabela abre na primeira página, com os dois botões de volta apagados', async () => {
      // Clicar num botão desabilitado é impossível para quem usa — o CSS lhe
      // tira o `pointer-events`. Então o teste AFIRMA a propriedade em vez de
      // tentar o clique: um clique forçado provaria algo que ninguém consegue.
      await expect(lines().length).toBe(PAGE_SIZE);
      await expect(firstInvoice()).toContain('#INV-001');
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
      const button = next();
      await userEvent.click(button);

      await waitFor(async () => {
        await expect(firstInvoice()).toContain('#INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_PAGES}`)).toBeInTheDocument();
      // No meio do caminho os quatro estão vivos: há para onde ir dos dois lados.
      await expect(first()).toBeEnabled();
      await expect(previous()).toBeEnabled();
      await expect(last()).toBeEnabled();
    });

    await step('O salto para a última página respeita a fatia incompleta', async () => {
      const button = last();
      await userEvent.click(button);

      await waitFor(async () => {
        await expect(firstInvoice()).toContain('#INV-011');
      });
      // Doze faturas em páginas de cinco deixam duas na última — número
      // derivado da fixture, nunca escrito à mão.
      await expect(lines().length).toBe(INVOICES_DT.length % PAGE_SIZE);
      await expect(canvas.getByText(`Página ${TOTAL_PAGES} de ${TOTAL_PAGES}`))
        .toBeInTheDocument();

      await expect(next()).toBeDisabled();
      await expect(last()).toBeDisabled();
      await expect(previous()).toBeEnabled();
    });

    await step('Retroceder uma página é o caminho inverso do avanço', async () => {
      const button = previous();
      await userEvent.click(button);

      await waitFor(async () => {
        await expect(firstInvoice()).toContain('#INV-006');
      });
      await expect(canvas.getByText(`Página 2 de ${TOTAL_PAGES}`)).toBeInTheDocument();
    });

    await step('O salto para a primeira página devolve o estado de entrada', async () => {
      // Fecha o ciclo e deixa a tela como a encontrou: a rodada seguinte — e a
      // captura de regressão visual — partem da página 1.
      const button = first();
      await userEvent.click(button);

      await waitFor(async () => {
        await expect(firstInvoice()).toContain('#INV-001');
      });
      await expect(first()).toBeDisabled();
      await expect(previous()).toBeDisabled();
    });
  },
};

// ─── Rótulo de linha explícito ───────────────────────────────────────────────

/**
 * O primeiro degrau do fallback: quem monta a tabela diz qual campo identifica a
 * linha. O Playground prova o degrau do meio (o identificador sai da primeira
 * coluna); aqui a escolha é explícita e vence a primeira coluna.
 */
export const ExplicitRowLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Quando a coluna que identifica a linha para quem enxerga não é a primeira, o rótulo do controle de seleção passa a sair do campo escolhido — e continua sendo um nome por linha, nunca um nome repetido.',
      },
    },
  },
  render: () => ({
    props: {
      colunas: COLUMNS_INVOICES,
      faturas: INVOICES_DT,
      rotulos: LABELS_DT,
      chaveDaFatura: (f: InvoiceDT) => f.id,
      rotuloDaFatura: (f: InvoiceDT) => f.cliente,
    },
    template: `
      <div
        ndsDataTable
        caption="Faturas recentes"
        [columns]="colunas"
        [data]="faturas"
        [labels]="rotulos"
        [rowKey]="chaveDaFatura"
        [rowLabel]="rotuloDaFatura"
        [enableRowSelection]="true"
        [enableGlobalFilter]="false"
        [enablePagination]="false"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const lineBox = (line: HTMLElement) =>
      line.querySelector<HTMLElement>('button[role="checkbox"]')!;
    /** Terceira célula: a coluna "Cliente", de onde `rowLabel` tira o texto. */
    const cliente = (line: HTMLElement) =>
      line.querySelectorAll('td')[2]!.textContent!.trim();

    await step('O nome do controle sai de rowLabel, e não da primeira coluna', async () => {
      // A prova precisa do CONTRASTE: se `rowLabel` fosse ignorado, o nome
      // cairia no identificador da primeira coluna ("#INV-001") e a asserção
      // seguinte reprovaria.
      for (const line of lines()) {
        await expect(lineBox(line)).toHaveAttribute(
          'aria-label',
          `Selecionar fatura ${cliente(line)}`,
        );
      }
    });

    await step('Nenhuma linha repete o nome de outra', async () => {
      const names = lines().map((l) => lineBox(l).getAttribute('aria-label') ?? '');
      await expect(names.length).toBe(INVOICES_DT.length);
      await expect(new Set(names).size).toBe(names.length);
    });
  },
};
