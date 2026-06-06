import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fireEvent } from 'storybook/test';
import { createSlider } from './slider';
import { createSliderDocs } from '@/components/docs/SliderDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SliderArgs = {
  min: number;
  max: number;
  step: number;
  value: number;
  disabled: boolean;
  ariaLabel: string;
  unit: string;
};

const meta: Meta<SliderArgs> = {
  title: 'UI/Slider',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSliderDocs) },
  },
  argTypes: {
    min: { control: { type: 'number' }, description: 'Valor mínimo.' },
    max: { control: { type: 'number' }, description: 'Valor máximo.' },
    step: { control: { type: 'number' }, description: 'Incremento por seta/arrasto.' },
    value: { control: { type: 'number' }, description: 'Valor inicial (number — não array no Basecoat).' },
    disabled: { control: 'boolean', description: 'Desabilita o slider.' },
    ariaLabel: { control: 'text', description: 'aria-label OBRIGATÓRIO para o <input type="range"> interno.' },
    unit: { control: 'text', description: 'Unidade exibida ao lado do valor (ex.: "%", "px"). Apenas visual.' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    disabled: false,
    ariaLabel: 'Volume',
    unit: '%',
  },
};

export default meta;
type Story = StoryObj<SliderArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '18rem';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';

    const label = document.createElement('label');
    label.id = 'pg-slider-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = args.ariaLabel;

    const valueText = document.createElement('span');
    valueText.id = 'pg-slider-value';
    valueText.className = 'nds-text-body nds-text-muted-foreground';
    valueText.style.fontVariantNumeric = 'tabular-nums';
    valueText.setAttribute('aria-live', 'polite');
    valueText.textContent = `${args.value}${args.unit}`;

    row.append(label, valueText);

    const slider = createSlider({
      min: args.min,
      max: args.max,
      step: args.step,
      value: args.value,
      disabled: args.disabled,
      onValueChange: (v) => {
        valueText.textContent = `${v}${args.unit}`;
      },
    });

    const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
    if (input) {
      input.setAttribute('aria-label', args.ariaLabel);
      input.setAttribute('aria-labelledby', 'pg-slider-label');
      input.setAttribute('aria-describedby', 'pg-slider-value');
      input.id = 'pg-slider-input';
    }

    wrap.append(row, slider);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Slider possui input type="range" com aria-label', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      await expect(input).toBeTruthy();
      await expect(input).toHaveAttribute('aria-label', 'Volume');
    });

    await step('Valor inicial exibido textualmente', async () => {
      await expect(canvas.getByText('50%')).toBeVisible();
    });

    await step('Mudança incremental do valor (step=1) via input', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      input.focus();
      // Native range nem sempre responde a userEvent.keyboard em ambientes de teste;
      // disparamos input/change diretamente para validar o pipeline de atualização.
      input.value = '51';
      fireEvent.input(input);
      await expect(input.value).toBe('51');
      await expect(canvas.getByText('51%')).toBeVisible();
    });

    await step('Define valor mínimo via input', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      input.value = '0';
      fireEvent.input(input);
      await expect(input.value).toBe('0');
      await expect(canvas.getByText('0%')).toBeVisible();
    });

    await step('Define valor máximo via input', async () => {
      const input = canvasElement.querySelector('input[type="range"]') as HTMLInputElement;
      input.value = '100';
      fireEvent.input(input);
      await expect(input.value).toBe('100');
      await expect(canvas.getByText('100%')).toBeVisible();
    });
  },
};
