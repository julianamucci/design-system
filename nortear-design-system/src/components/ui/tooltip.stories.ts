import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton } from './button';
import { createTooltipDocs } from '@/components/docs/TooltipDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TooltipArgs = {
  triggerLabel: string;
  content: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  defaultOpen: boolean;
};

const meta: Meta<TooltipArgs> = {
  title: 'UI/Tooltip',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createTooltipDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto/aria-label do botão trigger.' },
    content:      { control: 'text', description: 'Texto exibido no TooltipContent.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o tooltip ao montar (dispatch mouseenter no trigger).',
    },
  },
  args: {
    triggerLabel: 'Salvar',
    content: 'Salvar (Ctrl+S)',
    side: 'top',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '180px';

    const trigger = createButton({
      variant: 'outline',
      label: args.triggerLabel,
      ariaLabel: args.triggerLabel,
    });

    const el = createTooltip({
      trigger,
      content: args.content,
      side: args.side,
    });
    container.appendChild(el);

    if (args.defaultOpen) {
      queueMicrotask(() => {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForOpen = async () => {
      await waitFor(() => {
        if (!body.queryByRole('tooltip')) throw new Error('tooltip fechado');
      }, { timeout: 2000 });
    };

    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('tooltip')) throw new Error('tooltip ainda aberto');
      }, { timeout: 1000 });
    };

    if (!args.defaultOpen) {
      await step('Hover no trigger abre o Content após delay', async () => {
        const trigger = canvas.getByRole('button', { name: new RegExp(args.triggerLabel, 'i') });
        await userEvent.hover(trigger);
        await waitForOpen();
        const tip = await body.findByRole('tooltip');
        await expect(tip).toBeVisible();
        await expect(tip.textContent).toMatch(new RegExp(args.content.slice(0, 6), 'i'));
      });
    } else {
      await step('Renderiza aberto', async () => {
        await waitForOpen();
      });
    }

    await step('Mover cursor para fora fecha o Content', async () => {
      await userEvent.unhover(canvas.getByRole('button', { name: new RegExp(args.triggerLabel, 'i') }));
      await waitForClose();
    });

    await step('Cleanup do portal', async () => {
      await cleanupPortal();
    });
  },
};
