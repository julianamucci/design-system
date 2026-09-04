import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';
import { alcasDoSlider, sliderTrack, handleValue } from '@shared/testing/slider-probe';
import { sliderRangeSource, sliderUnicoSource, sliderVerticalSource } from './slider.source';

const meta = {
  title: 'Components/Form/Slider/Variants',
  component: Slider,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sliderUnicoSource },
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
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider v-model="value" :min="0" :max="100" :step="1" aria-label="Volume" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Single tem exatamente 1 thumb', async () => {
      await expect(canvas.getAllByRole('slider')).toHaveLength(1);
    });

    await step('ArrowRight anda um passo', async () => {
      const thumb = canvas.getByRole('slider');
      const antes = handleValue(thumb);
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });
  },
};

export const Range: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // A segunda alça vem do TAMANHO do array, e o snippet do meta traz um
      // array de um valor só — não haveria como o leitor deduzir.
      source: { transform: sliderRangeSource },
    },
  },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([20, 80]);
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Faixa de preço</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">
            R$ {{ value[0] }} — R$ {{ value[1] }}
          </span>
        </div>
        <Slider v-model="value" :min="0" :max="100" :step="1" aria-label="Faixa de preço" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Range tem exatamente 2 thumbs, em 20 e 80', async () => {
      const thumbs = canvas.getAllByRole('slider');
      await expect(thumbs).toHaveLength(2);
      await expect(handleValue(thumbs[0])).toBe(20);
      await expect(handleValue(thumbs[1])).toBe(80);
    });

    await step('O preenchimento é o miolo entre as duas alças', async () => {
      // Afirma o desenho, não o dado: 80 − 20 do trilho, com folga de subpixel.
      const track = sliderTrack(canvasElement);
      const range = canvasElement.querySelector<HTMLElement>('[data-slot="slider-range"]')!;
      const pct =
        (range.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100;
      await expect(Math.abs(pct - 60)).toBeLessThan(1.5);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Além da prop, entra o contêiner que centraliza: em pé o controle não
      // ocupa a largura da coluna e encostaria na margem.
      source: { transform: sliderVerticalSource },
    },
  },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([60]);
      return { value };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-cluster" data-align="center" data-justify="between">
          <Label>Brilho</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <div class="nds-cluster" data-justify="center">
          <Slider v-model="value" orientation="vertical" :min="0" :max="100" :step="1" aria-label="Brilho" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação vertical é anunciada', async () => {
      await expect(canvas.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('O trilho fica em pé', async () => {
      // A orientação não pode ser só um atributo: a geometria vira junto, senão
      // o controle continua deitado dizendo que está de pé.
      const box = sliderTrack(canvasElement).getBoundingClientRect();
      await expect(box.height).toBeGreaterThan(box.width);
    });

    await step('ArrowUp incrementa no eixo vertical', async () => {
      const thumb = alcasDoSlider(canvasElement)[0];
      const antes = handleValue(thumb);
      (canvas.getByRole('slider') as HTMLElement).focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(handleValue(alcasDoSlider(canvasElement)[0])).toBe(Math.min(100, antes + 1));
    });
  },
};
