import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSlider } from './slider';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Slider/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Slider: Volume (single, com unidade), Brilho (single, step grande), FaixaDePreco (range — composição manual de 2 sliders com clamping mútuo, já que o factory custom não suporta 2 thumbs) e EmFormulario (integrado a `<form>` com debounce de analytics). DIVERGÊNCIA Basecoat: factory é wrapper de `<input type="range">` nativo — sem range nativo, sem `onValueCommitted` (debounce manual), sem orientação vertical acessível.',
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
  onValueChange?: (v: number) => void;
}): HTMLElement {
  const { idPrefix, labelText, ariaLabel, min = 0, max = 100, step = 1, value = 0, unit = '', onValueChange } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'sm';
  wrap.style.width = '20rem';

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
      onValueChange?.(v);
    },
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('aria-labelledby', `${idPrefix}-label`);
    input.setAttribute('aria-describedby', `${idPrefix}-value`);
    input.id = `${idPrefix}-input`;
    input.name = idPrefix;
  }

  wrap.append(row, slider);
  return wrap;
}

// ─── Volume ───────────────────────────────────────────────────────────────────

export const Volume: Story = {
  render: () =>
    withLabel({
      idPrefix: 'comp-volume',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Caso clássico: controle de volume com valor exibido em "%" ao lado e atualização ao vivo via `aria-live="polite"`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label e valor visíveis', async () => {
      await expect(canvas.getByText('Volume')).toBeVisible();
      await expect(canvas.getByText('50%')).toBeVisible();
    });
  },
};

// ─── Brilho ───────────────────────────────────────────────────────────────────

export const Brilho: Story = {
  render: () =>
    withLabel({
      idPrefix: 'comp-brightness',
      labelText: 'Brilho',
      ariaLabel: 'Brilho',
      min: 0,
      max: 100,
      step: 5,
      value: 75,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Controle de brilho com `step=5` — granularidade discreta para evitar movimentos minúsculos quando o ajuste fino não importa.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Valor inicial 75%', async () => {
      await expect(canvas.getByText('75%')).toBeVisible();
    });
  },
};

// ─── FaixaDePreco (range composto) ────────────────────────────────────────────

export const FaixaDePreco: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';
    const label = document.createElement('label');
    label.id = 'comp-range-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Faixa de preço';
    const valueText = document.createElement('span');
    valueText.id = 'comp-range-value';
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
      minInput.setAttribute('aria-labelledby', 'comp-range-label');
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
      maxInput.setAttribute('aria-labelledby', 'comp-range-label');
    }

    wrap.append(row, minSlider, maxSlider);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'DIVERGÊNCIA Basecoat: o factory custom NÃO suporta 2 thumbs (`value` é `number`, não `number[]`). Composição manual com 2 sliders adjacentes e clamping mútuo (min nunca passa max, e vice-versa). Cada `<input type="range">` recebe `aria-label` independente — "mínimo" e "máximo".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Dois inputs distintos', async () => {
      const inputs = canvasElement.querySelectorAll('input[type="range"]');
      await expect(inputs).toHaveLength(2);
    });
    await step('Faixa formatada corretamente', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

// ─── EmFormulario ─────────────────────────────────────────────────────────────

export const EmFormulario: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'md';
    form.style.width = '20rem';
    form.setAttribute('aria-label', 'Configuracoes de áudio');

    // Debounce manual — o factory Basecoat não tem onValueCommitted
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    let lastCommitted = 60;

    const submitStatus = document.createElement('p');
    submitStatus.className = 'nds-text-caption nds-text-muted-foreground';
    submitStatus.setAttribute('aria-live', 'polite');
    submitStatus.textContent = 'Aguardando alteração…';

    const volume = withLabel({
      idPrefix: 'form-volume',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: lastCommitted,
      unit: '%',
      onValueChange: (v) => {
        if (debounceId) clearTimeout(debounceId);
        debounceId = setTimeout(() => {
          lastCommitted = v;
          submitStatus.textContent = `Commitado: ${v}% (analytics dispararia aqui)`;
        }, 300);
      },
    });

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-primary';
    submit.textContent = 'Salvar';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitStatus.textContent = `Enviado: volume=${lastCommitted}%`;
    });

    form.append(volume, submit, submitStatus);
    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slider em formulário com debounce manual de 300ms para simular `onValueCommitted` — DIVERGÊNCIA Basecoat: o factory custom não expõe callback de commit separado, então debounce manual é necessário para analytics, evitando 1 evento por tecla pressionada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Form com aria-label', async () => {
      const form = canvasElement.querySelector('form');
      await expect(form).toHaveAttribute('aria-label', 'Configuracoes de áudio');
    });
    await step('Status inicial visível', async () => {
      await expect(canvas.getByText(/Aguardando alteração/)).toBeVisible();
    });
  },
};
