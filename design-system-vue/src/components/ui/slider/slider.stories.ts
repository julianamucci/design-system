import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';
import SliderDocs from '@/components/docs/SliderDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(SliderDocs) },
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'Valor(es) controlado(s). SEMPRE array.',
    },
    defaultValue: {
      control: 'object',
      description: 'Valor(es) inicial(is) não-controlado(s).',
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
    'onUpdate:modelValue': {
      action: 'update:modelValue',
      description: 'Disparado durante o arrasto.',
    },
    onValueCommit: {
      action: 'valueCommit',
      description: 'Disparado ao soltar (drag end ou keyup).',
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
    defaultValue: [50],
    'onUpdate:modelValue': fn(),
    'onValueCommit': fn(),
  } as never,
  render: (args) => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>(
        Array.isArray(args.modelValue ?? args.defaultValue)
          ? [...(args.modelValue ?? args.defaultValue as number[])]
          : [50]
      );
      return { args, value };
    },
    template: `
      <div class="w-72 space-y-3">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider
          v-model="value"
          :min="args.min"
          :max="args.max"
          :step="args.step"
          :orientation="args.orientation"
          :disabled="args.disabled"
          aria-label="Volume"
          @valueCommit="args['onValueCommit']"
        />
      </div>
    `,
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

    await step('ArrowRight incrementa em step', async () => {
      (thumbs[0] as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '51');
    });

    await step('Home vai para min', async () => {
      await userEvent.keyboard('{Home}');
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '0');
    });

    await step('End vai para max', async () => {
      await userEvent.keyboard('{End}');
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '100');
    });
  },
};
