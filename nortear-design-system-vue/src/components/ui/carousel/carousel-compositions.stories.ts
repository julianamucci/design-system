import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h, ref } from 'vue';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import type { CarouselApi } from './index';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { focusSlide } from './carousel.fixtures';
import carouselTranslations from '@shared/content/carousel/translations.json';
import { carouselWithDotsSource, carouselGaleriaSource } from './carousel.source';

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

const meta = {
  title: 'Primitives/Display/Carousel/Compositions',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselGaleriaSource },
      description: {
        component: 'Composicoes do Carousel — dots customizados via CarouselApi e galeria visual com conteúdo variado.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Componente auxiliar para dots — captura CarouselApi e sincroniza índice
const CarouselWithDots = defineComponent({
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
          class: 'nds-w-sm',
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
                    class: 'nds-cluster nds-aspect-16-9 nds-bg-muted-soft nds-rounded-lg',
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
      // `.nds-carousel-dot` traz o alvo com piso de 24px nos dois estados —
      // desenhar o ponto à mão com 8px de lado reprova no axe por `target-size`
      // (WCAG 2.5.8). O atual vira pílula com o rótulo à vista e os demais
      // continuam pontos, tudo a partir do próprio `aria-current`, então forma
      // e anúncio nunca divergem.
      //
      // O rótulo mora em TODOS os controles, não só no atual: é o que deixa a
      // pílula abrir e fechar por recorte em vez de o texto piscar.
      h(
        'div',
        { class: 'nds-cluster', 'data-justify': 'center' },
        this.slides.map((_, i) =>
          h(
            'button',
            {
              key: i,
              type: 'button',
              class: 'nds-carousel-dot',
              // `aria-current` some no controle inativo em vez de virar
              // "false": seletor de presença `[aria-current]` casa com "false".
              'aria-current': this.selectedIndex === i ? 'true' : null,
              'aria-label': accessibleName(i + 1, this.slides.length),
              onClick: () => this.scrollTo(i),
            },
            [h('span', { class: 'nds-carousel-dot-label' }, labelVisible(i + 1))],
          ),
        ),
      ),
    ]);
  },
});

export const WithDots: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item6', 'visual.item5'],
    docs: {
      // A fileira de pontos é uma sub-composição inteira, montada sobre a
      // instância que o componente entrega — o snippet do `meta` a esconderia.
      source: { transform: carouselWithDotsSource },
      description: {
        story: 'A paginação traz posição e total no nome — "2" sozinho não diz para onde leva. O slide atual se anuncia por aria-current e ocupa a própria posição da fileira como pílula rotulada.',
      },
    },
  },
  render: () => ({
    components: { CarouselWithDots },
    template: '<CarouselWithDots />',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // O total sai do conjunto renderizado: um número escrito à mão continuaria
    // batendo depois de alguém tirar um slide do array.
    const total = canvas.getAllByRole('group').length;
    const dot = (position: number) =>
      canvas.getByRole('button', { name: accessibleName(position, total) });
    /**
     * O rótulo é o único filho do controle — a marca do ponto é `::before`, e
     * pseudo-elemento não entra em `firstElementChild`. Buscar por classe seria
     * asserir o nome dela; o que interessa aqui é a CAIXA que ela produz.
     */
    const label = (el: Element) => el.firstElementChild as HTMLElement;
    const width = (el: Element) => el.getBoundingClientRect().width;

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(focusSlide(canvasElement)).toBe(i); }, { timeout: 4000 });

    await step('Há um dot por slide, e o primeiro nasce como o atual', async () => {
      for (let i = 1; i <= total; i++) {
        await expect(dot(i)).toBeInTheDocument();
      }
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
      await expect(dot(2).hasAttribute('aria-current')).toBe(false);
    });

    await step('O slide atual vira pílula rotulada na própria posição da fileira', async () => {
      // Este é o padrão novo: a fileira não é de N peças iguais. Com o 2º slide
      // atual, ela é `• [Slide 2] • • •` — e a asserção mede exatamente isso,
      // na posição 2, sem nunca citar nome de classe.
      //
      // Par idempotente: o clique só sai quando o controle ainda não é o atual.
      // O painel Interactions reexecuta a play no MESMO DOM.
      if (dot(2).getAttribute('aria-current') !== 'true') await userEvent.click(dot(2));
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
      await expect(accessibleName(2, total).toLowerCase()).toContain(labelVisible(2).toLowerCase());

      // A forma mudou, não só a cor: a pílula é mais larga que o ponto vizinho.
      await expect(width(dot(2))).toBeGreaterThan(width(dot(3)));

      // E os DEMAIS continuam pontos: nenhum outro rótulo à vista, e um único
      // `aria-current` na fileira inteira.
      const demais = Array.from({ length: total }, (_, k) => k + 1).filter((p) => p !== 2);
      for (const position of demais) {
        await expect(width(label(dot(position)))).toBeLessThan(1);
        await expect(dot(position).hasAttribute('aria-current')).toBe(false);
      }
    });

    await step('O alvo de cada controle da paginação continua com 24px de piso', async () => {
      // Medido na densidade padrão do preview. O ponto tem marca de 8px e a
      // pílula tem texto de 12px: sem o piso, os dois ficariam abaixo dos 24px
      // que a WCAG 2.5.8 cobra — foi o defeito que criou `.nds-carousel-dot`.
      for (let position = 1; position <= total; position++) {
        const box = dot(position).getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
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
      const first = dot(1);
      await userEvent.click(first);
      await emSlide(0);
      await expect(dot(1)).toHaveAttribute('aria-current', 'true');
    });
  },
};

const LABELS = ['Amanhecer', 'Oceano', 'Floresta', 'Cidade', 'Deserto'];

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
    setup() { return { slides: LABELS }; },
    template: `
      <Carousel class="nds-w-sm" aria-label="Galeria de fotos do produto">
        <CarouselContent>
          <CarouselItem v-for="(label, i) in slides" :key="i">
            <div class="nds-cluster nds-aspect-16-9 nds-p-4 nds-bg-muted-soft nds-rounded-lg" data-align="end" data-justify="start">
              <span class="nds-text-body nds-font-semibold nds-text-foreground">{{ label }}</span>
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
      const regiao = canvas.getByRole('region', { name: /galeria de fotos do produto/i });
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Cada slide rotulado entrega o próprio rótulo', async () => {
      const groups = canvas.getAllByRole('group');
      await expect(groups.length).toBe(LABELS.length);
      for (const [i, label] of LABELS.entries()) {
        await expect(groups[i]).toHaveTextContent(label);
        await expect(canvas.getByText(label)).toBeVisible();
      }
    });
  },
};
