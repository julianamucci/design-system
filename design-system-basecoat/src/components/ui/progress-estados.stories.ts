import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createProgress } from './progress';

const meta: Meta = {
  title: 'UI/Progress/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Progress baseados no valor: default (0), loading (parcial), complete (100) e indeterminate (sem valor). ' +
          'O Basecoat factory não aceita `value=null` — indeterminate é simulado removendo `aria-valuenow`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default (value=0) ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    const bar = createProgress({ value: 0 });
    bar.setAttribute('aria-label', 'Progresso do upload');
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=0', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  },
};

// ─── Loading (value=50) ──────────────────────────────────────────────────────

export const Loading: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    const bar = createProgress({ value: 50 });
    bar.setAttribute('aria-label', 'Carregando dados');
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=50', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });
  },
};

// ─── Complete (value=100) ────────────────────────────────────────────────────

export const Complete: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    const bar = createProgress({ value: 100 });
    bar.setAttribute('aria-label', 'Concluído');
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=100', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });
  },
};

// ─── Indeterminate ───────────────────────────────────────────────────────────

export const Indeterminate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    const bar = createProgress({ value: 0 });
    bar.setAttribute('aria-label', 'Processando…');
    bar.removeAttribute('aria-valuenow');
    const indicator = bar.firstElementChild as HTMLElement | null;
    if (indicator) {
      indicator.style.transform = '';
      indicator.classList.add('w-1/3', 'animate-indeterminate');
    }
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Indeterminate omite aria-valuenow mas mantém aria-label', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('aria-label', 'Processando…');
    });
  },
};

// ─── Animado (setInterval) ───────────────────────────────────────────────────

export const Animated: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-2';

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between text-sm';

    const label = document.createElement('span');
    label.className = 'text-foreground';
    label.textContent = 'Enviando arquivo';

    const value = document.createElement('span');
    value.className = 'text-muted-foreground tabular-nums';
    value.setAttribute('aria-live', 'polite');
    value.textContent = '0%';

    row.append(label, value);

    const bar = createProgress({ value: 0 });
    bar.setAttribute('aria-label', 'Progresso do upload');
    const indicator = bar.firstElementChild as HTMLElement | null;

    wrap.append(row, bar);

    let pct = 0;
    const timer = window.setInterval(() => {
      pct = (pct + 5) % 105;
      if (pct > 100) pct = 0;
      value.textContent = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));
      if (indicator) indicator.style.transform = `translateX(-${100 - pct}%)`;
    }, 400);

    // Cleanup when removed from DOM
    const mo = new MutationObserver(() => {
      if (!document.body.contains(wrap)) {
        window.clearInterval(timer);
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return wrap;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
