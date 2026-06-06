import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSlider } from './slider';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Slider/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Slider: Single (1 thumb, padrão), Range (composição com 2 sliders adjacentes — o factory custom do Basecoat não suporta 2 thumbs nativamente) e Vertical (NÃO suportado de forma acessível — `<input type="range">` nativo não tem orientação vertical com ARIA correto; documentada como divergência).',
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
  unit?: string;
}): HTMLElement {
  const { idPrefix, labelText, ariaLabel, min = 0, max = 100, step = 1, value = 0, unit = '' } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'sm';
  wrap.style.width = '18rem';

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.justify = 'between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'nds-text-body nds-text-muted-foreground';
  valueText.style.fontVariantNumeric = 'tabular-nums';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
    },
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('aria-labelledby', `${idPrefix}-label`);
    input.setAttribute('aria-describedby', `${idPrefix}-value`);
  }

  wrap.append(row, slider);
  return wrap;
}

// ─── Single ───────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () =>
    withLabel({
      idPrefix: 'v-single',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      min: 0,
      max: 100,
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story:
          'Variante padrão — um único thumb representando um valor escalar. `value` é `number` no Basecoat (não `number[]` como nas libs upstream).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input range presente com aria-label', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('aria-label', 'Volume');
    });
    await step('Valor exibido', async () => {
      await expect(canvas.getByText('50%')).toBeVisible();
    });
  },
};

// ─── Range ────────────────────────────────────────────────────────────────────

export const Range: Story = {
  render: () => {
    // Composição manual com 2 sliders — factory custom não suporta 2 thumbs
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';
    const label = document.createElement('label');
    label.id = 'v-range-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Faixa de preço';
    const valueText = document.createElement('span');
    valueText.id = 'v-range-value';
    valueText.className = 'nds-text-body nds-text-muted-foreground';
    valueText.style.fontVariantNumeric = 'tabular-nums';
    valueText.setAttribute('aria-live', 'polite');

    let minV = 100;
    let maxV = 400;
    const fmt = () => {
      valueText.textContent = `R$ ${minV} — R$ ${maxV}`;
    };
    fmt();

    row.append(label, valueText);

    const minSlider = createSlider({
      min: 0,
      max: 1000,
      step: 10,
      value: minV,
      onValueChange: (v) => {
        if (v > maxV) {
          minV = maxV;
          const i = minSlider.querySelector('input[type="range"]') as HTMLInputElement;
          if (i) i.value = String(maxV);
        } else {
          minV = v;
        }
        fmt();
      },
    });
    const minInput = minSlider.querySelector('input[type="range"]') as HTMLInputElement | null;
    if (minInput) {
      minInput.setAttribute('aria-label', 'Faixa de preço — mínimo');
      minInput.setAttribute('aria-labelledby', 'v-range-label');
    }

    const maxSlider = createSlider({
      min: 0,
      max: 1000,
      step: 10,
      value: maxV,
      onValueChange: (v) => {
        if (v < minV) {
          maxV = minV;
          const i = maxSlider.querySelector('input[type="range"]') as HTMLInputElement;
          if (i) i.value = String(minV);
        } else {
          maxV = v;
        }
        fmt();
      },
    });
    const maxInput = maxSlider.querySelector('input[type="range"]') as HTMLInputElement | null;
    if (maxInput) {
      maxInput.setAttribute('aria-label', 'Faixa de preço — máximo');
      maxInput.setAttribute('aria-labelledby', 'v-range-label');
    }

    wrap.append(row, minSlider, maxSlider);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante "Range" — o factory custom do Basecoat NÃO suporta 2 thumbs (`value` é `number`, não `number[]`). Composição manual com 2 sliders adjacentes + estado compartilhado para min/max e clamping mútuo. ARIA: 2 inputs distintos com aria-label "min" e "max".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Dois inputs range — min e max', async () => {
      const inputs = canvasElement.querySelectorAll('input[type="range"]');
      await expect(inputs).toHaveLength(2);
      await expect(inputs[0]).toHaveAttribute('aria-label', 'Faixa de preço — mínimo');
      await expect(inputs[1]).toHaveAttribute('aria-label', 'Faixa de preço — máximo');
    });
    await step('Valor formatado como faixa', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

// ─── Vertical (não suportado) ─────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-italic';
    wrap.dataset.spacing = 'sm';
    wrap.dataset.align = 'center';
    wrap.style.width = '18rem';

    const note = document.createElement('p');
    note.className = 'nds-text-body nds-text-muted-foreground nds-italic';
    note.style.textAlign = 'center';
    note.textContent =
      'A variante "vertical" NÃO é suportada de forma acessível no Basecoat — <input type="range"> nativo não expõe orientação vertical via ARIA. Use a variante horizontal.';

    const fallback = createSlider({ min: 0, max: 100, value: 50 });
    const input = fallback.querySelector('input[type="range"]') as HTMLInputElement | null;
    if (input) input.setAttribute('aria-label', 'Volume (fallback horizontal)');

    wrap.append(note, fallback);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Variante "Vertical" — divergência documentada. O factory custom é um wrapper de `<input type="range">` nativo, que não suporta orientação vertical acessível (rotação via CSS quebra ARIA). Esta story renderiza um fallback horizontal com nota explicativa.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Nota de divergência visível', async () => {
      await expect(canvas.getByText(/NÃO é suportada de forma acessível/)).toBeVisible();
    });
  },
};
