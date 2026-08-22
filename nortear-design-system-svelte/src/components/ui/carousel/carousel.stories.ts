import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import CarouselDocs from '@/components/docs/CarouselDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { carouselSource } from './carousel.source';

const meta: Meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CarouselDocs),
      source: { transform: carouselSource },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção dos slides.',
    },
  },
  args: {
    orientation: 'horizontal',
  },
};

export default meta;
type Story = StoryObj;

const TOTAL = 5;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'visual.item1',
    ],
  },
  render: (args) => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      orientation: args.orientation,
      slideCount: TOTAL,
      ariaLabel: 'Galeria de exemplos',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const vertical = args.orientation === 'vertical';

    const region = canvas.getByRole('region', { name: 'Galeria de exemplos' });
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    // Embla NÃO rola o viewport: ele translada o track por `transform`, e
    // `scrollLeft` fica em zero o tempo todo. Medir a posição pela geometria do
    // track contra a do viewport é o que sobra — e é o que enxerga o movimento
    // nos dois eixos sem depender do eixo escolhido no control.
    const anterior = () =>
      canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // Portão de montagem: `canScrollNext` nasce falso e só vira verdadeiro
    // quando o Embla inicializa e o primeiro `select` roda. Medir antes disso
    // leria um carrossel que ainda não existe.
    await waitFor(() => expect(proximo()).toBeEnabled(), { timeout: 4000 });

    /**
     * Índice do slide que ocupa a maior parte do viewport.
     *
     * Contar PIXEL errou de duas formas antes de virar isto. "Andou em relação
     * à medida de agora" resolve no PRIMEIRO quadro em que o trilho passa do
     * limiar, com a transição ainda correndo, e a medida seguinte parte de um
     * número em movimento (-339 contra -17). E um alvo absoluto em passos de
     * slide também não fecha: o slide é mais largo que o viewport, então o
     * Embla não desloca um "passo" inteiro por snap.
     *
     * Qual slide está à vista não depende do alinhamento do Embla, nem do
     * respiro entre slides, nem da cauda da animação — e é o que a story diz.
     */
    const focusSlide = () => {
      const v = viewport.getBoundingClientRect();
      let melhor = 0;
      let maior = -Infinity;
      canvas.getAllByRole('group').forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const visible = vertical
          ? Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top)
          : Math.min(r.right, v.right) - Math.max(r.left, v.left);
        if (visible > maior) { maior = visible; melhor = i; }
      });
      return melhor;
    };

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(focusSlide()).toBe(i); }, { timeout: 4000 });

    await step('A região tem papel, roledescription e nome acessível', async () => {
      // Sem nome a região não vira marco de navegação: o leitor anuncia
      // "carrossel" sem dizer de quê.
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(region).toHaveAccessibleName('Galeria de exemplos');
    });

    await step('Cada slide é um grupo anunciável com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      // O total sai do conjunto renderizado, nunca escrito à mão: continua
      // batendo depois de alguém mexer no `slideCount`.
      const total = slides.length;
      await expect(total).toBe(TOTAL);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });

    await step('No primeiro slide só a seta de avanço leva a algum lugar', async () => {
      await expect(anterior()).toBeDisabled();
      // `aria-disabled` acompanha o `disabled` nativo: o leitor de tela anuncia
      // o primeiro, o segundo é o que tira o botão da ordem de foco.
      await expect(anterior()).toHaveAttribute('aria-disabled', 'true');
      await expect(proximo()).toBeEnabled();
      await expect(proximo()).not.toHaveAttribute('aria-disabled', 'true');
    });

    await step('Clicar em avançar leva ao segundo slide e acorda a seta de voltar', async () => {
      await userEvent.click(proximo());
      await emSlide(1);
      await expect(anterior()).toBeEnabled();
    });

    await step('A seta do teclado avança com o foco dentro do carrossel', async () => {
      // É o caminho que um carrossel só-arrasto não tem: a WCAG 2.1.1 exige
      // equivalente de teclado para toda navegação. O `keydown` mora nos botões
      // de navegação, então é de lá que a tecla parte.
      proximo().focus();
      await expect(proximo()).toHaveFocus();
      await userEvent.keyboard(vertical ? '{ArrowDown}' : '{ArrowRight}');
      await emSlide(2);
    });

    await step('E a story termina onde diz que termina: no primeiro slide', async () => {
      // `visual.item1` promete "estado inicial com 3+ slides", e é o quadro
      // FINAL que o Chromatic fotografa e que o axe varre — dois passos de
      // navegação acontecem acima. O mesmo passo conserta o replay: o painel
      // Interactions reexecuta a play no MESMO DOM, e na segunda rodada o
      // "no primeiro slide" encontraria a seta de voltar já habilitada.
      //
      // Volta ENQUANTO der, nunca um número fixo de cliques.
      for (let passo = 0; passo < TOTAL; passo++) {
        const button = anterior();
        if (button.disabled) break;
        await userEvent.click(button);
      }

      await emSlide(0);
      await expect(anterior()).toBeDisabled();
    });
  },
};
