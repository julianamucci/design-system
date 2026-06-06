import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Slider/Estados',
  component: Slider,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Slider: default, focus, active (durante arrasto), disabled, no min e no max.',
      },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="w-72 space-y-2">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');
    await step('Renderiza com aria-valuenow=50', async () => {
      await expect(thumb).toHaveAttribute('aria-valuenow', '50');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="w-72 space-y-2">
        <Label>Volume</Label>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
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

    await step('PageUp incrementa em 10× step', async () => {
      await userEvent.keyboard('{PageUp}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '60');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="w-72 space-y-2 opacity-100">
        <Label>Volume</Label>
        <Slider v-model="value" :disabled="true" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
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
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([0]);
      return { value };
    },
    template: `
      <div class="w-72 space-y-2">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
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
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([100]);
      return { value };
    },
    template: `
      <div class="w-72 space-y-2">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
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
