import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createSlider } from './slider';
import { createButton } from './button';
import { createInput } from './input';
import { apertarTecla, valorDaAlca } from '@shared/testing/slider-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Slider/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições reais do Slider: Volume (com unidade), Glow (passo grande), PriceRange (faixa composta por duas alças com clamping mútuo) e InForm (dentro de `<form>`, com o callback de commit alimentando o analytics).',
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
  onValueCommitted?: (v: number) => void;
}): HTMLElement {
  const {
    idPrefix,
    labelText,
    ariaLabel,
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    unit = '',
    onValueChange,
    onValueCommitted,
  } = opts;

  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-sm';
  wrap.dataset.spacing = 'sm';

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.justify = 'between';

  const label = document.createElement('label');
  label.id = `${idPrefix}-label`;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = labelText;

  const valueText = document.createElement('span');
  valueText.id = `${idPrefix}-value`;
  valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
  valueText.setAttribute('aria-live', 'polite');
  valueText.textContent = `${value}${unit}`;

  row.append(label, valueText);

  const slider = createSlider({
    min,
    max,
    step,
    value,
    ariaLabel,
    onValueChange: (v) => {
      valueText.textContent = `${v}${unit}`;
      onValueChange?.(v);
    },
    onValueCommitted,
  });

  const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
  if (input) {
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

    await step('O texto do valor acompanha a alça', async () => {
      const live = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(live).toHaveTextContent(`${Math.min(100, antes + 1)}%`);
    });
  },
};

// ─── Brilho ───────────────────────────────────────────────────────────────────

export const Glow: Story = {
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

    await step('A seta anda um passo inteiro, não uma unidade', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 5));
    });
  },
};

// ─── FaixaDePreco (range composto) ────────────────────────────────────────────

export const PriceRange: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';
    const label = document.createElement('label');
    label.id = 'comp-range-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Faixa de preço';
    const valueText = document.createElement('span');
    valueText.id = 'comp-range-value';
    valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
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
      ariaLabel: 'Faixa de preço — mínimo',
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

    const maxSlider = createSlider({
      min: 0,
      max: 1000,
      step: 10,
      value: maxV,
      ariaLabel: 'Faixa de preço — máximo',
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

    wrap.append(row, minSlider, maxSlider);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Faixa de preço com clamping mútuo: o mínimo nunca passa do máximo e vice-versa. Cada alça recebe o seu nome acessível — "mínimo" e "máximo".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Duas alças, cada uma com nome próprio', async () => {
      const alcas = canvas.getAllByRole('slider');
      await expect(alcas).toHaveLength(2);
      await expect(alcas.map((a) => a.getAttribute('aria-label'))).toEqual([
        'Faixa de preço — mínimo',
        'Faixa de preço — máximo',
      ]);
    });

    await step('Faixa formatada corretamente', async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

// ─── EmFormulario ─────────────────────────────────────────────────────────────

export const InForm: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-w-sm';
    form.dataset.spacing = 'md';
    form.setAttribute('aria-label', 'Configurações de áudio');

    let ultimoCommit = 60;

    const status = document.createElement('p');
    status.className = 'nds-text-caption nds-text-muted-foreground';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Aguardando alteração…';

    const nomeWrap = document.createElement('div');
    nomeWrap.className = 'nds-stack';
    nomeWrap.dataset.spacing = 'sm';
    const nomeLabel = document.createElement('label');
    nomeLabel.className = 'nds-text-body nds-font-medium';
    nomeLabel.htmlFor = 'form-preset';
    nomeLabel.textContent = 'Nome do preset';
    nomeWrap.append(nomeLabel, createInput({ id: 'form-preset', placeholder: 'Meu preset' }));

    const volume = withLabel({
      idPrefix: 'form-volume',
      labelText: 'Volume',
      ariaLabel: 'Volume',
      value: ultimoCommit,
      unit: '%',
      // O commit é o `change` do input nativo — um evento por interação, e não
      // um por pixel arrastado. É ele que alimenta o analytics.
      onValueCommitted: (v) => {
        ultimoCommit = v;
        status.textContent = `Commitado: ${v}%`;
      },
    });

    const submit = createButton({ type: 'submit', label: 'Salvar preset', size: 'sm' });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = `Enviado: volume=${ultimoCommit}%`;
    });

    form.append(nomeWrap, volume, submit, status);
    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Slider em formulário: o callback de commit dispara ao soltar o arrasto ou largar a tecla, e é o que alimenta o analytics — o callback contínuo geraria um evento por pixel.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Formulário tem campo de texto, slider e botão do design system', async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(canvas.getAllByRole('slider')).toHaveLength(1);
      // Classe real do botão: `btn btn-primary` não pinta nada desde a
      // migração, e o botão saía do formulário sem estilo nenhum.
      await expect(canvas.getByRole('button', { name: 'Salvar preset' })).toHaveClass('nds-button');
    });

    await step('O commit registra o valor confirmado', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      const valor = valorDaAlca(canvas.getByRole('slider'));
      await expect(canvas.getByText(`Commitado: ${valor}%`)).toBeVisible();
    });

    await step('Submeter usa o último valor confirmado', async () => {
      const valor = valorDaAlca(canvas.getByRole('slider'));
      await userEvent.click(canvas.getByRole('button', { name: 'Salvar preset' }));
      await expect(canvas.getByText(`Enviado: volume=${valor}%`)).toBeVisible();
    });
  },
};
