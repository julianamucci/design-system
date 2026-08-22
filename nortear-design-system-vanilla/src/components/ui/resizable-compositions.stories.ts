import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createResizablePanel } from './resizable';
import { frame } from './resizable.fixtures';
import {
  resizableSource,
  resizableSourceAninhado,
  resizableSourceCom,
} from './resizable.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Resizable/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: resizableSource },
      description: {
        component:
          'Composicoes reais do Resizable: EditorComPreview (editor + preview lado a lado), SidebarComConteudoEConsole (sidebar | conteúdo / console — layout aninhado tipo IDE), ListaDetalhe (lista de itens + painel de detalhes) e TresColunas (navegação | conteúdo | metadados). A fábrica expõe onLayout, minSize e maxSize; persistir o layout fica a cargo de quem consome.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Um eixo, um dono.
 *
 * O conteúdo do painel pedia `overflow: auto` para si, dentro de um painel que
 * JÁ rola (`.nds-resizable-panel`). Dois contêineres roláveis empilhados no
 * mesmo eixo: o de dentro ficava fora da ordem de tabulação e o axe reprovava
 * com `scrollable-region-focusable` — conteúdo alcançável só com mouse (WCAG
 * 2.1.1). Quem rola é o painel, que é focável; o bloco de dentro só desenha.
 * Mesma regra registrada em `01-acessibilidade.md` na rodada do data-table.
 */
function block(title: string, body: string, extraClass = ''): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `nds-w-full nds-p-4 ${extraClass}`.trim();
  wrap.style.height = '100%';

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

/**
 * Nome de cada divisor, na ordem em que aparecem no grupo.
 *
 * O nome nomeia o PAR de painéis que o divisor move — dois separadores com o
 * mesmo texto são dois controles indistinguíveis na lista do leitor de tela, e
 * era isso que a numeração "(1/2)" tapava.
 */
function rotulos(...pares: string[]): string[] {
  return pares.map((par) => `Redimensionar ${par} — use setas para ajustar`);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const EditorWithPreview: Story = {
  parameters: {
    docs: {
      source: {
        transform: resizableSourceCom({
          withHandle: true,
          'aria-label': 'Redimensionar Editor e Preview — use setas para ajustar',
          panels: [
            { titulo: 'Editor', defaultSize: 50, minSize: 25 },
            { titulo: 'Preview', defaultSize: 50, minSize: 25 },
          ],
        }),
      },
    },
  },
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
      withHandle: true,
      'aria-label': rotulos('Editor e Preview'),
      panels: [
        { defaultSize: 50, minSize: 25, content: editor },
        { defaultSize: 50, minSize: 25, content: preview },
      ],
    });
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

export const SidebarWithContentAndConsole: Story = {
  name: 'Sidebar + content / console',
  parameters: {
    // Override de story: um grupo dentro do painel de outro pede outra FORMA de
    // snippet — cada grupo nomeia o próprio divisor.
    docs: {
      source: {
        transform: resizableSourceAninhado({
          interno: {
            direction: 'vertical',
            withHandle: true,
            'aria-label': 'Redimensionar Conteúdo e Console — use setas para ajustar',
            panels: [
              { titulo: 'Conteúdo', defaultSize: 70, minSize: 30 },
              { titulo: 'Console', defaultSize: 30, minSize: 15 },
            ],
          },
          externo: {
            withHandle: true,
            'aria-label': 'Redimensionar Arquivos e área principal — use setas para ajustar',
            panels: [
              { titulo: 'Arquivos', defaultSize: 25, minSize: 15 },
              { titulo: 'Área principal', defaultSize: 75, minSize: 40 },
            ],
          },
          vizinho: { titulo: 'Arquivos', defaultSize: 25, minSize: 15 },
        }),
      },
    },
  },
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
      withHandle: true,
      'aria-label': rotulos('Conteúdo e Console'),
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
      withHandle: true,
      'aria-label': rotulos('Arquivos e área principal'),
      panels: [
        { defaultSize: 25, minSize: 15, content: sidebar },
        { defaultSize: 75, minSize: 40, content: rightWrap },
      ],
    });
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

export const ListDetail: Story = {
  parameters: {
    docs: {
      source: {
        transform: resizableSourceCom({
          withHandle: true,
          'aria-label': 'Redimensionar Lista e Detalhe — use setas para ajustar',
          panels: [
            { titulo: 'Inbox (4)', defaultSize: 35, minSize: 20 },
            { titulo: 'Detalhe', defaultSize: 65, minSize: 35 },
          ],
        }),
      },
    },
  },
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
      withHandle: true,
      'aria-label': rotulos('Lista e Detalhe'),
      panels: [
        { defaultSize: 35, minSize: 20, content: list },
        { defaultSize: 65, minSize: 35, content: detail },
      ],
    });
    return frame(root, '300px');
  },
  play: async ({ canvasElement, step }) => {
    await step('Renderiza dois painéis na proporção declarada', async () => {
      // A medida é a da TELA. A versão anterior afirmava `style.width === '35%'`
      // — largura inline que o `flex-basis: 0` da folha compartilhada ignora:
      // a asserção passava com os dois painéis desenhados 50/50.
      const [a, b] = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')].map(
        (p) => p.getBoundingClientRect().width,
      );
      await expect(a / (a + b)).toBeCloseTo(0.35, 1);
    });
  },
};

export const ThreeColumns: Story = {
  parameters: {
    // Override de story: três painéis são DOIS divisores, e é aqui que o nome
    // por divisor — o array de `aria-label` — deixa de ser opcional.
    docs: {
      source: {
        transform: resizableSourceCom({
          withHandle: true,
          'aria-label': [
            'Redimensionar a coluna Navegação — use setas para ajustar',
            'Redimensionar a coluna Metadados — use setas para ajustar',
          ],
          panels: [
            { titulo: 'Navegação', defaultSize: 20, minSize: 12 },
            { titulo: 'Conteúdo', defaultSize: 55, minSize: 30 },
            { titulo: 'Metadados', defaultSize: 25, minSize: 15 },
          ],
        }),
      },
    },
  },
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
      withHandle: true,
      // Um nome por divisor: o primeiro move Navegação/Conteúdo, o segundo
      // Conteúdo/Metadados. São duas colunas diferentes, e o leitor de tela
      // precisa poder distingui-las.
      'aria-label': rotulos('a coluna Navegação', 'a coluna Metadados'),
      panels: [
        { defaultSize: 20, minSize: 12, content: nav },
        { defaultSize: 55, minSize: 30, content },
        { defaultSize: 25, minSize: 15, content: meta_ },
      ],
    });
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
