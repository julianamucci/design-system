import type { Meta, StoryObj } from '@storybook/vue3';
import { defineComponent, h, ref } from 'vue';
import { within, expect } from 'storybook/test';
import type { CarouselApi } from './index';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const meta = {
  title: 'UI/Carousel/Composicoes',
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

// Componente auxiliar para dots — captura CarouselApi e sincroniza índice
const CarouselComDots = defineComponent({
  components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
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

    return { slides, selectedIndex, onInitApi, scrollTo, cn };
  },
  render() {
    return h('div', { class: 'flex flex-col items-center gap-3' }, [
      h(
        Carousel,
        {
          class: 'w-full max-w-sm',
          'aria-label': 'Galeria com dots',
          onInitApi: this.onInitApi,
        },
        () => [
          h(CarouselContent, null, () =>
            this.slides.map((n) =>
              h(CarouselItem, { key: n }, () =>
                h(Card, { class: 'flex aspect-square items-center justify-center p-6' }, () =>
                  h('span', { class: 'text-3xl font-semibold' }, n),
                ),
              ),
            ),
          ),
          h(CarouselPrevious, { 'aria-label': 'Item anterior' }),
          h(CarouselNext, { 'aria-label': 'Próximo item' }),
        ],
      ),
      h(
        'div',
        { class: 'flex items-center gap-2', role: 'tablist', 'aria-label': 'Navegação por dots' },
        this.slides.map((_, i) =>
          h('button', {
            key: i,
            type: 'button',
            role: 'tab',
            'aria-selected': this.selectedIndex === i ? 'true' : 'false',
            'aria-label': `Ir para o slide ${i + 1} de ${this.slides.length}`,
            class: cn(
              'h-2 rounded-full transition-all',
              this.selectedIndex === i ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
            ),
            onClick: () => this.scrollTo(i),
          }),
        ),
      ),
    ]);
  },
});

export const ComDots: Story = {
  render: () => ({
    components: { CarouselComDots },
    template: '<CarouselComDots />',
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Carousel com dots presente', async () => {
      await expect(canvas.getByRole('region', { name: /galeria com dots/i })).toBeInTheDocument();
    });

    await step('Dots customizados expostos como tablist', async () => {
      await expect(canvas.getByRole('tablist', { name: /navegação por dots/i })).toBeInTheDocument();
    });

    await step('Primeiro dot começa selecionado', async () => {
      const firstTab = canvas.getByRole('tab', { name: /ir para o slide 1 de 5/i });
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const Galeria: Story = {
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, Card },
    setup() {
      const slides = [
        { label: 'Amanhecer', gradient: 'from-orange-400 via-rose-400 to-pink-500' },
        { label: 'Oceano',    gradient: 'from-sky-400 via-cyan-500 to-blue-600'   },
        { label: 'Floresta',  gradient: 'from-emerald-400 via-green-500 to-teal-600' },
        { label: 'Cidade',    gradient: 'from-slate-500 via-zinc-600 to-neutral-700' },
        { label: 'Deserto',   gradient: 'from-amber-400 via-yellow-500 to-orange-500' },
      ];
      return { slides };
    },
    template: `
      <Carousel class="w-full max-w-sm" aria-label="Galeria de fotos">
        <CarouselContent>
          <CarouselItem v-for="(slide, i) in slides" :key="i">
            <Card class="overflow-hidden p-0">
              <div :class="['aspect-video bg-gradient-to-br flex items-end p-4', slide.gradient]">
                <span class="text-white text-sm font-semibold drop-shadow">{{ slide.label }}</span>
              </div>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious aria-label="Item anterior" />
        <CarouselNext aria-label="Próximo item" />
      </Carousel>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
