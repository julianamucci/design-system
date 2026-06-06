import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCollapsible } from './collapsible';
import { createCollapsibleDocs } from '@/components/docs/CollapsibleDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CollapsibleArgs = {
  defaultOpen: boolean;
  disabled: boolean;
};

const meta: Meta<CollapsibleArgs> = {
  title: 'UI/Collapsible',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(createCollapsibleDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial aberto (modo não-controlado)',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<CollapsibleArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const content = document.createElement('div');
    content.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';
    content.dataset.spacing = 'sm';
    const p1 = document.createElement('p');
    p1.textContent = 'Filtro avançado 1';
    const p2 = document.createElement('p');
    p2.textContent = 'Filtro avançado 2';
    content.appendChild(p1);
    content.appendChild(p2);

    return createCollapsible({
      trigger: 'Exibir filtros avançados',
      content,
      defaultOpen: args.defaultOpen,
      disabled: args.disabled,
      class: 'nds-w-full nds-max-w-sm',
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger começa com aria-expanded=false por padrão', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger abre o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar novamente fecha o painel', async () => {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Enter abre o painel', async () => {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space fecha o painel', async () => {
      trigger.focus();
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
