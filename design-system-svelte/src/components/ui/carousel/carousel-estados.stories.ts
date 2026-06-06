import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta = {
  title: 'UI/Carousel/Estados',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados dos extremos sem loop: primeiro slide (Previous disabled) e último slide (Next disabled). O componente calcula o estado automaticamente via Embla.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimeiroSlide: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 5,
      startIndex: 0,
      loop: false,
      ariaLabel: 'Carrossel no primeiro slide',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão "Item anterior" inicia desabilitado', async () => {
      const prev = canvas.getByRole('button', { name: /Item anterior/i });
      await waitFor(() => expect(prev).toBeDisabled());
    });

    await step('Botão "Próximo item" está habilitado', async () => {
      const next = canvas.getByRole('button', { name: /Próximo item/i });
      await waitFor(() => expect(next).not.toBeDisabled());
    });
  },
};

export const UltimoSlide: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 5,
      startIndex: 4,
      loop: false,
      ariaLabel: 'Carrossel no último slide',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Botão "Próximo item" desabilitado no último slide', async () => {
      const next = canvas.getByRole('button', { name: /Próximo item/i });
      await waitFor(() => expect(next).toBeDisabled());
    });

    await step('Botão "Item anterior" está habilitado', async () => {
      const prev = canvas.getByRole('button', { name: /Item anterior/i });
      await waitFor(() => expect(prev).not.toBeDisabled());
    });
  },
};
