import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createTooltip } from './tooltip';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Tooltip: Default (texto curto), ComAtalho (texto + atalho de teclado) e TextoLongo (max-w-xs). NOTA: a factory Vanilla NÃO renderiza <kbd> separado nem Arrow — o atalho é parte do texto e a indicação visual é provida por classe customizada.',
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
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

async function waitForOpen(): Promise<void> {
  const body = within(document.body);
  await waitFor(() => {
    if (!body.queryByRole('tooltip')) throw new Error('tooltip fechado');
  }, { timeout: 2000 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
  const body = within(document.body);
  await waitFor(() => {
    if (body.queryByRole('tooltip')) throw new Error('still open');
  });
}

function fireOpen(trigger: HTMLElement): void {
  queueMicrotask(() => {
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar' });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Tooltip default mostra texto curto', async () => {
      await waitForOpen();
      const tip = await waitForPortal('tooltip');
      await expect(tip).toBeVisible();
      await expect(tip.textContent).toMatch(/Salvar/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};

export const WithShortcut: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    // NOTA: factory Vanilla não suporta nodes filhos no content; o atalho
    // é parte do texto. Em React/Vue/Svelte usaríamos <kbd>Ctrl</kbd>+<kbd>S</kbd>.
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Tooltip mostra texto + atalho de teclado', async () => {
      await waitForOpen();
      const tip = await waitForPortal('tooltip');
      await expect(tip.textContent).toMatch(/Ctrl\+S/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};

export const LongText: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Mais informação', ariaLabel: 'Mais informação' });
    const el = createTooltip({
      trigger,
      content:
        'Esta ação salva todas as alterações localmente e sincroniza com o servidor quando houver conexão.',
      class: 'max-w-xs whitespace-normal text-center',
    });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    await step('Tooltip permite texto longo com max-w-xs', async () => {
      await waitForOpen();
      const tip = await waitForPortal('tooltip');
      await expect(tip).toHaveClass(/max-w-xs/);
      await expect(tip.textContent).toMatch(/sincroniza/);
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};
