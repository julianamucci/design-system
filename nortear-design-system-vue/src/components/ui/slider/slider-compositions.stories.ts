import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { handleValue } from '@shared/testing/slider-probe';
import {
  sliderFormSource,
  sliderStepGrossoSource,
  sliderPrecoSource,
  sliderVolumeSource,
} from './slider.source';

const meta = {
  title: 'UI/Slider/Compositions',
  component: Slider,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sliderVolumeSource },
      description: {
        component:
          'Padrões de composição do Slider: volume com valor adjacente, faixa de preço (range), em formulário e com step grosso.',
      },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VolumeWithValue: Story = {
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

    await step('O texto do valor acompanha a alça', async () => {
      const live = canvasElement.querySelector<HTMLElement>('[aria-live="polite"]')!;
      const thumb = canvas.getByRole('slider');
      const antes = handleValue(thumb);
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(live).toHaveTextContent(`${Math.min(100, antes + 1)}%`);
    });
  },
};

export const PriceRange: Story = {
  parameters: {
    docs: {
      // Duas alças, faixa larga com passo grosso e a escala embaixo do trilho:
      // três diferenças estruturais em relação ao snippet do meta.
      source: { transform: sliderPrecoSource },
    },
  },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([100, 400]);
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
        <Slider v-model="value" :min="0" :max="500" :step="10" aria-label="Faixa de preço" />
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>R$ 0</span>
          <span>R$ 500</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('2 thumbs renderizados', async () => {
      await expect(canvas.getAllByRole('slider')).toHaveLength(2);
    });

    await step('Valor textual no formato min — max', async () => {
      await expect(canvas.getByText(/R\$ 100 — R\$ 400/)).toBeVisible();
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // Dois controles no mesmo formulário, cada um com o próprio nome — é a
      // repetição que ensina a regra, e o meta mostra um controle só.
      source: { transform: sliderFormSource },
    },
  },
  render: () => ({
    components: { Slider, Label, Input, Button },
    setup() {
      const brightness = ref<number[]>([70]);
      const opacity = ref<number[]>([100]);
      const salvo = ref<string>('');
      const salvar = () => {
        salvo.value = `Brilho ${brightness.value[0]}% · Opacidade ${opacity.value[0]}%`;
      };
      return { brightness, opacity, salvo, salvar };
    },
    template: `
      <form class="nds-stack nds-w-sm" data-spacing="md" aria-label="Configurações de áudio" @submit.prevent="salvar">
        <div class="nds-stack" data-spacing="sm">
          <Label for="form-name">Nome do preset</Label>
          <Input id="form-name" placeholder="Meu preset" />
        </div>

        <div class="nds-stack" data-spacing="sm">
          <div class="nds-cluster" data-justify="between">
            <Label>Brilho</Label>
            <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ brightness[0] }}%</span>
          </div>
          <Slider v-model="brightness" :min="0" :max="100" aria-label="Brilho" />
        </div>

        <div class="nds-stack" data-spacing="sm">
          <div class="nds-cluster" data-justify="between">
            <Label>Opacidade</Label>
            <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ opacity[0] }}%</span>
          </div>
          <Slider v-model="opacity" :min="0" :max="100" aria-label="Opacidade" />
        </div>

        <Button type="submit" size="sm">Salvar preset</Button>
        <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">{{ salvo }}</p>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Formulário tem campo de texto e dois sliders', async () => {
      await expect(canvas.getByLabelText(/Nome do preset/)).toBeInTheDocument();
      await expect(canvas.getAllByRole('slider')).toHaveLength(2);
    });

    await step('Cada slider tem nome acessível próprio', async () => {
      const thumbs = canvas.getAllByRole('slider');
      await expect(thumbs[0]).toHaveAttribute('aria-label', 'Brilho');
      await expect(thumbs[1]).toHaveAttribute('aria-label', 'Opacidade');
    });

    await step('Submeter guarda o valor corrente dos dois', async () => {
      const thumbs = canvas.getAllByRole('slider');
      const brilho = handleValue(thumbs[0]);
      const opacity = handleValue(thumbs[1]);
      await userEvent.click(canvas.getByRole('button', { name: 'Salvar preset' }));
      await expect(
        canvas.getByText(`Brilho ${brilho}% · Opacidade ${opacity}%`),
      ).toBeVisible();
    });
  },
};

export const ThickStep: Story = {
  parameters: {
    docs: {
      // Faixa curta com escala visível: os limites saem do padrão e a escala
      // não existe na composição do meta.
      source: { transform: sliderStepGrossoSource },
    },
  },
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>([3]);
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Avaliação</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }} / 5</span>
        </div>
        <Slider v-model="value" :min="1" :max="5" :step="1" aria-label="Avaliação" />
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa curta chega à árvore de acessibilidade', async () => {
      const thumb = canvas.getByRole('slider');
      await expect(thumb).toHaveAttribute('aria-valuemin', '1');
      await expect(thumb).toHaveAttribute('aria-valuemax', '5');
    });

    await step('ArrowRight anda um passo dentro da faixa curta', async () => {
      const thumb = canvas.getByRole('slider');
      const antes = handleValue(thumb);
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(5, antes + 1));
    });
  },
};
