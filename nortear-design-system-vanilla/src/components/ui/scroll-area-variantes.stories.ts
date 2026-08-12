import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import { createScrollArea } from './scroll-area';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/ScrollArea/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Três direções canônicas de scroll: vertical (padrão), horizontal e bidirecional. ' +
          'A factory não tem subcomponente de barra nem propriedade de direção — a direção nasce da relação ' +
          'entre o tamanho do container e o do conteúdo interno: o eixo que transborda é o eixo que rola.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVerticalList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
  ul.dataset.spacing = 'sm';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'nds-text-body nds-border-b-soft nds-pb-2';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}

function buildHorizontalRow(count: number): HTMLElement {
  const row = document.createElement('div');
  // nds-row e não nds-cluster: o cluster quebra linha, e sem transbordo não há
  // barra horizontal nenhuma para mostrar.
  row.className = 'nds-row nds-p-2';
  row.dataset.spacing = 'md';
  row.style.width = 'max-content';
  for (let i = 1; i <= count; i++) {
    const card = document.createElement('div');
    card.className =
      'nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-text-card-foreground';
    const title = document.createElement('div');
    title.className = 'nds-text-body nds-font-medium';
    title.textContent = `Card ${i}`;
    const desc = document.createElement('div');
    desc.className = 'nds-text-caption nds-text-muted-foreground nds-mt-1';
    desc.textContent = `#${String(i).padStart(2, '0')}`;
    card.append(title, desc);
    row.appendChild(card);
  }
  return row;
}

function buildMatrix(rows: number, cols: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-p-2';
  const table = document.createElement('table');
  table.className = 'nds-text-caption nds-border-collapse';
  for (let r = 1; r <= rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 1; c <= cols; c++) {
      const td = document.createElement('td');
      td.className = 'nds-border-default nds-py-2 nds-px-2 nds-whitespace-nowrap';
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
    covers: ['visual.item1'],
    docs: { description: { story: 'Scroll vertical — altura fixa no root, conteúdo mais alto que o viewport gera barra à direita.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      height: '240px',
      label: 'Lista vertical de itens',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildVerticalList(30),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O teto de altura chega ao root e ao viewport', async () => {
      // Sem o teto não há transbordo, e sem transbordo não há barra: a medida é
      // a condição de existir a variante.
      await expect(raiz.style.height).toBe('240px');
      await expect(viewport.style.maxHeight).toBe('240px');
    });

    await step('Rola só na vertical', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.y).toBe(true);
      await expect(eixos.x).toBe(false);
      await expect(canvas.getAllByText(/^Item \d+$/).length).toBe(30);
    });
  },
};

export const Horizontal: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Scroll horizontal — largura fixa no root e faixa com largura de conteúdo (itens que não encolhem) geram barra inferior.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-lg';
    outer.appendChild(createScrollArea({
      width: '100%',
      label: 'Fila horizontal de cards',
      class: 'nds-rounded-md nds-border-default',
      children: buildHorizontalRow(15),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na horizontal', async () => {
      // A asserção anterior contava botões e usava `>= 0`: passava com a tela
      // vazia. O que a story demonstra é o eixo que transborda.
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(false);
    });

    await step('A fila é alcançável por teclado e o eixo responde', async () => {
      // Rolagem horizontal é a que mais some para quem não usa mouse: sem
      // `tabindex` no viewport, o conteúdo à direita fica inacessível.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 120;
      await expect(viewport.scrollLeft).toBe(120);
    });
  },
};

export const Both: Story = {
  name: 'Bidirectional',
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Scroll bidirecional — altura e largura fixas no root, conteúdo maior nas duas dimensões.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-lg';
    outer.appendChild(createScrollArea({
      height: '240px',
      width: '100%',
      label: 'Matriz com rolagem nos dois eixos',
      class: 'nds-rounded-md nds-border-default',
      children: buildMatrix(15, 12),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('Os dois eixos respondem', async () => {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 24;
      viewport.scrollLeft = 24;
      await expect(viewport.scrollTop).toBe(24);
      await expect(viewport.scrollLeft).toBe(24);
    });
  },
};
