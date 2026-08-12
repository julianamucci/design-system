import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h, ref } from 'vue';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import type { CarouselApi } from './index';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';

const meta = {
  title: 'UI/Carousel/Compositions',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes do Carousel — dots customizados via CarouselApi e galeria visual com conteúdo variado.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Índice do slide que ocupa a maior parte do viewport.
 *
 * O embla translada o TRILHO com `transform` — o `scrollLeft` do viewport fica
 * em zero o tempo todo, então a prova de posição é geométrica. Mas contar
 * PIXEL não fecha: o slide é mais largo que o viewport (a margem negativa do
 * trilho mais o respiro entre slides), e o embla não desloca um "passo" inteiro
 * por snap — esperar dois passos de `offsetLeft` errava por 174px.
 *
 * Qual slide está à vista não depende do alinhamento do embla, nem do respiro
 * entre slides, nem da cauda da animação. E é o que a story afirma.
 */
function slideEmFoco(canvasElement: HTMLElement): number {
  const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
  const slides = Array.from(
    canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  );
  const v = viewport.getBoundingClientRect();
  let melhor = 0;
  let maior = -Infinity;
  slides.forEach((slide, i) => {
    const r = slide.getBoundingClientRect();
    const visivel = Math.min(r.right, v.right) - Math.max(r.left, v.left);
    if (visivel > maior) { maior = visivel; melhor = i; }
  });
  return melhor;
}

// Componente auxiliar para dots — captura CarouselApi e sincroniza índice
const CarouselComDots = defineComponent({
  components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
  setup() {
    const api = ref<CarouselApi | null>(null);
    const selectedIndex = ref(0);
    const slides = [1, 2, 3, 4, 5];

    function onInitApi(payload: CarouselApi) {
      api.value = payload;
      if (!payload) return;
      selectedIndex.value = payload.selectedScrollSnap();
      payload.on('select', () => {
        selectedIndex.value = payload.selectedScrollSnap();
      });
    }

    function scrollTo(i: number) {
      api.value?.scrollTo(i);
    }

    return { slides, selectedIndex, onInitApi, scrollTo };
  },
  render() {
    return h('div', { class: 'nds-stack', 'data-spacing': 'md' }, [
      h(
        Carousel,
        {
          class: 'nds-w-full nds-max-w-sm',
          'aria-label': 'Galeria com dots',
          onInitApi: this.onInitApi,
        },
        () => [
          h(CarouselContent, null, () =>
            this.slides.map((n) =>
              h(CarouselItem, { key: n }, () =>
                h(
                  'div',
                  {
                    class: 'nds-cluster nds-aspect-video nds-bg-muted-soft nds-rounded-lg',
                    'data-justify': 'center',
                  },
                  [h('span', { class: 'nds-text-h3 nds-font-semibold nds-text-muted-foreground' }, `Slide ${n}`)],
                ),
              ),
            ),
          ),
          h(CarouselPrevious, { 'aria-label': 'Item anterior' }),
          h(CarouselNext, { 'aria-label': 'Próximo item' }),
        ],
      ),
      // `.nds-carousel-dot` traz o alvo de 24px com a marca de 8px desenhada no
      // `::before` — desenhar o ponto à mão com 8px de lado reprova no axe por
      // `target-size` (WCAG 2.5.8). O estado ativo é pintado a partir do
      // próprio `aria-current`, então cor e anúncio nunca divergem.
      h(
        'div',
        { class: 'nds-cluster', 'data-justify': 'center' },
        this.slides.map((_, i) =>
          h('button', {
            key: i,
            type: 'button',
            class: 'nds-carousel-dot',
            // `aria-current` some no dot inativo em vez de virar "false":
            // seletor de presença `[aria-current]` casa com "false" também.
            'aria-current': this.selectedIndex === i ? 'true' : null,
            'aria-label': `Ir para o slide ${i + 1} de ${this.slides.length}`,
            onClick: () => this.scrollTo(i),
          }),
        ),
      ),
    ]);
  },
});

export const WithDots: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story: 'Os dots trazem posição e total no nome — "2" sozinho não diz para onde leva. O dot atual se anuncia por aria-current e se distingue pela cor de fundo.',
      },
    },
  },
  render: () => ({
    components: { CarouselComDots },
    template: '<CarouselComDots />',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // O total sai do conjunto renderizado: um número escrito à mão continuaria
    // batendo depois de alguém tirar um slide do array.
    const total = canvas.getAllByRole('group').length;
    const dot = (posicao: number) =>
      canvas.getByRole('button', { name: `Ir para o slide ${posicao} de ${total}` });

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(slideEmFoco(canvasElement)).toBe(i); });

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      for (let i = 1; i <= total; i++) {
        await expect(dot(i)).toBeInTheDocument();
      }
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O dot atual se distingue dos outros por mais do que a posição', async () => {
      // Comparação entre dois dots, e não medida absoluta de um só: "tem fundo"
      // é verdade para os cinco. O que prova o destaque é o atual ter um fundo
      // DIFERENTE do inativo.
      //
      // A leitura é do `::before`: o botão em si é o alvo de 24px, transparente,
      // e a marca colorida de 8px mora no pseudo-elemento.
      const cor = (el: Element) => getComputedStyle(el, '::before').backgroundColor;
      await expect(cor(dot(1))).not.toBe(cor(dot(2)));
    });

    await step('Clicar num dot salta direto para aquele slide', async () => {
      // O dot não alterna nada: ele leva a um índice ABSOLUTO. Clicar duas
      // vezes no terceiro dot para no terceiro slide as duas vezes, então o
      // replay do painel Interactions chega ao mesmo lugar.
      const terceiro = dot(3);
      await userEvent.click(terceiro);
      await emSlide(2);
      await expect(dot(3)).toHaveAttribute('aria-current', 'true');
      await expect(dot(1).hasAttribute('aria-current')).toBe(false);
    });

    await step('E a story termina no começo', async () => {
      // Estado limpo para a próxima rodada e para a captura do Chromatic, que
      // fotografa o último quadro.
      const primeiro = dot(1);
      await userEvent.click(primeiro);
      await emSlide(0);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
    });
  },
};

const ROTULOS = ['Amanhecer', 'Oceano', 'Floresta', 'Cidade', 'Deserto'];

export const Gallery: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Galeria de conteúdo visual: cada slide é uma superfície com o rótulo ancorado na base.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: ROTULOS }; },
    template: `
      <Carousel class="nds-w-full nds-max-w-sm" aria-label="Galeria de fotos">
        <CarouselContent>
          <CarouselItem v-for="(rotulo, i) in slides" :key="i">
            <div class="nds-cluster nds-aspect-video nds-p-4 nds-bg-muted-soft nds-rounded-lg" data-align="end" data-justify="start">
              <span class="nds-text-body nds-font-semibold nds-text-foreground">{{ rotulo }}</span>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A região se anuncia como carrossel e traz o nome da galeria', async () => {
      const regiao = canvas.getByRole('region', { name: /galeria de fotos/i });
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Cada slide rotulado entrega o próprio rótulo', async () => {
      const grupos = canvas.getAllByRole('group');
      await expect(grupos.length).toBe(ROTULOS.length);
      for (const [i, rotulo] of ROTULOS.entries()) {
        await expect(grupos[i]).toHaveTextContent(rotulo);
        await expect(canvas.getByText(rotulo)).toBeVisible();
      }
    });
  },
};
