import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';
import {
  handleDesabilitada,
  alcasDoSlider,
  focusAssentadoRing,
  restRing,
  contextoHandleTrack,
  contrastHandleTrack,
  handleValue,
} from '@shared/testing/slider-probe';
import { sliderSource } from './slider.source';

const meta: Meta = {
  title: 'Components/Form/Slider/States',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Todos os estados deste arquivo são args do MESMO controle — a cascata
      // já entrega o snippet certo em cada um, sem override.
      source: { transform: sliderSource },
      description: {
        component:
          'Estados do Slider: default, focus (foco visível), disabled, no min e no max.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
  parameters: { covers: ['accessibility.item2'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Story sem interação: é aqui que o valor de montagem pode ser afirmado.
    await step('Alça no valor inicial', async () => {
      await expect(handleValue(canvas.getByRole('slider'))).toBe(50);
    });

    await step('A borda da alça alcança 3:1 contra o trilho', async () => {
      // WCAG 1.4.11. O miolo da alça é da cor do fundo de propósito, então quem
      // a separa do trilho é a borda.
      await expect(
        contrastHandleTrack(canvasElement),
        contextoHandleTrack(canvasElement),
      ).toBeGreaterThanOrEqual(3);
    });
  },
};

export const FocusVisible: Story = {
  args: {
    value: [50],
    min: 0,
    max: 100,
    'aria-label': 'Volume',
    label: 'Volume',
  },
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco via teclado: Tab leva ao thumb e setas/Home/End/PgUp/PgDn alteram o valor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumb = () => alcasDoSlider(canvasElement)[0];
    const rest = await restRing(thumb());

    await step('A alça recebe foco por teclado', async () => {
      await userEvent.tab();
      await expect(canvas.getByRole('slider')).toHaveFocus();
    });

    await step('A alça focada fica visivelmente diferente da alça em repouso', async () => {
      // Alça focada idêntica à alça parada é 2.4.7 reprovado com o teste verde.
      const focada = await focusAssentadoRing(thumb(), rest);
      await expect(focada.sombra !== rest.sombra || focada.border !== rest.border).toBe(true);
      await expect(focada.sombra).not.toBe('none');
    });

    await step('PageUp anda mais que uma seta', async () => {
      const antes = handleValue(canvas.getByRole('slider'));
      await userEvent.keyboard('{PageUp}');
      await expect(handleValue(canvas.getByRole('slider'))).toBeGreaterThan(antes + 1);
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
  parameters: { covers: ['visual.item4'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A alça está marcada como desabilitada', async () => {
      await expect(handleDesabilitada(alcasDoSlider(canvasElement)[0])).toBe(true);
    });

    await step('ArrowRight não altera o valor', async () => {
      const thumb = canvas.getByRole('slider');
      const antes = handleValue(thumb);
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(antes);
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
    await step('ArrowLeft não passa do mínimo', async () => {
      const thumb = canvas.getByRole('slider');
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{ArrowLeft}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(0);
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
    await step('ArrowRight não passa do máximo', async () => {
      const thumb = canvas.getByRole('slider');
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{End}');
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
