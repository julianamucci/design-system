import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import {
  medirSlides,
  reprovasDeEscala,
  reprovasDoFeedbackDePonteiro,
  pontoDeParadaIntacto,
  alcanceDoControle,
  escalaSobMovimentoReduzido,
  descreverFalhas,
} from '@shared/testing/carousel-probe';
import { carouselSource, carouselVerticalSource } from './carousel.source';

const meta: Meta = {
  title: 'UI/Carousel/Variants',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; a vertical sobrescreve com
      // a sua logo abaixo.
      source: { transform: carouselSource },
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
  parameters: { covers: ['accessibility.item5', 'accessibility.item7', 'functional.item10', 'visual.item2', 'visual.item6'] },
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

    await step('O slide atual fica em tamanho cheio e os vizinhos recuam', async () => {
      // A escala é `transform`, e `transform` não deixa rastro em atributo, em
      // texto nem em papel ARIA: a única prova é a caixa RENDERIZADA contra a
      // caixa de LAYOUT. O `waitFor` não é folga — a transição parte do tamanho
      // cheio e leva `--duration-base` para chegar, então o primeiro quadro
      // mede o ponto de partida e reprovaria por corrida.
      await waitFor(async () => {
        await expect(descreverFalhas(reprovasDeEscala(medirSlides(canvasElement), 0))).toBe('');
      });
    });

    await step('A escala não moveu o ponto de parada da rolagem', async () => {
      // `transform` é pintura, não layout — mas isso é promessa. Passos de
      // layout desiguais entre slides significariam que a escala vazou para o
      // layout, e o carrossel passaria a parar fora do slide.
      await expect(descreverFalhas(pontoDeParadaIntacto(canvasElement))).toBe('');
    });

    await step('Com movimento reduzido a escala some por inteiro', async () => {
      // Não basta a transição parar: um salto de tamanho é justamente o que a
      // preferência pede para não acontecer. A sonda liga a preferência pelo
      // mesmo canal do toolbar do Storybook e a desliga no `finally`, senão a
      // story seguinte e a foto dela sairiam envenenadas.
      const falhas = await escalaSobMovimentoReduzido(canvasElement, waitFor);
      await expect(descreverFalhas(falhas)).toBe('');
    });

    await step('A seta responde ao ponteiro sem sair do lugar', async () => {
      const proximo = canvas.getByRole('button', { name: 'Próximo item' });

      // A escrita direta do `transform` faz as vezes do ponteiro. Não é atalho:
      // `userEvent.hover` despacha eventos, e o `:hover` do CSS responde ao
      // cursor de verdade — medido, dá razão 1.000 e não verifica nada. O que
      // importa aqui é a COLISÃO de duas regras na propriedade `transform`, e
      // escrevê-la à mão reproduz a colisão inteira.
      const falhas = [
        ...(await reprovasDoFeedbackDePonteiro(proximo, waitFor)),
        ...alcanceDoControle(proximo),
      ];
      await expect(descreverFalhas(falhas)).toBe('');
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item10', 'visual.item2'],
    docs: { source: { transform: carouselVerticalSource } },
  },
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
      //
      // A medida é de LAYOUT (`offsetHeight`), e não a caixa renderizada: a
      // pergunta aqui é se a altura definida chegou ao slide, e isso é layout.
      // A caixa renderizada dos VIZINHOS passou a carregar também a escala do
      // slide atual — medi-la aqui misturaria duas perguntas e faria este passo
      // reprovar por um efeito que ele não está verificando. Quem verifica a
      // escala é o passo próprio dela, na story horizontal.
      await waitFor(async () => {
        const altura = viewport.clientHeight;
        await expect(altura).toBeGreaterThan(0);
        for (const slide of canvas.getAllByRole('group')) {
          const proporcao = (slide as HTMLElement).offsetHeight / altura;
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

    await step('A seta girada também não sai do lugar sob o ponteiro', async () => {
      // O eixo vertical é o caso difícil: aqui a centralização vem acompanhada
      // de uma ROTAÇÃO. Escrita em `transform`, ela desaparecia junto com a
      // centralização quando o `scale` do hover chegava — o chevron voltava a
      // apontar para o lado errado no mesmo quadro em que o botão despencava.
      // Escrita em `translate` + `rotate`, as duas convivem com o `scale`.
      const proximo = canvas.getByRole('button', { name: 'Próximo item' });
      const falhas = await reprovasDoFeedbackDePonteiro(proximo, waitFor);
      await expect(descreverFalhas(falhas)).toBe('');
    });
  },
};
