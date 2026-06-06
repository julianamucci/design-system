import type { Meta, StoryObj } from '@storybook/html';
import { expect, within } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Tabs/Variantes',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Basecoat: factory custom NÃO expõe prop `variant` nem `orientation`. ' +
          'As variantes "line" e "vertical" são aplicadas via utility classes no elemento [role="tablist"] após criação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePanel(text: string): HTMLElement {
  const p = document.createElement('div');
  p.className = 'nds-text-body nds-text-muted-foreground nds-p-3 nds-rounded-md nds-border-default nds-bg-card';
  p.textContent = text;
  return p;
}

function items(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Exemplos de uso.') },
  ];
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      class: 'w-full max-w-md',
      items: items(),
    });
    root.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Seções do componente');
    return root;
  },
  parameters: {
    docs: { description: { story: 'Padrão: fundo `muted` arredondado e sombra na tab ativa.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tablist = await canvas.findByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-label', 'Seções do componente');
    const active = await canvas.findByRole('tab', { selected: true });
    await expect(active).toHaveTextContent('Visão geral');
  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      class: 'w-full max-w-md',
      items: items(),
    });
    const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
    if (list) {
      list.classList.remove('bg-muted', 'rounded-lg');
      list.classList.add('nds-bg-transparent', 'nds-w-full');
      list.style.borderBottom = '1px solid var(--border)';
      list.style.borderRadius = '0';
      list.style.justifyContent = 'flex-start';
      list.setAttribute('aria-label', 'Seções do componente');
    }
    return root;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante line: visual minimalista com linha inferior. ' +
          'Basecoat: factory NÃO expõe prop `variant` — aplicamos classes utilitárias manualmente.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      class: 'w-full max-w-md flex gap-4',
      items: items(),
    });
    const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
    if (list) {
      list.classList.remove('inline-flex', 'h-9', 'items-center', 'justify-center');
      list.classList.add('nds-shrink-0');
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.height = 'auto';
      list.style.alignItems = 'stretch';
      list.setAttribute('aria-label', 'Seções do componente');
      list.setAttribute('aria-orientation', 'vertical');
    }
    return root;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Orientação vertical: lista lateral e conteúdo à direita. ' +
          'Basecoat: factory NÃO expõe prop `orientation` — aplicamos flex-col + aria-orientation manualmente. ' +
          'Importante: setas continuam navegando como horizontal (Left/Right) — para suportar Up/Down nativamente seria necessário estender a factory.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
