import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta: Meta = {
  title: 'UI/Carousel/Variants',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Orientações disponíveis: horizontal (padrão) e vertical. A orientação controla o eixo de deslizamento e a posição dos botões de navegação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: { covers: ['accessibility.item5', 'visual.item2'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      orientation: 'horizontal',
      slideCount: 5,
      widthClass: 'nds-w-full nds-max-w-md',
      ariaLabel: 'Galeria horizontal',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Galeria horizontal' });
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;

    await step('O trilho deita os slides em linha', async () => {
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(track).toHaveAttribute('data-orientation', 'horizontal');
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais, fora da área dos slides', async () => {
      // É o que `.nds-carousel-arrow-prev[data-orientation="horizontal"]` faz;
      // se o atributo não chegasse ao botão, as setas empilhariam sobre o
      // primeiro slide sem nenhum erro visível no console.
      const area = region.getBoundingClientRect();
      const anterior = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(anterior.left).toBeLessThan(area.left);
      await expect(proximo.right).toBeGreaterThan(area.right);
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['functional.item5', 'visual.item2'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'vertical',
      orientation: 'vertical',
      slideCount: 5,
      widthClass: 'nds-w-full nds-max-w-xs',
      // `nds-aspect-4-3` dá ao trilho — e por tabela ao viewport que o recorta
      // — a altura DEFINIDA que a base `flex: 0 0 100%` do slide precisa para
      // resolver. Sem ela o carrossel vertical empilha os slides e nada é
      // recortado. A altura vem de uma classe de proporção, nunca de `style`.
      heightClass: 'nds-aspect-4-3',
      ariaLabel: 'Galeria vertical',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Galeria vertical' });
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O trilho empilha os slides em coluna', async () => {
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(track).toHaveAttribute('data-orientation', 'vertical');
      await expect(getComputedStyle(track).flexDirection).toBe('column');
    });

    await step('Cada slide ocupa o viewport inteiro em altura', async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e cada slide encolhe até o conteúdo.
      //
      // A proporção passa um pouco de 1 porque a margem negativa do trilho puxa
      // o respiro do primeiro slide para fora do viewport — o mesmo desconto de
      // 16px que a horizontal tem na largura.
      await waitFor(async () => {
        const altura = viewport.clientHeight;
        await expect(altura).toBeGreaterThan(0);
        for (const slide of canvas.getAllByRole('group')) {
          const proporcao = slide.getBoundingClientRect().height / altura;
          await expect(proporcao).toBeGreaterThan(0.98);
          await expect(proporcao).toBeLessThan(1.2);
        }
      });
    });

    await step('As setas ficam acima e abaixo do viewport', async () => {
      const area = region.getBoundingClientRect();
      const anterior = canvas
        .getByRole('button', { name: 'Item anterior' })
        .getBoundingClientRect();
      const proximo = canvas
        .getByRole('button', { name: 'Próximo item' })
        .getBoundingClientRect();
      await expect(anterior.top).toBeLessThan(area.top);
      await expect(proximo.bottom).toBeGreaterThan(area.bottom);
    });
  },
};
