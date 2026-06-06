import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/HoverCard/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do HoverCard: Fechado (apenas trigger), Aberto (defaultOpen via dispatch mouseenter) e Controlado (dispara via botão externo).',
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
  wrapper.style.minHeight = '200px';
  wrapper.appendChild(child);
  return wrapper;
}

function buildContent(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-stack';
  root.dataset.spacing = 'xs';

  const title = document.createElement('p');
  title.className = 'nds-text-body nds-font-medium';
  title.textContent = 'Joana Silva';

  const sub = document.createElement('p');
  sub.className = 'nds-text-caption nds-text-muted-foreground';
  sub.textContent = 'Designer no time de UX';

  root.append(title, sub);
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

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="hover-card-content"]').forEach((n) => n.remove());
  const body = within(document.body);
  await waitFor(() => {
    if (body.queryByRole('dialog')) throw new Error('still open');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => {
    const trigger = buildTrigger('@joana');
    const el = createHoverCard({ trigger, content: buildContent() });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Apenas o trigger renderiza; portal vazio', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      await expect(trigger).toBeVisible();
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
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
    await step('Content visível com role=dialog', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
    });
    await step('Cleanup antes do postVisit', async () => {
      await cleanupPortal();
    });
  },
};

export const Controlado: Story = {
  name: 'Controlado',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.contain = 'layout';
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';
    wrapper.style.minHeight = '200px';
    wrapper.style.alignItems = 'center';

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    const trigger = buildTrigger('@joana');

    const el = createHoverCard({
      trigger,
      content: buildContent(),
      onOpenChange: (open) => {
        externalBtn.dataset.open = String(open);
      },
    });

    externalBtn.addEventListener('click', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });

    wrapper.append(externalBtn, el);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click externo abre o Content', async () => {
      const btn = canvas.getByRole('button', { name: /open programmatically/i });
      await userEvent.click(btn);
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};
