import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Slider/Variants',
  component: Slider,
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
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" :step="1" aria-label="Volume" />
      </div>
    `,
  }),
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
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '51');
    });
  },
};

export const Range: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([100, 400]);
      return { value };
    },
    template: `
      <div class="" data-spacing="sm" style="width: 18rem">
        <div class="nds-cluster" data-justify="between">
          <Label>Faixa de preço</Label>
          <span aria-live="polite" class="nds-text-body tabular-nums">
            R$ {{ value[0] }} — R$ {{ value[1] }}
          </span>
        </div>
        <Slider v-model="value" :min="0" :max="500" :step="10" aria-label="Faixa de preço" />
      </div>
    `,
  }),
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

    await step('ArrowRight no primeiro thumb incrementa em step=10', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '110');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([60]);
      return { value };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-cluster" data-align="center" data-justify="between" style="width: 10rem">
          <Label>Brilho</Label>
          <span aria-live="polite" class="nds-text-body tabular-nums">{{ value[0] }}%</span>
        </div>
        <div class="nds-cluster" data-justify="center" style="height: 10rem">
          <Slider v-model="value" orientation="vertical" :min="0" :max="100" :step="1" aria-label="Brilho" />
        </div>
      </div>
    `,
  }),
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
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '61');
    });
  },
};
