import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createSlider } from './slider';
import { withLabel } from './slider.fixtures';
import { sliderSource, sliderSourceWith } from './slider.source';
import { apertarTecla, sliderTrack, handleValue } from '@shared/testing/slider-probe';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Slider/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sliderSource },
      description: {
        component:
          'Variantes do Slider: Single (uma alça, padrão), Range (composição de duas alças adjacentes com clamping mútuo — a factory controla um valor por instância) e Vertical (`orientation="vertical"`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Single ───────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () =>
    withLabel({
      idPrefix: 'v-single',
      labelText: 'Volume',
      'aria-label': 'Volume',
      value: 50,
      unit: '%',
    }),
  parameters: {
    docs: {
      description: {
        story: 'Variante padrão — uma alça representando um valor escalar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Single tem exatamente 1 alça, com nome acessível', async () => {
      const alcas = canvas.getAllByRole('slider');
      await expect(alcas).toHaveLength(1);
      await expect(alcas[0]).toHaveAttribute('aria-label', 'Volume');
    });

    await step('ArrowRight anda um passo', async () => {
      const antes = handleValue(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });
  },
};

// ─── Range ────────────────────────────────────────────────────────────────────

export const Range: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // O assunto é o PAR de valores: é ele que pede as duas alças, e o snippet
      // do meta mostraria uma alça só.
      source: {
        transform: sliderSourceWith({
          value: [20, 80],
          'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo'],
          onValueChange: '([minimo, maximo]) => mostrarFaixa(minimo, maximo)',
        }),
      },
      description: {
        story:
          'Faixa com mínimo e máximo. Um par de valores pede as duas alças na MESMA instância: ' +
          'o preenchimento fica entre elas, cada uma tem o seu nome acessível, e nenhuma passa ' +
          'da outra.',
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';
    const label = document.createElement('label');
    label.id = 'v-range-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = 'Faixa de preço';
    const valueText = document.createElement('span');
    valueText.id = 'v-range-value';
    valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
    valueText.setAttribute('aria-live', 'polite');

    const fmt = ([minV, maxV]: number[]) => {
      valueText.textContent = `R$ ${minV} — R$ ${maxV}`;
    };
    fmt([20, 80]);

    row.append(label, valueText);

    // Um par de valores, uma instância. Antes eram dois sliders adjacentes com
    // clamping escrito à mão em cada `onValueChange` — o contorno de quando a
    // fábrica só sabia carregar um número.
    const faixa = createSlider({
      min: 0,
      max: 100,
      step: 1,
      value: [20, 80],
      'aria-label': ['Faixa de preço — mínimo', 'Faixa de preço — máximo'],
      onValueChange: fmt,
    });

    wrap.append(row, faixa);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Duas alças, cada uma com nome próprio', async () => {
      // "Faixa de preço" repetido duas vezes não diria qual alça está em foco.
      const alcas = canvas.getAllByRole('slider');
      await expect(alcas).toHaveLength(2);
      await expect(alcas.map((a) => a.getAttribute('aria-label'))).toEqual([
        'Faixa de preço — mínimo',
        'Faixa de preço — máximo',
      ]);
    });

    await step('Valor formatado como faixa', async () => {
      await expect(canvas.getByText(/R\$ 20 — R\$ 80/)).toBeVisible();
    });

    await step('O preenchimento cobre só o trecho ENTRE as alças', async () => {
      // É o que separa um intervalo de duas alças soltas: a barra pintada não
      // começa no mínimo do trilho, começa na primeira alça.
      const preenchimento = canvasElement.querySelector<HTMLElement>('.nds-slider-range');
      await expect(preenchimento).not.toBeNull();
      await expect(preenchimento!.style.left).toBe('20%');
      await expect(preenchimento!.style.width).toBe('60%');
    });

    await step('O mínimo não passa do máximo', async () => {
      await apertarTecla(canvas.getAllByRole('slider')[0], '{End}');
      await expect(handleValue(canvas.getAllByRole('slider')[0])).toBeLessThanOrEqual(
        handleValue(canvas.getAllByRole('slider')[1]),
      );
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: {
        transform: sliderSourceWith({ orientation: 'vertical', value: 60, 'aria-label': 'Brilho' }),
      },
      description: {
        story:
          '`orientation="vertical"` — o trilho fica em pé, a orientação é anunciada e as setas de cima e de baixo movem o valor. O componente traz altura mínima própria.',
      },
    },
  },
  render: () =>
    withLabel({
      idPrefix: 'v-vertical',
      labelText: 'Brilho',
      'aria-label': 'Brilho',
      value: 60,
      unit: '%',
      orientation: 'vertical',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação vertical é anunciada', async () => {
      // `<input type="range">` é horizontal por definição na árvore de
      // acessibilidade; em pé, a orientação precisa ser dita.
      await expect(canvas.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('O trilho fica em pé', async () => {
      // A orientação não pode ser só um atributo: a geometria vira junto, senão
      // o controle continua deitado dizendo que está de pé.
      const caixa = sliderTrack(canvasElement).getBoundingClientRect();
      await expect(caixa.height).toBeGreaterThan(caixa.width);
    });

    await step('ArrowUp incrementa no eixo vertical', async () => {
      const antes = handleValue(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowUp}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });
  },
};
