import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta: Meta = {
  title: 'UI/Carousel/Compositions',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composições do Carousel: dots que levam direto a um slide, montados sobre a instância exposta pelo componente, e galeria de imagens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TOTAL_DOTS = 5;

export const WithDots: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'withDots',
      slideCount: TOTAL_DOTS,
      widthClass: 'nds-w-full nds-max-w-md',
      ariaLabel: 'Carrossel com dots',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
      goToSlideLabel: 'Ir para o slide',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;

    /**
     * Índice do slide que ocupa a maior parte do viewport.
     *
     * O Embla translada o trilho por `transform` e nunca mexe em `scrollLeft`,
     * então a posição só se lê pela geometria. Mas o PIXEL não serve de âncora:
     * a medida de referência tirada logo após a montagem ainda pega o Embla
     * assentando, e a comparação final errava por 25px sem nada de errado ter
     * acontecido. Qual slide está à vista não tem esse ruído — e é o que a
     * story afirma.
     */
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

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(slideEmFoco()).toBe(i); });

    // Posição E total no nome: "2" sozinho não diz para onde leva.
    const dot = (n: number) =>
      canvas.getByRole('button', { name: `Ir para o slide ${n} de ${TOTAL_DOTS}` });

    // Par idempotente: o dot só é clicado quando ainda NÃO é o atual. O painel
    // Interactions reexecuta a play no MESMO DOM, e um clique cego partiria do
    // estado que a rodada anterior deixou.
    const irPara = async (n: number) => {
      const alvo = dot(n);
      if (alvo.getAttribute('aria-current') !== 'true') await userEvent.click(alvo);
    };

    // Os dots só existem depois que o Embla publica a lista de snaps.
    await canvas.findAllByRole('button', { name: /^Ir para o slide/ });

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      const slides = canvas.getAllByRole('group');
      const dots = canvas.getAllByRole('button', { name: /^Ir para o slide/ });
      // Contado a partir do que foi renderizado: um número escrito à mão
      // continuaria batendo depois de alguém mexer no `slideCount`.
      await expect(dots.length).toBe(slides.length);
      // O dot não é aba e não controla painel nenhum: o atual se marca com
      // `aria-current`, e o inativo não carrega o atributo.
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O dot atual se distingue dos outros por mais do que a posição', async () => {
      // Comparação entre dois dots, e não medida absoluta de um só: "tem fundo"
      // é verdade para os cinco. O que prova o destaque é o atual ter um fundo
      // DIFERENTE do inativo.
      //
      // A leitura é do `::before`: o botão em si é só o alvo de 24px, e a marca
      // colorida de 8px é o pseudo-elemento. Medir o botão devolveria
      // `transparent` nos dois e a comparação passaria a nunca falhar.
      const cor = (el: Element) => getComputedStyle(el, '::before').backgroundColor;
      await expect(cor(dot(1))).not.toBe(cor(dot(2)));
    });

    await step('Clicar num dot salta direto para aquele slide', async () => {
      await irPara(3);
      // Salto, não passo: o dot leva a um índice ABSOLUTO.
      await emSlide(2);
      await waitFor(async () => {
        await expect(dot(3)).toHaveAttribute('aria-current', 'true');
        await expect(dot(1).hasAttribute('aria-current')).toBe(false);
      });
    });

    await step('E a story termina no começo, replayável', async () => {
      // O painel Interactions reexecuta a play no MESMO DOM: sem voltar, a
      // segunda rodada encontraria o terceiro dot como atual e o primeiro passo
      // reprovaria. É também o quadro que o Chromatic fotografa.
      await irPara(1);
      await emSlide(0);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
    });
  },
};

const FOTOS = [
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=60', alt: 'Trilha de montanha ao amanhecer' },
  { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60', alt: 'Lago cercado por montanhas nevadas' },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=60', alt: 'Campo aberto com o sol se pondo atrás das nuvens' },
  { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=60', alt: 'Floresta de pinheiros vista de cima' },
];

export const Gallery: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'gallery',
      widthClass: 'nds-w-full nds-max-w-md',
      ariaLabel: 'Galeria de fotos do produto',
      previousLabel: 'Foto anterior',
      nextLabel: 'Próxima foto',
      images: FOTOS,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A galeria é uma região nomeada', async () => {
      // O nome vem do `ariaLabel` da story. A consulta usa a string EXATA: uma
      // expressão que não casa com o rótulo real derruba a story inteira, e foi
      // o que aconteceu aqui quando a busca procurava "Gallery" e o componente
      // dizia "Galeria".
      const region = canvas.getByRole('region', { name: 'Galeria de fotos do produto' });
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Toda foto carrega um alt descritivo e próprio', async () => {
      // Numa galeria a imagem É o conteúdo: sem alt o slide não existe para
      // quem não vê. Repetir o mesmo texto em todas seria o mesmo que nenhum,
      // então os alts também precisam ser distintos entre si.
      const imagens = Array.from(canvasElement.querySelectorAll('img'));
      await expect(imagens.length).toBe(FOTOS.length);
      for (const img of imagens) {
        await expect(img.alt.trim().length).toBeGreaterThan(0);
      }
      const distintos = new Set(imagens.map((img) => img.alt.trim()));
      await expect(distintos.size).toBe(FOTOS.length);
    });
  },
};
