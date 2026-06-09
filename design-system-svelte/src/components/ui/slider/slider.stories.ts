import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Slider } from './index';
import SliderStory from './SliderStory.svelte';
import SliderDocs from '@/components/docs/SliderDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SliderDocs),
      description: {
        component:
          'Slider para seleção de valor numérico em faixa contínua. Suporta single (1 thumb), range (2 thumbs) e orientação vertical. value sempre array.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'object',
      description: 'Valor(es) controlado(s). SEMPRE array.',
    },
    min: {
      control: { type: 'number' },
      description: 'Valor mínimo da faixa.',
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo da faixa.',
    },
    step: {
      control: { type: 'number' },
      description: 'Incremento por seta de teclado.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção do slider.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os thumbs.',
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    disabled: false,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: [50],
  } as never,
  render: (args) => ({
    Component: SliderStory,
    props: {
      value: (args.value as number[]) ?? [50],
      min: args.min,
      max: args.max,
      step: args.step,
      orientation: args.orientation,
      disabled: args.disabled,
      'aria-label': 'Volume',
      label: 'Volume',
      showValue: true,
      valueSuffix: '%',
      onValueCommit: fn(),
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('Renderiza 1 thumb com role=slider', async () => {
      await expect(thumbs).toHaveLength(1);
    });

    await step('aria-valuenow inicial é 50', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '50');
    });

    await step('aria-valuemin e aria-valuemax presentes', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuemin', '0');
      await expect(thumbs[0]).toHaveAttribute('aria-valuemax', '100');
    });

    await step('thumb tem aria-label de acessibilidade', async () => {
      const label = thumbs[0].getAttribute('aria-label');
      await expect(label).toBeTruthy();
    });

    await step('ArrowRight incrementa o valor', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      const valuenow = Number(thumbs[0].getAttribute('aria-valuenow'));
      await expect(valuenow).toBeGreaterThanOrEqual(50);
    });
  },
};
