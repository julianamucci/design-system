import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';
import { alcasDoSlider, trilhoDoSlider, valorDaAlca } from '@shared/testing/slider-probe';

const meta: Meta = {
  title: 'UI/Slider/Variants',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Slider: single (um thumb), range (dois thumbs) e vertical (orientation="vertical").',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Single: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    step: 1,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
  },
  parameters: {
    docs: {
      description: {
        story: 'value=[50] — um único thumb controlando um valor numérico.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Single tem exatamente 1 thumb', async () => {
      await expect(canvas.getAllByRole('slider')).toHaveLength(1);
    });

    await step('ArrowRight anda um passo', async () => {
      const alca = canvas.getByRole('slider');
      const antes = valorDaAlca(alca);
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });
  },
};

export const Range: Story = {
  args: {
    value: [20, 80],
    min: 0,
    max: 100,
    step: 1,
    'aria-label': 'Faixa de preço',
    label: 'Faixa de preço',
    showRangeValue: true,
    valueSuffix: '',
    rangePrefix: 'R$ ',
  },
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story: 'value=[20, 80] — dois thumbs controlando min e max de uma faixa.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Range tem exatamente 2 thumbs, em 20 e 80', async () => {
      const thumbs = canvas.getAllByRole('slider');
      await expect(thumbs).toHaveLength(2);
      await expect(valorDaAlca(thumbs[0])).toBe(20);
      await expect(valorDaAlca(thumbs[1])).toBe(80);
    });

    await step('O preenchimento é o miolo entre as duas alças', async () => {
      // Afirma o desenho, não o dado: 80 − 20 do trilho, com folga de subpixel.
      const trilho = trilhoDoSlider(canvasElement);
      const faixa = canvasElement.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
      const pct =
        (faixa.getBoundingClientRect().width / trilho.getBoundingClientRect().width) * 100;
      await expect(Math.abs(pct - 60)).toBeLessThan(1.5);
    });
  },
};

export const Vertical: Story = {
  args: {
    value: [60],
    min: 0,
    max: 100,
    step: 1,
    orientation: 'vertical',
    'aria-label': 'Brilho',
    label: 'Brilho',
    showValue: true,
    valueSuffix: '%',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'orientation="vertical" — o componente já traz altura mínima própria em pé.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação vertical é anunciada', async () => {
      await expect(canvas.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('O trilho fica em pé', async () => {
      // A orientação não pode ser só um atributo: a geometria vira junto, senão
      // o controle continua deitado dizendo que está de pé.
      const caixa = trilhoDoSlider(canvasElement).getBoundingClientRect();
      await expect(caixa.height).toBeGreaterThan(caixa.width);
    });

    await step('ArrowUp incrementa no eixo vertical', async () => {
      const antes = valorDaAlca(alcasDoSlider(canvasElement)[0]);
      (canvas.getByRole('slider') as HTMLElement).focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(valorDaAlca(alcasDoSlider(canvasElement)[0])).toBe(Math.min(100, antes + 1));
    });
  },
};
