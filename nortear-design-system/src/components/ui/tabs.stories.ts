import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';
import { createTabsDocs } from '@/components/docs/TabsDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TabsArgs = {
  defaultValue: string;
  ariaLabel: string;
};

const meta: Meta<TabsArgs> = {
  title: 'UI/Tabs',
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: { page: withAutoDocsTab(createTabsDocs) },
  },
  argTypes: {
    defaultValue: {
      control: 'select',
      options: ['overview', 'properties', 'examples'],
      description: 'Tab ativa inicial (não-controlada).',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label do TabsList — OBRIGATÓRIO. Descreve o agrupamento de tabs.',
    },
  },
  args: {
    defaultValue: 'overview',
    ariaLabel: 'Seções do componente',
  },
};

export default meta;
type Story = StoryObj<TabsArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePanel(text: string): HTMLElement {
  const p = document.createElement('div');
  p.className = 'nds-text-body nds-text-muted-foreground nds-p-3 nds-rounded-md nds-border-default nds-bg-card';
  p.textContent = text;
  return p;
}

function buildItems(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Exemplos de uso.') },
  ];
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const root = createTabs({
      defaultValue: args.defaultValue,
      class: 'w-full max-w-xl',
      items: buildItems(),
    });
    // ARIA: aria-label OBRIGATÓRIO no TabsList.
    root.querySelector('[role="tablist"]')?.setAttribute('aria-label', args.ariaLabel);
    return root;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Primeira tab está ativa (aria-selected=true)', async () => {
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    await step('Clicar na segunda tab ativa o painel correspondente', async () => {
      await userEvent.click(tabs[1]);
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    });

    await step('ArrowRight move e ativa a próxima tab (mode automatic)', async () => {
      tabs[1].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    await step('Home volta para a primeira tab', async () => {
      await userEvent.keyboard('{Home}');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    await step('End vai para a última tab', async () => {
      await userEvent.keyboard('{End}');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    await step('TabsList tem aria-label', async () => {
      const list = canvasElement.querySelector('[role="tablist"]');
      await expect(list).toHaveAttribute('aria-label');
    });
  },
};
