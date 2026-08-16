import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableRow,
  createTableHead,
  createTableCell,
  createTableCaption,
} from './table';
import { createSkeleton } from '@/components/ui/skeleton';
import { COLUNAS, INVOICES } from './table.fixtures';

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/Table/States',
  parameters: {
    // Sem argTypes: sem isto o painel Controls abre vazio.
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LINHAS = INVOICES.slice(0, 3);

function buildStandardHeader(table: HTMLTableElement): void {
  const thead = createTableHeader();
  const tr = createTableRow();
  for (const col of COLUNAS) {
    tr.appendChild(createTableHead(col, col === 'Valor' ? 'nds-text-right' : undefined));
  }
  thead.appendChild(tr);
  table.appendChild(thead);
}

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    const emptyRow = createTableRow();
    // `nds-table-empty` é a regra compartilhada do estado vazio: reserva a
    // altura, centraliza e apaga a cor. Antes eram `h-24 text-center`, classes
    // que não existem no CSS — a mensagem saía encostada à esquerda e sem caixa.
    const emptyCell = createTableCell('Nenhuma fatura encontrada.', 'nds-table-empty');
    emptyCell.setAttribute('colspan', String(COLUNAS.length));
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // functional.item2 — sem o colspan a mensagem cairia sob a primeira
      // coluna e as outras três ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>('tbody td')!;
      await expect(celula).toHaveAttribute('colspan', String(COLUNAS.length));
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A tabela continua nomeada e com os cabeçalhos no lugar', async () => {
      // Estado vazio não é motivo para desmontar a estrutura: quem usa leitor de
      // tela precisa saber que colunas voltarão a existir quando houver dados.
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('th').length).toBe(COLUNAS.length);
    });

    await step('A mensagem é centralizada e reserva a altura da caixa', async () => {
      // visual.item2 — é o que separa "sem resultado" de um dado real, e é medido
      // no estilo COMPUTADO: as classes antigas estavam no markup e não pintavam.
      const celula = canvasElement.querySelector<HTMLElement>('tbody td')!;
      await expect(getComputedStyle(celula).textAlign).toBe('center');
      await expect(celula.getBoundingClientRect().height).toBeGreaterThanOrEqual(90);
    });
  },
};

// ─── Linha selecionada ────────────────────────────────────────────────────────

export const SelectedRow: Story = {
  parameters: { covers: ['functional.item4', 'visual.item5'] },
  render: () => {
    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    for (const inv of LINHAS) {
      const tr = createTableRow();
      // Só o atributo: quem pinta é `.nds-table tbody tr[data-state="selected"]`.
      // A classe `nds-bg-muted` que estava aqui repetia a regra por fora e
      // deixava o teste passar mesmo se o seletor do componente sumisse.
      if (inv.id === LINHAS[1].id) tr.setAttribute('data-state', 'selected');
      tr.appendChild(createTableCell(inv.id, 'nds-font-medium'));
      tr.appendChild(createTableCell(inv.status));
      tr.appendChild(createTableCell(inv.method));
      tr.appendChild(createTableCell(inv.amount, 'nds-text-right'));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Só a linha marcada carrega data-state="selected"', async () => {
      // functional.item4 — o estado é do `<tr>`, e é ele que o CSS compartilhado
      // pinta. Marcar a célula não pintaria a linha.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(LINHAS.length);
      await expect(linhas[1]).toHaveAttribute('data-state', 'selected');
      for (const i of [0, 2]) {
        await expect(linhas[i].hasAttribute('data-state')).toBe(false);
      }
    });

    await step('A linha marcada se destaca das demais', async () => {
      // visual.item5 — sem contraste, a seleção existe só no atributo. A cor sai
      // do componente, não de uma classe repetida na story.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(getComputedStyle(linhas[1]).backgroundColor).not.toBe(
        getComputedStyle(linhas[0]).backgroundColor,
      );
    });
  },
};

// ─── Carregando ───────────────────────────────────────────────────────────────

const LINHAS_ESQUELETO = [1, 2, 3];

export const Loading: Story = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => {
    // aria-busy na REGIÃO, não na célula: o esqueleto é aria-hidden, e sem o
    // container quem usa leitor de tela ouve uma tabela vazia sem saber que os
    // dados estão a caminho.
    const regiao = document.createElement('div');
    regiao.setAttribute('role', 'status');
    regiao.setAttribute('aria-busy', 'true');
    regiao.setAttribute('aria-label', 'Carregando faturas');

    const { wrapper, table } = createTable();
    table.appendChild(createTableCaption('Lista de faturas recentes', 'nds-sr-only'));
    buildStandardHeader(table);

    const tbody = createTableBody();
    for (const _linha of LINHAS_ESQUELETO) {
      const tr = createTableRow();
      for (const _coluna of COLUNAS) {
        const td = createTableCell('');
        // A factory do Skeleton, e não um `div` montado à mão com `style`: a
        // caixa vem de `data-shape`/`data-width`, e o `aria-hidden` sai de
        // fábrica. A versão anterior usava a classe `skeleton`, que não existe
        // no CSS — os placeholders não desenhavam nada.
        td.appendChild(createSkeleton({ shape: 'text', width: '3-4' }));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    regiao.appendChild(wrapper);

    return regiao;
  },
  play: async ({ canvasElement, step }) => {
    await step('Uma célula de esqueleto por coluna, em cada linha', async () => {
      // visual.item6 — o esqueleto mede a caixa que o dado vai ocupar; a grade
      // não pode encolher enquanto carrega, senão a tabela salta ao chegar.
      const linhas = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(linhas.length).toBe(LINHAS_ESQUELETO.length);
      for (const linha of linhas) {
        await expect(linha.querySelectorAll('[data-slot="skeleton"]').length).toBe(
          COLUNAS.length,
        );
      }
      await expect(canvasElement.querySelectorAll('thead th').length).toBe(COLUNAS.length);
    });

    await step('O esqueleto some da árvore de acessibilidade; a região anuncia', async () => {
      // functional.item7 — o par é sempre este: esqueleto `aria-hidden` dentro
      // de região com nome e `aria-busy`. Esqueleto anunciado seria ruído;
      // região sem nome não seria anunciada de jeito nenhum.
      const regiao = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]')!;
      await expect(regiao).toHaveAttribute('role', 'status');
      await expect(regiao).toHaveAttribute('aria-label', 'Carregando faturas');
      for (const sk of canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')) {
        await expect(sk).toHaveAttribute('aria-hidden', 'true');
        await expect(sk.getBoundingClientRect().height).toBeGreaterThan(0);
      }
    });
  },
};
