import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta: Meta = {
  title: 'UI/Carousel/Settings',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Configurações comuns: um item por vez, vários itens por vez com base responsiva e avanço automático com parada na interação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Single: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 5,
      widthClass: 'nds-w-full nds-max-w-md',
      ariaLabel: 'Carrossel com item único',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // `canScrollNext` nasce falso: esperar por ele é o portão de montagem do
    // Embla, e não uma folga arbitrária.
    await waitFor(() => expect(proximo()).toBeEnabled());

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      // Um pouco maior que 1: a margem negativa do trilho puxa o respiro do
      // primeiro slide para fora, e é ele que separa um slide do outro.
      await expect(proporcao).toBeGreaterThan(0.98);
      await expect(proporcao).toBeLessThan(1.2);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      await expect(proximo()).toBeEnabled();
    });
  },
};

export const MultiResponsive: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'multi',
      slideCount: 6,
      widthClass: 'nds-w-full nds-max-w-lg',
      ariaLabel: 'Carrossel com múltiplos itens responsivos',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled(),
    );

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla aqui.
      const janela = canvasElement.ownerDocument.defaultView!;
      const grande = janela.matchMedia('(min-width: 1024px)').matches;
      const medio = janela.matchMedia('(min-width: 768px)').matches;
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;

      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      await expect(proporcao).toBeCloseTo(esperado, 1);
    });

    await step('Todos os slides continuam anunciáveis como grupo', async () => {
      const slides = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
      );
      await expect(slides.length).toBe(6);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAttribute('role', 'group');
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${slides.length}`);
      }
    });
  },
};

export const Autoplay: Story = {
  parameters: { covers: ['functional.item7', 'visual.item3'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'autoplay',
      slideCount: 5,
      widthClass: 'nds-w-full nds-max-w-md',
      ariaLabel: 'Carrossel com autoplay',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;

    // O Embla translada o trilho por `transform` e nunca mexe em `scrollLeft`:
    // a posição só se lê pela geometria.
    const posicao = () =>
      track.getBoundingClientRect().left - viewport.getBoundingClientRect().left;

    /** Índice do slide que ocupa a maior parte do viewport. */
    const slideEmFoco = () => {
      const v = viewport.getBoundingClientRect();
      let melhor = 0;
      let maior = -Infinity;
      canvas.getAllByRole('group').forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const visivel = Math.min(r.right, v.right) - Math.max(r.left, v.left);
        if (visivel > maior) { maior = visivel; melhor = i; }
      });
      return melhor;
    };

    await step('O carrossel avança sozinho', async () => {
      // O intervalo do plugin está em 400ms nesta montagem — ver o comentário
      // em CarouselStory.svelte. A folga do `waitFor` é generosa porque o
      // relógio é do navegador, não do teste.
      const antes = posicao();
      await waitFor(() => expect(Math.abs(posicao() - antes)).toBeGreaterThan(1), {
        timeout: 4000,
      });
    });

    await step('Interagir com o carrossel para o avanço automático', async () => {
      // `stopOnInteraction`: quem tomou o controle não deve ser atropelado pelo
      // relógio. O gatilho é o `pointerDown` do próprio Embla, que só nasce
      // dentro do nó raiz — as setas ficam FORA dele nesta stack, então quem
      // para o relógio é o toque sobre a área dos slides, não o clique na seta.
      await userEvent.click(viewport);
    });

    await step('E a story termina com o relógio parado', async () => {
      // Autoplay é temporizador, e uma story que termina com ele LIGADO segue
      // andando durante a foto do Chromatic e durante a varredura do axe: cada
      // execução fotografa um slide diferente e a diferença lê como regressão.
      //
      // O SLIDE em foco, e não a caixa do trilho. Esta montagem liga a
      // repetição, e com ela o Embla reposiciona slides individualmente para
      // montar a ilusão do laço: a caixa do trilho se mexe uma dezena de pixels
      // sem ninguém ter avançado nada, e a comparação por pixel reprovava com o
      // carrossel parado no mesmo slide o tempo todo.
      const slideParado = slideEmFoco();

      // Três intervalos inteiros de autoplay sem trocar de slide: é a prova
      // observável de que o relógio parou, e não de que ele só estava entre
      // dois passos.
      await new Promise((resolve) => setTimeout(resolve, 1400));
      await expect(slideEmFoco()).toBe(slideParado);
    });
  },
};
