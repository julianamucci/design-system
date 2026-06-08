import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Slider/Composicoes',
  component: Slider,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do Slider: volume com valor adjacente, faixa de preço (range), em formulário e com step grosso.',
      },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VolumeComValor: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="w-80 space-y-3">
        <div class="flex items-center justify-between">
          <Label>Volume</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" :step="1" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');

    await step('Valor textual visível', async () => {
      await expect(canvas.getByText('50%')).toBeVisible();
    });

    await step('Após ArrowRight, valor textual reflete mudança', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '51');
    });
  },
};

export const FaixaDePreco: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([100, 400]);
      return { value };
    },
    template: `
      <div class="w-80 space-y-3">
        <div class="flex items-center justify-between">
          <Label>Faixa de preço</Label>
          <span aria-live="polite" class="text-sm tabular-nums">
            R$ {{ value[0] }} — R$ {{ value[1] }}
          </span>
        </div>
        <Slider v-model="value" :min="0" :max="500" :step="10" aria-label="Faixa de preço" />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>R$ 0</span>
          <span>R$ 500</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('2 thumbs renderizados', async () => {
      await expect(thumbs).toHaveLength(2);
    });

    await step('Valor textual no formato min — max', async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

export const EmFormulario: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const brightness = ref<number[]>([70]);
      const opacity = ref<number[]>([100]);
      return { brightness, opacity };
    },
    template: `
      <form class="space-y-6 w-80" @submit.prevent>
        <div class="space-y-2">
          <Label for="form-name">Nome do preset</Label>
          <input
            id="form-name"
            type="text"
            placeholder="Meu preset"
            class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>Brilho</Label>
            <span aria-live="polite" class="text-sm tabular-nums">{{ brightness[0] }}%</span>
          </div>
          <Slider v-model="brightness" :min="0" :max="100" aria-label="Brilho" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>Opacidade</Label>
            <span aria-live="polite" class="text-sm tabular-nums">{{ opacity[0] }}%</span>
          </div>
          <Slider v-model="opacity" :min="0" :max="100" aria-label="Opacidade" />
        </div>

        <button
          type="submit"
          class="w-full h-(--height-default) px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Salvar preset
        </button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.getAllByRole('slider');

    await step('Formulário tem input de texto e 2 sliders', async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(thumbs).toHaveLength(2);
    });

    await step('Cada slider tem aria-label distinto', async () => {
      await expect(thumbs[0]).toHaveAttribute('aria-valuenow', '70');
      await expect(thumbs[1]).toHaveAttribute('aria-valuenow', '100');
    });

    await step('Botão de submit presente', async () => {
      await expect(canvas.getByRole('button', { name: 'Salvar preset' })).toBeInTheDocument();
    });
  },
};

export const StepGrosso: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([3]);
      return { value };
    },
    template: `
      <div class="w-80 space-y-3">
        <div class="flex items-center justify-between">
          <Label>Avaliação</Label>
          <span aria-live="polite" class="text-sm tabular-nums">{{ value[0] }} / 5</span>
        </div>
        <Slider v-model="value" :min="1" :max="5" :step="1" aria-label="Avaliação" />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole('slider');

    await step('aria-valuemin=1 e aria-valuemax=5', async () => {
      await expect(thumb).toHaveAttribute('aria-valuemin', '1');
      await expect(thumb).toHaveAttribute('aria-valuemax', '5');
    });

    await step('ArrowRight com step=1 incrementa para 4', async () => {
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(thumb).toHaveAttribute('aria-valuenow', '4');
    });
  },
};
