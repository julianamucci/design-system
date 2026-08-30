import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import carouselTranslations from '@shared/content/carousel/translations.json';
import {
  carouselWithDotsSource,
  carouselGaleriaSource,
  carouselSource,
} from './carousel.source';

/**
 * "Slide" é texto VISÍVEL dentro da pílula, então é conteúdo e não literal de
 * código: sai do mesmo `translations.json` que a docs page lê, onde a chave
 * existe nos três idiomas. A story é fixture e fica presa a pt-BR de propósito
 * — quem resolve o idioma de quem lê é a docs page, e uma play que dependesse
 * do seletor de idioma procuraria um nome diferente a cada rodada.
 */
const CONTENT = carouselTranslations['pt-BR'].demonstration.labels;
/** Nome acessível: posição E total. "Slide 2" sozinho não diz para onde leva. */
const accessibleName = (position: number, total: number) =>
  `${CONTENT.goToSlide} ${position} ${CONTENT.of} ${total}`;
/** Texto visível da pílula — um PEDAÇO do nome acessível (WCAG 2.5.3). */
const labelVisible = (position: number) => `${CONTENT.slide} ${position}`;

const meta: Meta = {
  title: 'Primitives/Display/Carousel/Compositions',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: carouselSource },
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
  parameters: {
    covers: ['functional.item8', 'accessibility.item6', 'visual.item5'],
    docs: { source: { transform: carouselWithDotsSource } },
  },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'withDots',
      slideCount: TOTAL_DOTS,
      widthClass: 'nds-w-md',
      ariaLabel: 'Galeria com dots',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
      goToSlideLabel: CONTENT.goToSlide,
      slideLabel: CONTENT.slide,
      ofLabel: CONTENT.of,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

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
    const focusSlide = () => {
      const v = viewport.getBoundingClientRect();
      let melhor = 0;
      let maior = -Infinity;
      canvas.getAllByRole('group').forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const visible = Math.min(r.right, v.right) - Math.max(r.left, v.left);
        if (visible > maior) { maior = visible; melhor = i; }
      });
      return melhor;
    };

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(focusSlide()).toBe(i); }, { timeout: 4000 });

    // Posição E total no nome: "2" sozinho não diz para onde leva.
    const dot = (n: number) => canvas.getByRole('button', { name: accessibleName(n, TOTAL_DOTS) });
    /**
     * O rótulo é o único filho do controle — a marca do ponto é `::before`, e
     * pseudo-elemento não entra em `firstElementChild`. Buscar por classe seria
     * asserir o nome dela; o que interessa aqui é a CAIXA que ela produz.
     */
    const label = (el: Element) => el.firstElementChild as HTMLElement;
    const width = (el: Element) => el.getBoundingClientRect().width;

    // Par idempotente: o dot só é clicado quando ainda NÃO é o atual. O painel
    // Interactions reexecuta a play no MESMO DOM, e um clique cego partiria do
    // estado que a rodada anterior deixou.
    const irTo = async (n: number) => {
      const target = dot(n);
      if (target.getAttribute('aria-current') !== 'true') await userEvent.click(target);
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

    await step('O slide atual vira pílula rotulada na própria posição da fileira', async () => {
      // Este é o padrão novo: a fileira não é de N peças iguais. Com o 2º slide
      // atual, ela é `• [Slide 2] • • •` — e a asserção mede exatamente isso,
      // na posição 2, sem nunca citar nome de classe.
      await irTo(2);
      await waitFor(async () => {
        await expect(dot(2)).toHaveAttribute('aria-current', 'true');
      }, { timeout: 4000 });

      // `waitFor` porque a mudança de forma é ANIMADA: medida no primeiro
      // quadro, a pílula ainda está fechada e o ponto anterior ainda aberto.
      await waitFor(async () => {
        await expect(width(label(dot(2)))).toBeGreaterThan(0);
        await expect(width(label(dot(1)))).toBeLessThan(1);
      }, { timeout: 4000 });

      // Rótulo visível certo, e é um pedaço do nome acessível (WCAG 2.5.3).
      await expect(label(dot(2))).toHaveTextContent(labelVisible(2));
      await expect(accessibleName(2, TOTAL_DOTS).toLowerCase()).toContain(
        labelVisible(2).toLowerCase(),
      );

      // A forma mudou, não só a cor: a pílula é mais larga que o ponto vizinho.
      await expect(width(dot(2))).toBeGreaterThan(width(dot(3)));

      // E os DEMAIS continuam pontos: nenhum outro rótulo à vista, e um único
      // `aria-current` na fileira inteira.
      const demais = Array.from({ length: TOTAL_DOTS }, (_, k) => k + 1).filter((p) => p !== 2);
      for (const position of demais) {
        await expect(width(label(dot(position)))).toBeLessThan(1);
        await expect(dot(position).hasAttribute('aria-current')).toBe(false);
      }
    });

    await step('O alvo de cada controle da paginação continua com 24px de piso', async () => {
      // Medido na densidade padrão do preview. O ponto tem marca de 8px e a
      // pílula tem texto de 12px: sem o piso, os dois ficariam abaixo dos 24px
      // que a WCAG 2.5.8 cobra — foi o defeito que criou `.nds-carousel-dot`.
      for (let position = 1; position <= TOTAL_DOTS; position++) {
        const box = dot(position).getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Clicar num dot salta direto para aquele slide', async () => {
      await irTo(3);
      // Salto, não passo: o dot leva a um índice ABSOLUTO.
      await emSlide(2);
      await waitFor(async () => {
        await expect(dot(3)).toHaveAttribute('aria-current', 'true');
        await expect(dot(1).hasAttribute('aria-current')).toBe(false);
      }, { timeout: 4000 });
    });

    await step('E a story termina no começo, replayável', async () => {
      // O painel Interactions reexecuta a play no MESMO DOM: sem voltar, a
      // segunda rodada encontraria o terceiro dot como atual e o primeiro passo
      // reprovaria. É também o quadro que o Chromatic fotografa.
      await irTo(1);
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
  parameters: {
    docs: { source: { transform: carouselGaleriaSource } },
  },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'gallery',
      widthClass: 'nds-w-md',
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
      const images = Array.from(canvasElement.querySelectorAll('img'));
      await expect(images.length).toBe(FOTOS.length);
      for (const img of images) {
        await expect(img.alt.trim().length).toBeGreaterThan(0);
      }
      const distintos = new Set(images.map((img) => img.alt.trim()));
      await expect(distintos.size).toBe(FOTOS.length);
    });
  },
};
