import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';

const meta = {
  title: 'UI/Slider/Estados',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Slider: default, focus (foco visível), disabled, no min e no max.',
      },
    },
  },
} satisfies Meta<typeof SliderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    await step('Renderiza com aria-valuenow=50', async () => {
      await expect(thumb).toHaveAttribute('aria-valuenow', '50');
    });
  },
};

export const FocoVisivel: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    'aria-label': 'Volume',
    label: 'Volume',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Foco via teclado: Tab leva ao thumb e setas/Home/End/PgUp/PgDn alteram o valor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');

    await step('Thumb recebe foco programaticamente', async () => {
      (thumb as HTMLElement).focus();
      await expect(thumb).toHaveFocus();
    });

    await step('ArrowRight incrementa o valor', async () => {
      await userEvent.keyboard('{ArrowRight}');
      const valuenow = Number(thumb.getAttribute('aria-valuenow'));
      await expect(valuenow).toBeGreaterThan(50);
    });
  },
};

export const Disabled: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    disabled: true,
    'aria-label': 'Volume',
    label: 'Volume',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');

    await step('Thumb está com data-disabled', async () => {
      await expect(thumb).toHaveAttribute('data-disabled');
    });

    await step('ArrowRight não altera o valor', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '50');
    });
  },
};

export const NoMin: Story = {
  args: {
    value: [0],
    min: 0,
    max: 100,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    await step('aria-valuenow no mínimo', async () => {
      await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    });
    await step('ArrowLeft não passa do mínimo', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    });
  },
};

export const NoMax: Story = {
  args: {
    value: [100],
    min: 0,
    max: 100,
    'aria-label': 'Volume',
    label: 'Volume',
    showValue: true,
    valueSuffix: '%',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    await step('aria-valuenow no máximo', async () => {
      await expect(thumb).toHaveAttribute('aria-valuenow', '100');
    });
    await step('ArrowRight não passa do máximo', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '100');
    });
  },
};
