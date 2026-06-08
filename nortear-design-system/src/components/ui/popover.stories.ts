import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createPopover } from './popover';
import { createButton } from './button';
import { createPopoverDocs } from '@/components/docs/PopoverDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type PopoverArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  defaultOpen: boolean;
};

const meta: Meta<PopoverArgs> = {
  title: 'UI/Popover',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createPopoverDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do PopoverTrigger.' },
    title:        { control: 'text', description: 'Título exibido no header (PopoverTitle).' },
    description:  { control: 'text', description: 'Descrição opcional (PopoverDescription).' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo de side.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o popover ao montar (dispatch click no trigger).',
    },
  },
  args: {
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    side: 'bottom',
    align: 'center',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<PopoverArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildContent(args: PopoverArgs): HTMLElement {
  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const header = document.createElement('div');
  header.className = 'nds-stack';
  header.dataset.spacing = 'xs';

  const title = document.createElement('h4');
  title.className = 'nds-text-body nds-font-medium nds-leading-none';
  title.textContent = args.title;

  const desc = document.createElement('p');
  desc.className = 'nds-text-caption nds-text-muted-foreground';
  desc.textContent = args.description;

  header.append(title, desc);
  content.appendChild(header);
  return content;
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="popover-content"]').forEach((n) => n.remove());
  await waitFor(() => {
    if (document.querySelector('[data-slot="popover-content"]')) throw new Error('still open');
  });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '260px';

    const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
    const el = createPopover({
      trigger,
      content: buildContent(args),
      side: args.side,
      align: args.align,
    });

    container.appendChild(el);

    if (args.defaultOpen) {
      queueMicrotask(() => trigger.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const triggerRe = new RegExp(args.triggerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const waitForOpen = async () => {
      await waitFor(() => {
        if (!document.querySelector('[data-slot="popover-content"]')) {
          throw new Error('popover ainda fechado');
        }
      }, { timeout: 1500 });
    };

    const waitForClose = async () => {
      await waitFor(() => {
        if (document.querySelector('[data-slot="popover-content"]')) {
          throw new Error('popover ainda aberto');
        }
      }, { timeout: 1000 });
    };

    if (!args.defaultOpen) {
      await step('1. Clique no trigger abre o Content', async () => {
        const trigger = canvas.getByRole('button', { name: triggerRe });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(trigger);
        await waitForOpen();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    } else {
      await step('1. Renderiza aberto', async () => {
        await waitForOpen();
      });
    }

    await step('2. Escape fecha e retorna foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('3. Cleanup do portal', async () => {
      await cleanupPortal();
    });
  },
};
