import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';

const meta = {
  title: 'UI/Slider/Variantes',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Slider: single (um thumb), range (dois thumbs) e vertical (orientation="vertical" com altura definida no container).',
      },
    },
  },
} satisfies Meta<typeof SliderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    const thumbs = canvas.getAllByRole('slider');

    await step('Single tem exatamente 1 thumb', async () => {
      await expect(thumbs).toHaveLength(1);
    });

    await step('aria-valuenow inicial = 50', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '50');
    });

    await step('ArrowRight altera aria-valuenow', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      const valuenow = Number(thumbs[0].getAttribute('aria-valuenow'));
      await expect(valuenow).toBeGreaterThanOrEqual(50);
    });
  },
};

export const Range: Story = {
  args: {
    value: [100, 400],
    min: 0,
    max: 500,
    step: 10,
    'aria-label': 'Faixa de preço',
    label: 'Faixa de preço',
    showRangeValue: true,
    valueSuffix: '',
    rangePrefix: 'R$ ',
  },
  parameters: {
    docs: {
      description: {
        story: 'value=[100, 400] — dois thumbs controlando min e max de uma faixa.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('Range tem exatamente 2 thumbs', async () => {
      await expect(thumbs).toHaveLength(2);
    });

    await step('Valores iniciais 100 e 400', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '100');
      await expect(thumbs[1]).toHaveAttribute('aria-valuenow', '400');
    });

    await step('ArrowRight no primeiro thumb incrementa o valor', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      const valuenow = Number(thumbs[0].getAttribute('aria-valuenow'));
      await expect(valuenow).toBeGreaterThanOrEqual(100);
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
    verticalHeight: 'h-40',
  },
  parameters: {
    docs: {
      description: {
        story: 'orientation="vertical" + container com h-40 — slider em pé.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('Vertical tem 1 thumb', async () => {
      await expect(thumbs).toHaveLength(1);
    });

    await step('aria-orientation=vertical', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('ArrowUp incrementa (vertical)', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowUp}');
      const valuenow = Number(thumbs[0].getAttribute('aria-valuenow'));
      await expect(valuenow).toBeGreaterThanOrEqual(60);
    });
  },
};
