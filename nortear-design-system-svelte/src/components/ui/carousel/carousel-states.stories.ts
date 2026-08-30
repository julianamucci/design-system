import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import { carouselSource, carouselLastSlideSource } from './carousel.source';

// Os dois extremos de um carrossel sem repetição. Sem `loop` a navegação tem
// começo e fim, e é a seta desabilitada que conta isso a quem chegou lá: um
// botão que continua vivo e não faz nada é pior do que um botão apagado.
//
// As duas stories são NÃO interativas de propósito — o que elas mostram é o
// estado, e é ele que o Chromatic fotografa e o axe varre.

const meta: Meta = {
  title: 'Primitives/Display/Carousel/States',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; a do último slide
      // sobrescreve com a sua logo abaixo.
      source: { transform: carouselSource },
      description: {
        component:
          'Estados dos extremos sem loop: primeiro slide (seta de voltar desabilitada) e último slide (seta de avançar desabilitada). O componente calcula o estado sozinho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TOTAL = 5;

export const FirstSlide: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: TOTAL,
      startIndex: 0,
      loop: false,
      ariaLabel: 'Slides no primeiro item',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    const previous = () =>
      canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const next = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // `canScrollNext` nasce falso e só vira verdadeiro quando o Embla
    // inicializa: sem este portão os passos abaixo mediriam a montagem.
    await waitFor(() => expect(next()).toBeEnabled(), { timeout: 4000 });

    await step('No começo só a seta de avanço leva a algum lugar', async () => {
      await expect(previous()).toBeDisabled();
      // `aria-disabled` acompanha o `disabled` nativo: o leitor de tela anuncia
      // o primeiro, o segundo é o que tira o botão da ordem de foco.
      await expect(previous()).toHaveAttribute('aria-disabled', 'true');
      await expect(next()).not.toHaveAttribute('aria-disabled', 'true');
    });

    await step('O extremo é visível, não só programático', async () => {
      // Duas instâncias do MESMO botão, lado a lado: comparar a seta apagada
      // com a viva prova o contraste do estado. Medir só a opacidade da
      // desabilitada passaria numa tela onde todas estivessem apagadas.
      //
      // A espera É obrigatória aqui, ao contrário do que a versão anterior
      // supunha. Nesta stack `canScrollNext` também nasce falso: os DOIS botões
      // montam desabilitados e o de avanço só acorda quando o Embla inicializa.
      // Quem está a meio do fade é justamente a seta "viva", e a leitura direta
      // pegava 0.5 contra 0.5 — o mesmo par idêntico que o axe acusa como
      // contraste ~1.0 em elemento a meio da transição.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(previous()).opacity);
        const viva = Number(getComputedStyle(next()).opacity);
        await expect(apagada).toBeLessThan(viva);
      }, { timeout: 4000 });
    });

    await step('O trilho está no início', async () => {
      // O Embla translada o trilho por `transform` e nunca mexe em
      // `scrollLeft`: a prova de posição é geométrica. No primeiro snap o slide
      // de abertura cobre o viewport inteiro e o seguinte espera fora dele.
      const slides = canvas.getAllByRole('group');
      const v = viewport.getBoundingClientRect();
      await expect(slides[0].getBoundingClientRect().right).toBeGreaterThan(v.right - 2);
      await expect(slides[1].getBoundingClientRect().left).toBeGreaterThan(v.right - 2);
    });
  },
};

export const LastSlide: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: { source: { transform: carouselLastSlideSource } },
  },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: TOTAL,
      startIndex: TOTAL - 1,
      loop: false,
      ariaLabel: 'Slides no último item',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    const previous = () =>
      canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const next = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // A story monta JÁ no último slide (`startIndex`), sem navegar: o portão de
    // montagem aqui é a seta de voltar acordando.
    await waitFor(() => expect(previous()).toBeEnabled(), { timeout: 4000 });

    await step('No fim a seta de avanço desabilita e a de voltar acorda', async () => {
      // O par importa: só "avançar desabilitado" também seria verdade num
      // carrossel de um slide só, onde nada nunca avançou.
      await expect(next()).toBeDisabled();
      await expect(next()).toHaveAttribute('aria-disabled', 'true');
      await expect(previous()).not.toHaveAttribute('aria-disabled', 'true');
    });

    await step('O extremo é visível, e agora a apagada é a outra', async () => {
      // `waitFor` não é folga: `.nds-button` transiciona, e o estado
      // desabilitado deste botão é resolvido no primeiro `select` do Embla, já
      // depois da montagem. Ler no primeiro quadro pega o valor de PARTIDA —
      // 1 contra 1 — e a story reprovaria por corrida, não por defeito.
      await waitFor(async () => {
        const apagada = Number(getComputedStyle(next()).opacity);
        const viva = Number(getComputedStyle(previous()).opacity);
        await expect(apagada).toBeLessThan(viva);
      }, { timeout: 4000 });
    });

    await step('O trilho chegou ao fim', async () => {
      // Prova de que o fim é real e não só um sinalizador do componente: o
      // primeiro slide saiu inteiro pela esquerda e o último cobre o viewport.
      const slides = canvas.getAllByRole('group');
      await waitFor(async () => {
        const v = viewport.getBoundingClientRect();
        await expect(slides[0].getBoundingClientRect().right).toBeLessThan(v.left + 2);
        await expect(slides[TOTAL - 1].getBoundingClientRect().right).toBeGreaterThan(v.right - 2);
      }, { timeout: 4000 });
    });
  },
};
