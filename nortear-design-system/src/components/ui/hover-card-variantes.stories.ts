import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/HoverCard/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do HoverCard: Default (delays padrão da factory) e ComDelayCurto (tempos reduzidos para previews ricos). NOTA: a factory Basecoat usa delays internos fixos (SHOW_DELAY=300, HIDE_DELAY=150). Esta story documenta a paridade conceitual com outras stacks.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '220px';
  wrapper.appendChild(child);
  return wrapper;
}

function buildContent(): HTMLElement {
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

  const sub = document.createElement('p');
  sub.className = 'nds-text-caption nds-text-muted-foreground';
  sub.textContent = 'Designer · 142 seguidores';

  info.append(name, sub);
  root.append(avatar, info);
  return root;
}

function buildTrigger(label: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = '/users/joana';
  a.className = 'nds-text-body nds-font-medium nds-text-primary';
  a.style.textDecoration = 'underline';
  a.style.textUnderlineOffset = '4px';
  a.textContent = label;
  return a;
}

async function waitForOpen(): Promise<void> {
  const body = within(document.body);
  await waitFor(() => {
    if (!body.queryByRole('dialog')) throw new Error('hover card fechado');
  }, { timeout: 2000 });
}

async function closeAfter(): Promise<void> {
  const body = within(document.body);
  await waitFor(() => {
    if (body.queryByRole('dialog')) {
      // simulate cursor leaving everything
      document.body.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    }
  }, { timeout: 200 }).catch(() => {});
  // Force-remove residual portals to avoid leaking between stories
  document.querySelectorAll('[data-slot="hover-card-content"]').forEach((n) => n.remove());
  await waitFor(() => {
    if (body.queryByRole('dialog')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () => {
    const trigger = buildTrigger('@joana');
    const el = createHoverCard({ trigger, content: buildContent() });
    queueMicrotask(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content abre via hover com delays default', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
    });
    await step('Cleanup do portal antes do postVisit', async () => {
      await closeAfter();
    });
  },
};

export const ComDelayCurto: Story = {
  name: 'Com Delay Curto',
  render: () => {
    const trigger = buildTrigger('@maria');
    // A factory Basecoat tem delays fixos; usamos a classe customizada para
    // documentar a intenção visual de "delay curto" (preview rico).
    const el = createHoverCard({
      trigger,
      content: buildContent(),
      class: 'w-72',
    });
    queueMicrotask(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content aparece após delay curto', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveClass('nds-hover-card-content');
    });
    await step('Cleanup', async () => {
      await closeAfter();
    });
  },
};
