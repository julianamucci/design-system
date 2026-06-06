import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';
import { createHoverCardDocs } from '@/components/docs/HoverCardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  defaultOpen: boolean;
};

const meta: Meta<HoverCardArgs> = {
  title: 'UI/HoverCard',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createHoverCardDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do HoverCardTrigger.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento horizontal do Content.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o cartão ao montar (simulando hover inicial).',
    },
  },
  args: {
    triggerLabel: '@joana',
    side: 'bottom',
    align: 'center',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<HoverCardArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPreviewContent(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-cluster';
  root.dataset.spacing = 'md';
  root.dataset.align = 'start';

  const avatar = document.createElement('div');
  avatar.className =
    'nds-cluster nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-muted-foreground nds-text-body nds-font-medium';
  avatar.dataset.justify = 'center';
  avatar.style.width = '2.5rem';
  avatar.style.height = '2.5rem';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'JS';

  const info = document.createElement('div');
  info.className = 'nds-stack';
  info.dataset.spacing = 'xs';

  const name = document.createElement('p');
  name.className = 'nds-text-body nds-font-medium nds-leading-none';
  name.textContent = 'Joana Silva';

  const meta = document.createElement('p');
  meta.className = 'nds-text-caption nds-text-muted-foreground';
  meta.textContent = 'Designer · 142 seguidores';

  info.append(name, meta);
  root.append(avatar, info);
  return root;
}

function buildHoverEl(args: HoverCardArgs): { el: HTMLElement; trigger: HTMLAnchorElement } {
  const trigger = document.createElement('a');
  trigger.href = '/users/joana';
  trigger.className = 'nds-text-body nds-font-medium nds-text-primary';
  trigger.style.textDecoration = 'underline';
  trigger.style.textUnderlineOffset = '4px';
  trigger.textContent = args.triggerLabel;

  const el = createHoverCard({
    trigger,
    content: buildPreviewContent(),
    side: args.side,
    align: args.align,
  });
  return { el, trigger };
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '220px';

    const { el, trigger } = buildHoverEl(args);
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
    const triggerRe = new RegExp(args.triggerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const waitForOpen = async () => {
      await waitFor(() => {
        const dialog = body.queryByRole('dialog');
        if (!dialog) throw new Error('hover card ainda fechado');
      }, { timeout: 1500 });
    };

    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('hover card ainda aberto');
      }, { timeout: 1000 });
    };

    if (!args.defaultOpen) {
      await step('Hover no trigger abre o Content', async () => {
        const trigger = canvas.getByRole('link', { name: triggerRe });
        await userEvent.hover(trigger);
        await waitForOpen();
        const dialog = await body.findByRole('dialog');
        await expect(dialog).toBeVisible();
      });
    } else {
      await step('Renderiza aberto', async () => {
        await waitForOpen();
      });
    }

    await step('Mover cursor para fora fecha o Content', async () => {
      await userEvent.unhover(canvas.getByRole('link', { name: triggerRe }));
      await waitForClose();
    });
  },
};
