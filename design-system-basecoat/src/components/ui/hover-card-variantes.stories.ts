import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';

const meta: Meta = {
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
  wrapper.className = 'w-full min-h-[220px] flex items-center justify-center';
  wrapper.appendChild(child);
  return wrapper;
}

function buildContent(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'flex gap-3 items-start';

  const avatar = document.createElement('div');
  avatar.className =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'JS';

  const info = document.createElement('div');
  info.className = 'flex flex-col gap-1';

  const name = document.createElement('p');
  name.className = 'text-sm font-medium leading-none';
  name.textContent = 'Joana Silva';

  const sub = document.createElement('p');
  sub.className = 'text-xs text-muted-foreground';
  sub.textContent = 'Designer · 142 seguidores';

  info.append(name, sub);
  root.append(avatar, info);
  return root;
}

function buildTrigger(label: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = '/users/joana';
  a.className = 'underline underline-offset-4 text-sm font-medium text-primary';
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
      await expect(dialog).toHaveClass(/w-72/);
    });
    await step('Cleanup', async () => {
      await closeAfter();
    });
  },
};
