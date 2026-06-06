import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Tooltip: Fechado (apenas trigger), Aberto (dispatch mouseenter) e FocoTeclado (Tab abre via focus event). NOTA: a factory Basecoat usa delay interno fixo (300 ms) por instância — não há TooltipProvider compartilhado. Foco e hover compartilham o mesmo delay.',
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

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Fechado: Story = {
  name: 'Fechado',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Apenas trigger renderiza; tooltip não está no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /salvar/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-describedby');
      await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  },
};

export const Aberto: Story = {
  name: 'Aberto',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    queueMicrotask(() => {
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Tooltip visível com role=tooltip + aria-describedby', async () => {
      await waitForOpen();
      const tip = await body.findByRole('tooltip');
      await expect(tip).toBeVisible();

      const trigger = canvas.getByRole('button', { name: /salvar/i });
      const id = trigger.getAttribute('aria-describedby');
      await expect(id).toBeTruthy();
      await expect(tip.id).toBe(id);
    });
    await step('Cleanup antes do postVisit', async () => { await cleanupPortal(); });
  },
};

export const FocoTeclado: Story = {
  name: 'Foco via Teclado',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Tab foca trigger e abre tooltip (WCAG 1.4.13)', async () => {
      await userEvent.tab();
      const trigger = canvas.getByRole('button', { name: /salvar/i });
      await expect(trigger).toHaveFocus();
      await waitForOpen();
      const tip = await body.findByRole('tooltip');
      await expect(tip).toBeVisible();
    });
    await step('Cleanup', async () => { await cleanupPortal(); });
  },
};
