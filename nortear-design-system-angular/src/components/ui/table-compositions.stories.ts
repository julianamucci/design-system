import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { computed, signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
  type TableSortDirection,
} from './table';
import { NdsButton, NdsButtonIcon } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import { INVOICES, type Invoice } from './table.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As composições que o conteúdo compartilhado documenta e que já têm peça neste
// stack: toolbar de filtros, cabeçalhos ordenáveis e seleção de linhas. A quarta
// — tabela com paginação — depende do componente Pagination, que ainda não
// existe aqui; entra quando ele existir.

const meta: Meta = {
  title: 'UI/Table/Compositions',
  tags: ['tables'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsTableWrapper,
        NdsTable,
        NdsTableCaption,
        NdsTableHeader,
        NdsTableBody,
        NdsTableRow,
        NdsTableHead,
        NdsTableCell,
        NdsButton,
        NdsButtonIcon,
        NdsCheckbox,
        NdsInput,
        NdsLabel,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições canônicas do Table: filtro acima da tabela, ordenação por cabeçalho e seleção de linhas em lote.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** "R$ 250,00" → 250. A ordenação é numérica; comparar as strings colocaria
 * "R$ 50,00" depois de "R$ 450,00". */
function valueNumerico(invoice: Invoice): number {
  return Number(invoice.valor.replace(/[^\d,]/g, '').replace(',', '.'));
}

// ─── Toolbar de filtros ───────────────────────────────────────────────────────

export const FilterToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A busca fica fora da tabela, no mesmo container, e reduz o conjunto exibido. Quando o filtro não acha nada, o empty state entra no lugar das linhas.',
      },
    },
  },
  render: () => {
    // Signals, e não um array mutado: o stack é zoneless — sem signal a
    // digitação não dispararia detecção nenhuma e a tabela ficaria parada.
    const termo = signal('');
    const filtradas = computed(() => {
      const t = termo().trim().toLowerCase();
      if (!t) return INVOICES;
      return INVOICES.filter((f) =>
        `${f.id} ${f.status} ${f.metodo}`.toLowerCase().includes(t),
      );
    });

    return {
      props: {
        termo,
        filtradas,
        aoDigitar: (evento: Event) => termo.set((evento.target as HTMLInputElement).value),
      },
      template: `
        <div class="nds-stack" data-spacing="sm">
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="filtro-faturas">Buscar fatura</label>
            <input
              ndsInput
              id="filtro-faturas"
              type="search"
              placeholder="Fatura, status ou método"
              (input)="aoDigitar($event)"
            />
          </div>

          <div ndsTableWrapper>
            <table ndsTable>
              <caption ndsTableCaption class="nds-sr-only">Faturas filtradas pela busca</caption>
              <thead ndsTableHeader>
                <tr ndsTableRow>
                  <th ndsTableHead>Fatura</th>
                  <th ndsTableHead>Status</th>
                  <th ndsTableHead>Método</th>
                  <th ndsTableHead class="nds-text-right">Valor</th>
                </tr>
              </thead>
              <tbody ndsTableBody>
                @for (invoice of filtradas(); track invoice.id) {
                  <tr ndsTableRow>
                    <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                    <td ndsTableCell>{{ invoice.status }}</td>
                    <td ndsTableCell>{{ invoice.metodo }}</td>
                    <td ndsTableCell class="nds-text-right">{{ invoice.valor }}</td>
                  </tr>
                } @empty {
                  <tr ndsTableRow>
                    <td
                      ndsTableCell
                      colspan="4"
                      class="nds-text-center nds-text-muted-foreground"
                    >
                      Nenhuma fatura encontrada.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByLabelText('Buscar fatura');

    await step('Sem filtro, a tabela mostra o conjunto inteiro', async () => {
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(INVOICES.length);
    });

    await step('O filtro reduz as linhas sem tocar no cabeçalho', async () => {
      await userEvent.type(campo, 'Pix');
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(INVOICES.filter((f) => f.metodo === 'Pix').length);
      for (const line of lines) await expect(line).toHaveTextContent('Pix');
      // As colunas continuam declaradas: o filtro mexe nos dados, não na grade.
      await expect(canvasElement.querySelectorAll('th').length).toBe(4);
    });

    await step('Busca sem resultado cai no empty state, não em tabela muda', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'boleto');
      const celula = canvasElement.querySelector<HTMLTableCellElement>('tbody td')!;
      await expect(celula).toHaveAttribute('colspan', '4');
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
    });
  },
};

// ─── Cabeçalhos ordenáveis ────────────────────────────────────────────────────

export const SortableHeaders: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O cabeçalho ordenável é um botão dentro do `th`, e o estado da ordenação vive em `aria-sort`. Sem ele a ordem existe só para quem enxerga a tabela.',
      },
    },
  },
  render: () => {
    const direcao = signal<TableSortDirection>('ascending');
    const ordenadas = computed(() => {
      const sinal = direcao() === 'ascending' ? 1 : -1;
      return [...INVOICES].sort((a, b) => (valueNumerico(a) - valueNumerico(b)) * sinal);
    });

    return {
      props: {
        direcao,
        ordenadas,
        alternar: () =>
          direcao.update((d) => (d === 'ascending' ? 'descending' : 'ascending')),
      },
      template: `
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">Faturas ordenadas por valor</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <th ndsTableHead>Fatura</th>
                <th ndsTableHead>Status</th>
                <!-- aria-sort na CÉLULA de cabeçalho, não no botão: quem carrega
                     a relação com a coluna é o th. O botão só é o gatilho. -->
                <th ndsTableHead [sort]="direcao()">
                  <button ndsButton variant="ghost" size="sm" (click)="alternar()">
                    Valor
                    <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (invoice of ordenadas(); track invoice.id) {
                <tr ndsTableRow>
                  <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                  <td ndsTableCell>{{ invoice.status }}</td>
                  <td ndsTableCell class="nds-text-right">{{ invoice.valor }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const columnValue = () =>
      [...canvasElement.querySelectorAll<HTMLElement>('th')].find((th) =>
        th.hasAttribute('aria-sort'),
      )!;

    await step('Só a coluna ordenável anuncia ordenação', async () => {
      // Prova também que o input chegou ao template: sob o fallback JIT o
      // binding cai em silêncio e nenhum th teria aria-sort (armadilha 1).
      const withSort = [...canvasElement.querySelectorAll('th')].filter((th) =>
        th.hasAttribute('aria-sort'),
      );
      await expect(withSort.length).toBe(1);
      await expect(columnValue()).toHaveAttribute('aria-sort', 'ascending');
    });

    await step('O clique inverte a ordem e o anúncio junto', async () => {
      const firstBefore = canvasElement.querySelector<HTMLElement>('tbody tr td')!.textContent;
      await userEvent.click(canvas.getByRole('button', { name: /Valor/ }));
      await expect(columnValue()).toHaveAttribute('aria-sort', 'descending');
      const firstAfter = canvasElement.querySelector<HTMLElement>('tbody tr td')!.textContent;
      await expect(firstAfter).not.toBe(firstBefore);
      // Ascendente começa pelo menor valor; descendente, pelo maior.
      await expect(firstAfter?.trim()).toBe('#INV-004');
    });
  },
};

// ─── Seleção de linhas ────────────────────────────────────────────────────────

export const RowSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox por linha mais um mestre no cabeçalho. A linha marcada recebe `data-state="selected"`; o mestre fica misto enquanto a seleção é parcial.',
      },
    },
  },
  render: () => {
    const selecionadas = signal<ReadonlySet<string>>(new Set());
    const all = computed(() => selecionadas().size === INVOICES.length);
    const algumas = computed(() => selecionadas().size > 0 && !all());

    return {
      props: {
        faturas: INVOICES,
        selecionadas,
        all,
        algumas,
        alternar: (id: string, marcado: boolean) => {
          const next = new Set(selecionadas());
          if (marcado) next.add(id);
          else next.delete(id);
          selecionadas.set(next);
        },
        alternarTodas: (marcado: boolean) =>
          selecionadas.set(marcado ? new Set(INVOICES.map((f) => f.id)) : new Set()),
      },
      template: `
        <div ndsTableWrapper>
          <table ndsTable>
            <caption ndsTableCaption class="nds-sr-only">Faturas para operação em lote</caption>
            <thead ndsTableHeader>
              <tr ndsTableRow>
                <th ndsTableHead>
                  <button
                    ndsCheckbox
                    aria-label="Selecionar todas as faturas"
                    [checked]="all()"
                    [indeterminate]="algumas()"
                    (checkedChange)="alternarTodas($event)"
                  ></button>
                </th>
                <th ndsTableHead>Fatura</th>
                <th ndsTableHead>Status</th>
                <th ndsTableHead class="nds-text-right">Valor</th>
              </tr>
            </thead>
            <tbody ndsTableBody>
              @for (invoice of faturas; track invoice.id) {
                <tr ndsTableRow [selected]="selecionadas().has(invoice.id)">
                  <td ndsTableCell>
                    <button
                      ndsCheckbox
                      [attr.aria-label]="'Selecionar fatura ' + invoice.id"
                      [checked]="selecionadas().has(invoice.id)"
                      (checkedChange)="alternar(invoice.id, $event)"
                    ></button>
                  </td>
                  <td ndsTableCell class="nds-font-medium">{{ invoice.id }}</td>
                  <td ndsTableCell>{{ invoice.status }}</td>
                  <td ndsTableCell class="nds-text-right">{{ invoice.valor }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lines = () => [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
    const selecionadas = () => lines().filter((l) => l.getAttribute('data-state') === 'selected');

    await step('Cada checkbox diz qual fatura marca', async () => {
      // "Selecionar" sozinho, repetido cinco vezes, é indistinguível na lista de
      // controles do leitor de tela.
      for (const invoice of INVOICES) {
        await expect(canvas.getByLabelText(`Selecionar fatura ${invoice.id}`)).toBeTruthy();
      }
      await expect(selecionadas().length).toBe(0);
    });

    await step('Marcar uma linha destaca só ela, e deixa o mestre misto', async () => {
      await userEvent.click(canvas.getByLabelText(`Selecionar fatura ${INVOICES[0].id}`));
      await expect(selecionadas().length).toBe(1);
      await expect(lines()[0]).toHaveAttribute('data-state', 'selected');
      const mestre = canvas.getByLabelText('Selecionar todas as faturas');
      await expect(mestre).toHaveAttribute('aria-checked', 'mixed');
    });

    await step('O mestre marca e desmarca o conjunto inteiro', async () => {
      const mestre = canvas.getByLabelText('Selecionar todas as faturas');
      await userEvent.click(mestre);
      await expect(selecionadas().length).toBe(INVOICES.length);
      await userEvent.click(mestre);
      await expect(selecionadas().length).toBe(0);
    });
  },
};
