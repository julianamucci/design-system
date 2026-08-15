import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import SliderStory from './SliderStory.svelte';
import {
  alcaDesabilitada,
  alcasDoSlider,
  anelDeFocoAssentado,
  anelEmRepouso,
  contrasteAlcaTrilho,
  valorDaAlca,
} from '@shared/testing/slider-probe';

const meta: Meta = {
  title: 'UI/Slider/States',
  component: SliderStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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
      const alca = canvas.getByRole('slider');
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{ArrowLeft}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(0);
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
      const alca = canvas.getByRole('slider');
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{End}');
      await userEvent.keyboard('{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
