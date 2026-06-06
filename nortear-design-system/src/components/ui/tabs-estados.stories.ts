import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Tabs/Estados',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
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

function baseItems(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Exemplos de uso.') },
  ];
}

function withDisabled(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo ativo.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Conteúdo bloqueado.'), disabled: true },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Outro conteúdo.') },
  ];
}

function setLabel(root: HTMLElement, label = 'Seções do componente'): HTMLElement {
  root.querySelector('[role="tablist"]')?.setAttribute('aria-label', label);
  return root;
}

// ─── Default (primeira ativa) ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => setLabel(createTabs({ defaultValue: 'overview', class: 'w-full max-w-md', items: baseItems() })),
  parameters: {
    docs: { description: { story: 'Estado inicial: primeira tab ativa, demais inativas.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await step('Primeira tab aria-selected=true', async () => {
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

// ─── Active (segunda ativa via defaultValue) ──────────────────────────────────

export const Active: Story = {
  render: () => setLabel(createTabs({ defaultValue: 'properties', class: 'w-full max-w-md', items: baseItems() })),
  parameters: {
    docs: { description: { story: 'Tab ativa via `defaultValue`. aria-selected=true e fundo/sombra distintos.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await step('Segunda tab aria-selected=true', async () => {
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

// ─── Focus visible ────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () => setLabel(createTabs({ defaultValue: 'overview', class: 'w-full max-w-md', items: baseItems() })),
  parameters: {
    docs: { description: { story: 'Foco via teclado: ring visível na tab focada. Roving tabindex — apenas a tab ativa é Tab-focusable.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Tab ativa é focável via Tab (roving)', async () => {
      tabs[0].focus();
      await expect(tabs[0]).toHaveFocus();
    });

    await step('ArrowRight move foco e ativa próxima', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[1]).toHaveFocus();
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => setLabel(createTabs({ defaultValue: 'overview', class: 'w-full max-w-md', items: withDisabled() })),
  parameters: {
    docs: { description: { story: 'Tab desabilitada: não responde a cliques, opacity-50 e pulada pela navegação por setas.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Segunda tab está disabled', async () => {
      await expect(tabs[1]).toBeDisabled();
    });

    await step('Clique no item disabled não muda seleção', async () => {
      await userEvent.click(tabs[1], { pointerEventsCheck: 0 });
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    await step('ArrowRight pula tab disabled', async () => {
      tabs[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      // Pula properties (disabled) e vai direto para examples.
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });
  },
};
