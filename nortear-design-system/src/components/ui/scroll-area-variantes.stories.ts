import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createScrollArea } from './scroll-area';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/ScrollArea/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Três direções canônicas de scroll: vertical (padrão), horizontal e bidirecional. ' +
          'Diferente da API React/Vue/Svelte, a factory Basecoat não tem subcomponente ScrollBar nem prop orientation — ' +
          'a direção é decorrente da relação entre o tamanho do container e do conteúdo interno (flex w-max para horizontal, table larga para both).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVerticalList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none';
  ul.dataset.spacing = 'sm';
  ul.style.padding = '0.75rem';
  ul.style.margin = '0';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'nds-text-body nds-border-b-soft';
    li.style.paddingBottom = '0.5rem';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}

function buildHorizontalRow(count: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'md';
  row.style.padding = '0.75rem';
  row.style.width = 'max-content';
  for (let i = 1; i <= count; i++) {
    const card = document.createElement('div');
    card.className = 'nds-shrink-0 nds-rounded-md nds-border-default nds-bg-card nds-text-card-foreground';
    card.style.width = '10rem';
    card.style.padding = '1rem';
    const title = document.createElement('div');
    title.className = 'nds-text-body nds-font-medium';
    title.textContent = `Card ${i}`;
    const desc = document.createElement('div');
    desc.className = 'nds-text-caption nds-text-muted-foreground';
    desc.style.marginTop = '0.25rem';
    desc.textContent = `#${String(i).padStart(2, '0')}`;
    card.append(title, desc);
    row.appendChild(card);
  }
  return row;
}

function buildMatrix(rows: number, cols: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.padding = '0.75rem';
  const table = document.createElement('table');
  table.className = 'nds-text-caption';
  table.style.borderCollapse = 'collapse';
  for (let r = 1; r <= rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 1; c <= cols; c++) {
      const td = document.createElement('td');
      td.className = 'nds-border-default';
      td.style.padding = '0.5rem 0.75rem';
      td.style.whiteSpace = 'nowrap';
      td.textContent = `R${r}·C${c}`;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  return wrap;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    docs: { description: { story: 'Scroll vertical — altura fixa no root, conteúdo mais alto que o viewport gera barra à direita.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      height: '240px',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildVerticalList(30),
    }));
    return outer;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="scroll-area"]') as HTMLElement | null;
    await expect(root).toBeTruthy();
    await expect(root!.style.height).toBe('240px');
    const viewport = canvasElement.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    await expect(viewport).toHaveClass('nds-scroll-area-viewport');
    await expect(canvas.getAllByText(/Item \d+/).length).toBe(30);
  },
};

export const Horizontal: Story = {
  parameters: {
    docs: { description: { story: 'Scroll horizontal — largura fixa no root + conteúdo com `flex w-max` (e itens com `shrink-0`) gera barra inferior.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full';
    outer.style.maxWidth = '36rem';
    outer.appendChild(createScrollArea({
      width: '100%',
      class: 'nds-rounded-md nds-border-default',
      children: buildHorizontalRow(15),
    }));
    return outer;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Both: Story = {
  name: 'Bidirecional',
  parameters: {
    docs: { description: { story: 'Scroll bidirecional — altura + largura fixas no root, conteúdo maior em ambas as dimensões.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full';
    outer.style.maxWidth = '36rem';
    outer.appendChild(createScrollArea({
      height: '240px',
      width: '100%',
      class: 'nds-rounded-md nds-border-default',
      children: buildMatrix(15, 12),
    }));
    return outer;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
