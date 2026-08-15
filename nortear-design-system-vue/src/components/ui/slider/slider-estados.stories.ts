import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';
import {
  alcaDesabilitada,
  alcasDoSlider,
  anelDeFocoAssentado,
  anelEmRepouso,
  contrasteAlcaTrilho,
  valorDaAlca,
} from '@shared/testing/slider-probe';

const meta = {
  title: 'UI/Slider/States',
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
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Story sem interação: é aqui que o valor de montagem pode ser afirmado.
    await step('Alça no valor inicial', async () => {
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(50);
    });

    await step('A borda da alça alcança 3:1 contra o trilho', async () => {
      // WCAG 1.4.11. O miolo da alça é da cor do fundo de propósito, então quem
      // a separa do trilho é a borda.
      await expect(contrasteAlcaTrilho(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco via teclado: Tab leva ao thumb e setas/Home/End/PgUp/PgDn alteram o valor.',
      },
    },
  },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <Label>Volume</Label>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alca = () => alcasDoSlider(canvasElement)[0];
    const repouso = await anelEmRepouso(alca());

    await step('A alça recebe foco por teclado', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('slider')).toHaveFocus();
    });

    await step('A alça focada fica visivelmente diferente da alça em repouso', async () => {
      // Alça focada idêntica à alça parada é 2.4.7 reprovado com o teste verde.
      const focada = await anelDeFocoAssentado(alca(), repouso);
      await expect(focada.sombra !== repouso.sombra || focada.borda !== repouso.borda).toBe(true);
      await expect(focada.sombra).not.toBe('none');
    });

    await step('PageUp anda mais que uma seta', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await userEvent.keyboard('{PageUp}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBeGreaterThan(antes + 1);
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([50]);
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <Label>Volume</Label>
        <Slider v-model="value" :disabled="true" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A alça está marcada como desabilitada', async () => {
      await expect(alcaDesabilitada(alcasDoSlider(canvasElement)[0])).toBe(true);
    });

    await step('ArrowRight não altera o valor', async () => {
      const alca = canvas.getByRole('slider');
      const antes = valorDaAlca(alca);
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(antes);
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
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ArrowLeft não passa do mínimo', async () => {
      const alca = canvas.getByRole('slider');
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{ArrowLeft}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(0);
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
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('ArrowRight não passa do máximo', async () => {
      const alca = canvas.getByRole('slider');
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{End}');
      await userEvent.keyboard('{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
