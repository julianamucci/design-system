import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createProgress } from './progress';

const meta: Meta = {
  title: 'UI/Progress/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Progress. **DIVERGÊNCIA Basecoat**: a factory custom não aceita `value=null` ' +
          'para indeterminate nem expõe subcomponentes `ProgressLabel`/`ProgressValue`/`ProgressTrack`. ' +
          'Indeterminate é simulado removendo `aria-valuenow` e aplicando `animate-indeterminate` no indicador. ' +
          'Label/Value são compostos manualmente via DOM nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Determinate ─────────────────────────────────────────────────────────────

export const Determinate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    const bar = createProgress({ value: 42 });
    bar.setAttribute('aria-label', 'Progresso do upload');
    wrap.appendChild(bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=42', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
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
    await step('Indeterminate não expõe aria-valuenow', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('aria-valuenow');
    });
  },
};

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
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
    value.textContent = '42%';

    row.append(label, value);

    const bar = createProgress({ value: 42 });
    bar.setAttribute('aria-label', 'Progresso do upload');

    wrap.append(row, bar);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label e value visíveis acima da barra', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
      await expect(canvas.getByText('42%')).toBeVisible();
    });
  },
};
