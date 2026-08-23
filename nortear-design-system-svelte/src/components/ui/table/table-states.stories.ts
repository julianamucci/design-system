import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Table } from './index';
import TableEstadoEmpty from './TableEstadoEmpty.svelte';
import TableEstadoLinhaSelecionada from './TableEstadoLinhaSelecionada.svelte';
import TableEstadoCarregando from './TableEstadoCarregando.svelte';
import {
  tableLoadingSource,
  tableLineSelecionadaSource,
  tableSource,
  tableVaziaSource,
} from './table.source';

const meta: Meta = {
  title: 'UI/Table/States',
  component: Table,
  tags: ['tables'],
  parameters: {
    // Sem argTypes: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: tableSource },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: { source: { transform: tableVaziaSource } },
  },
  render: () => ({
    Component: TableEstadoEmpty,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A mensagem ocupa a largura inteira da tabela', async () => {
      // functional.item2 — sem o colspan a mensagem cairia sob a primeira
      // coluna e as outras três ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>('tbody td')!;
      await expect(celula).toHaveAttribute('colspan', '4');
      await expect(celula).toHaveTextContent('Nenhuma fatura encontrada.');
      await expect(canvasElement.querySelectorAll('tbody tr').length).toBe(1);
    });

    await step('A tabela continua nomeada e com os cabeçalhos no lugar', async () => {
      // Estado vazio não é motivo para desmontar a estrutura: quem usa leitor de
      // tela precisa saber que colunas voltarão a existir quando houver dados.
      await expect(canvas.getByRole('table', { name: /faturas recentes/ })).toBeTruthy();
      await expect(canvasElement.querySelectorAll('th').length).toBe(4);
    });

    await step('A mensagem é centralizada e reserva a altura da caixa', async () => {
      // visual.item2 — `.nds-table-empty` é a regra compartilhada: centraliza,
      // apaga a cor e reserva ~96px para o vazio não parecer defeito de
      // carregamento. Antes eram `h-24 text-center`, que não existem no CSS: a
      // mensagem saía encostada à esquerda e sem caixa nenhuma.
      const celula = canvasElement.querySelector<HTMLElement>('tbody td')!;
      await expect(getComputedStyle(celula).textAlign).toBe('center');
      await expect(celula.getBoundingClientRect().height).toBeGreaterThanOrEqual(90);
    });
  },
};

export const SelectedRow: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item5'],
    docs: { source: { transform: tableLineSelecionadaSource } },
  },
  render: () => ({
    Component: TableEstadoLinhaSelecionada,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha marcada carrega data-state="selected"', async () => {
      // functional.item4 — o estado é do `<tr>`, e é ele que o CSS compartilhado
      // pinta. Marcar a célula não pintaria a linha.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(3);
      await expect(lines[1]).toHaveAttribute('data-state', 'selected');
      for (const i of [0, 2]) {
        await expect(lines[i].hasAttribute('data-state')).toBe(false);
      }
    });

    await step('A linha marcada se destaca das demais', async () => {
      // visual.item5 — `.nds-table tbody tr[data-state="selected"]` pinta
      // hsl(var(--muted)). Sem contraste, a seleção existe só no atributo.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(getComputedStyle(lines[1]).backgroundColor).not.toBe(
        getComputedStyle(lines[0]).backgroundColor,
      );
    });
  },
};

export const Loading: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item6'],
    docs: { source: { transform: tableLoadingSource } },
  },
  render: () => ({
    Component: TableEstadoCarregando,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Uma célula de esqueleto por coluna, em cada linha', async () => {
      // visual.item6 — o esqueleto mede a caixa que o dado vai ocupar; a grade
      // não pode encolher enquanto carrega, senão a tabela salta ao chegar.
      const lines = [...canvasElement.querySelectorAll<HTMLElement>('tbody tr')];
      await expect(lines.length).toBe(5);
      for (const line of lines) {
        await expect(line.querySelectorAll('[data-slot="skeleton"]').length).toBe(4);
      }
      await expect(canvasElement.querySelectorAll('thead th').length).toBe(4);
    });

    await step('O esqueleto some da árvore de acessibilidade; a região anuncia', async () => {
      // functional.item7 — o par é sempre este: esqueleto `aria-hidden` dentro
      // de região com nome e `aria-busy`. Esqueleto anunciado seria ruído;
      // região sem nome não seria anunciada de jeito nenhum, e quem usa leitor
      // de tela ouviria uma tabela vazia sem saber que os dados vêm a caminho.
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
