import type { Meta, StoryObj } from '@storybook/html';
import { expect, within } from 'storybook/test';
import { createResizablePanel } from './resizable';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Resizable: EditorComPreview (editor + preview lado a lado), SidebarComConteudoEConsole (sidebar | conteúdo / console — layout aninhado tipo IDE), ListaDetalhe (lista de itens + painel de detalhes) e TresColunas (navegação | conteúdo | metadados). NOTA Basecoat: a factory custom NÃO suporta autoSaveId, onLayout nem maxSize — para persistência e callbacks, use as stacks React/Vue/Svelte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function block(title: string, body: string, extraClass = ''): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `nds-w-full nds-p-4 ${extraClass}`.trim();
  wrap.style.height = '100%';
  wrap.style.overflow = 'auto';

  const h = document.createElement('p');
  h.className = 'nds-text-body nds-font-semibold nds-mb-2';
  h.textContent = title;

  const p = document.createElement('p');
  p.className = 'nds-text-caption nds-text-muted-foreground';
  p.style.lineHeight = '1.375';
  p.textContent = body;

  wrap.append(h, p);
  return wrap;
}

function listBlock(title: string, items: string[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-p-4 nds-bg-muted-soft';
  wrap.style.height = '100%';
  wrap.style.overflow = 'auto';

  const h = document.createElement('p');
  h.className = 'nds-text-body nds-font-semibold nds-mb-2';
  h.textContent = title;
  wrap.appendChild(h);

  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-text-caption';
  ul.dataset.spacing = 'xs';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'nds-px-2 nds-py-1 nds-rounded nds-hover-bg-accent nds-hover-text-foreground nds-cursor-pointer';
    li.textContent = item;
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

function frame(child: HTMLElement, minHeight = '320px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  wrap.style.minHeight = minHeight;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

function labelHandles(root: HTMLElement, label: string): void {
  root.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]').forEach((h, i, arr) => {
    const suffix = arr.length > 1 ? ` (${i + 1}/${arr.length})` : '';
    h.setAttribute('aria-label', `${label}${suffix} — use setas para ajustar`);
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const EditorComPreview: Story = {
  name: 'Editor com Preview',
  render: () => {
    const editor = block(
      'Editor',
      '## Resizable\n\nPainéis redimensionáveis com suporte a arrasto e teclado.\n\n- Defina defaultSize\n- Defina minSize\n- Adicione aria-label',
      'nds-font-mono',
    );
    const preview = block(
      'Preview',
      'Resizable — painéis redimensionáveis com suporte a arrasto e teclado. Defina defaultSize, minSize e aria-label.',
      'nds-bg-muted nds-text-muted-foreground',
    );

    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 50, minSize: 25, content: editor },
        { defaultSize: 50, minSize: 25, content: preview },
      ],
    });
    labelHandles(root, 'Redimensionar Editor e Preview');
    return frame(root, '300px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Composição renderiza dois painéis e um handle', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels.length).toBe(2);
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handles.length).toBe(1);
    });
    await step('Handle tem aria-label descritivo com atalho', async () => {
      const handle = canvas.getByRole('separator');
      const label = handle.getAttribute('aria-label') ?? '';
      await expect(label).toMatch(/Editor/);
      await expect(label).toMatch(/setas/);
    });
  },
};

export const SidebarComConteudoEConsole: Story = {
  name: 'Sidebar + Conteúdo / Console',
  render: () => {
    const sidebar = listBlock('Arquivos', ['index.ts', 'README.md', 'package.json', 'tsconfig.json']);
    const content = block('Conteúdo', 'Conteúdo principal do arquivo selecionado.');
    const console_ = block(
      'Console',
      '> npm run dev\n  ✓ Pronto em 412ms\n> watching for changes…',
      'nds-bg-muted nds-text-muted-foreground nds-font-mono',
    );

    const right = createResizablePanel({
      direction: 'vertical',
      panels: [
        { defaultSize: 70, minSize: 30, content },
        { defaultSize: 30, minSize: 15, content: console_ },
      ],
    });
    const rightWrap = document.createElement('div');
    rightWrap.style.height = '100%';
    rightWrap.style.width = '100%';
    rightWrap.appendChild(right);

    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 25, minSize: 15, content: sidebar },
        { defaultSize: 75, minSize: 40, content: rightWrap },
      ],
    });
    labelHandles(root, 'Redimensionar painel');
    return frame(root, '360px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Composição aninhada renderiza 4 painéis e 2 handles', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels.length).toBe(4);
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handles.length).toBe(2);
    });
    await step('Handles têm aria-orientations distintas (vertical + horizontal)', async () => {
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      const orientations = Array.from(handles).map(h => h.getAttribute('aria-orientation'));
      await expect(orientations).toContain('vertical');
      await expect(orientations).toContain('horizontal');
    });
  },
};

export const ListaDetalhe: Story = {
  name: 'Lista + Detalhe',
  render: () => {
    const list = listBlock('Inbox (4)', [
      'Maria Santos — Atualização do projeto',
      'João Pereira — Reunião amanhã',
      'Ana Costa — Aprovação pendente',
      'Newsletter — Boletim semanal',
    ]);
    const detail = block(
      'Maria Santos — Atualização do projeto',
      'Olá! Compartilhando o resumo da sprint: implementamos o Resizable em todas as stacks, com testes de teclado e suporte WCAG 2.5.7.',
    );

    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 35, minSize: 20, content: list },
        { defaultSize: 65, minSize: 35, content: detail },
      ],
    });
    labelHandles(root, 'Redimensionar Lista e Detalhe');
    return frame(root, '300px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Renderiza dois painéis com tamanhos iniciais corretos', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels[0].style.width).toBe('35%');
      await expect(panels[1].style.width).toBe('65%');
    });
  },
};

export const TresColunas: Story = {
  name: 'Três Colunas',
  render: () => {
    const nav = listBlock('Navegação', ['Visão geral', 'Componentes', 'Tokens', 'Guidelines']);
    const content = block('Conteúdo', 'Conteúdo principal da página selecionada.');
    const meta_ = block(
      'Metadados',
      'Última atualização: 2026-05-07\nAutor: Design System\nVersão: 1.4.0',
      'nds-bg-muted nds-text-muted-foreground',
    );

    const root = createResizablePanel({
      direction: 'horizontal',
      panels: [
        { defaultSize: 20, minSize: 12, content: nav },
        { defaultSize: 55, minSize: 30, content },
        { defaultSize: 25, minSize: 15, content: meta_ },
      ],
    });
    labelHandles(root, 'Redimensionar coluna');
    return frame(root, '300px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Três painéis com dois handles entre eles', async () => {
      const panels = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]');
      await expect(panels.length).toBe(3);
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      await expect(handles.length).toBe(2);
    });
    await step('Todos os handles têm aria-label descritivo', async () => {
      const handles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]');
      for (const h of Array.from(handles)) {
        const label = h.getAttribute('aria-label') ?? '';
        await expect(label).toMatch(/coluna/);
        await expect(label).toMatch(/setas/);
      }
    });
  },
};
