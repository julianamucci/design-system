import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSlider } from './slider';

const meta: Meta = {
  title: 'UI/Slider/Estados',
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Slider: Default (valor inicial neutro), Focus (anel `--ring` no thumb via teclado), Active (durante arrasto/teclas), Disabled (`opacity-50`, sem pointer events) e ValorMaximo (no limite max). Hover não tem story própria — estado puramente visual.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(opts: {
  idPrefix: string;
  labelText: string;
  ariaLabel: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  unit?: string;
}): HTMLElement {
  const { idPrefix, labelText, ariaLabel, min = 0, max = 100, step = 1, value = 0, disabled = false, unit = '' } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col gap-2 w-72';

  const row = document.createElement('div');
  row.className = 'flex items-center justify-between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'text-sm font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'text-sm tabular-nums text-muted-foreground';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    disabled,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
    },
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('aria-labelledby', `${idPrefix}-label`);
    input.id = `${idPrefix}-input`;
  }

  wrap.append(row, slider);
  return wrap;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-default',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão — valor inicial 50, thumb branco com borda `--ring`, track `--muted` e range `--primary`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Valor padrão exibido', async () => {
      await expect(canvas.getByText('50%')).toBeVisible();
    });
  },
};

// ─── Focus ────────────────────────────────────────────────────────────────────

export const Focus: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-focus',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Estado de foco via teclado — anel `--ring` visível ao redor do thumb após Tab.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Input recebe foco', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      input.focus();
      await expect(input).toHaveFocus();
    });
  },
};

// ─── Active (alteração via teclas) ────────────────────────────────────────────

export const Active: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-active',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Estado ativo durante navegação por teclado. Setas alteram em `step`; PageUp/PageDown em 10× step; Home/End vão para min/max.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;

    await step('ArrowRight incrementa', async () => {
      input.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      await expect(input.value).toBe('53');
      await expect(canvas.getByText('53%')).toBeVisible();
    });

    await step('ArrowLeft decrementa', async () => {
      input.focus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(input.value).toBe('52');
    });

    await step('Home vai ao mínimo', async () => {
      input.focus();
      await userEvent.keyboard('{Home}');
      await expect(input.value).toBe('0');
      await expect(canvas.getByText('0%')).toBeVisible();
    });

    await step('End vai ao máximo', async () => {
      input.focus();
      await userEvent.keyboard('{End}');
      await expect(input.value).toBe('100');
      await expect(canvas.getByText('100%')).toBeVisible();
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-disabled',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      disabled: true,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado — `opacity-50`, cursor `not-allowed`, sem pointer events nem teclado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Input está disabled', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      await expect(input).toBeDisabled();
    });
  },
};

// ─── ValorMaximo ──────────────────────────────────────────────────────────────

export const ValorMaximo: Story = {
  render: () =>
    withLabel({
      idPrefix: 's-max',
      labelText: 'Brilho',
      ariaLabel: 'Brilho',
      value: 100,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Slider no limite máximo — range preenchido por completo, texto adjacente confirma o valor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Valor exibido é 100%', async () => {
      await expect(canvas.getByText('100%')).toBeVisible();
    });
    await step('ArrowRight não ultrapassa o máximo', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      input.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(input.value).toBe('100');
    });
  },
};
