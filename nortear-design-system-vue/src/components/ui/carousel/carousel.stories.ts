import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import CarouselDocs from '@/components/docs/CarouselDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção do deslize do carrossel',
    },
  },
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Índice do slide que ocupa a maior parte do viewport.
 *
 * O embla NÃO rola o viewport: ele aplica `transform` no trilho, e o
 * `scrollLeft` fica em zero do começo ao fim — então a prova de movimento é
 * geométrica. Mas medir PIXEL não fecha, e errou de duas formas antes de virar
 * isto: "andou em relação à medida de agora" resolve no primeiro quadro da
 * transição, com o trilho ainda correndo, e a medida seguinte parte de um
 * número em movimento (-342 contra -17). E um alvo absoluto em passos de slide
 * também não serve: o slide é mais largo que o viewport (a margem negativa do
 * trilho mais o respiro entre slides), então o embla não desloca um "passo"
 * inteiro por snap.
 *
 * Qual slide está à vista não depende de nenhuma dessas suposições — nem do
 * alinhamento do embla, nem do respiro entre slides, nem da cauda da animação.
 * E é literalmente o que a story afirma.
 */
function slideEmFoco(canvasElement: HTMLElement, eixo: 'x' | 'y'): number {
  const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
  const slides = Array.from(
    canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
  );
  const v = viewport.getBoundingClientRect();
  let melhor = 0;
  let maior = -Infinity;
  slides.forEach((slide, i) => {
    const r = slide.getBoundingClientRect();
    const visivel = eixo === 'y'
      ? Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top)
      : Math.min(r.right, v.right) - Math.max(r.left, v.left);
    if (visivel > maior) { maior = visivel; melhor = i; }
  });
  return melhor;
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'visual.item1',
    ],
  },
  render: (args) => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { args, slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel v-bind="args" class="nds-w-full nds-max-w-sm" aria-label="Galeria de exemplos">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-aspect-video nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ n }}</span>
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
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    // O eixo vem do DOM, não do arg: é o trilho renderizado que decide para
    // onde o carrossel anda, e é ele que a medição precisa acompanhar.
    const eixo = track.dataset.orientation === 'vertical' ? 'y' : 'x';
    const anterior = () => canvas.getByRole('button', { name: /item anterior/i }) as HTMLButtonElement;
    const proximo = () => canvas.getByRole('button', { name: /próximo item/i }) as HTMLButtonElement;

    const emSlide = async (i: number) =>
      waitFor(async () => { await expect(slideEmFoco(canvasElement, eixo)).toBe(i); });

    /** Volta ao primeiro slide clicando ENQUANTO a seta de voltar estiver viva. */
    const voltarAoInicio = async () => {
      const total = canvas.getAllByRole('group').length;
      for (let passo = 0; passo < total; passo++) {
        const botao = anterior();
        // `.nds-button:disabled` declara `pointer-events: none`, e o userEvent
        // recusa clicar num alvo assim: nunca clicar sem checar antes.
        if (botao.disabled) break;
        await userEvent.click(botao);
      }
      await emSlide(0);
    };

    await step('A região tem papel, roledescription e nome', async () => {
      // Sem nome acessível a região não vira marco de navegação: o leitor
      // anuncia "carrossel" sem dizer de quê.
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(regiao).toHaveAccessibleName('Galeria de exemplos');
    });

    await step('Cada slide é um grupo anunciado como slide', async () => {
      const slides = canvas.getAllByRole('group');
      // O total sai do conjunto renderizado; um número escrito à mão continuaria
      // batendo depois de alguém tirar um slide do array.
      await expect(slides.length).toBeGreaterThan(2);
      for (const slide of slides) {
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      }
    });

    await step('No começo só a seta de avanço leva a algum lugar', async () => {
      // O passo estabelece a própria precondição: no painel Interactions o play
      // roda de novo sobre o MESMO DOM, que a rodada anterior deixou no
      // primeiro slide — mas quem estiver navegando à mão pode ter deixado em
      // qualquer outro.
      await voltarAoInicio();

      // `canScrollNext` nasce falso e só vira verdadeiro quando o embla emite
      // `init` — que ele agenda com `setTimeout(…, 0)`. Ler no primeiro quadro
      // pegaria o valor de partida, não o estado do componente montado.
      await waitFor(() => expect(proximo()).toBeEnabled());
      await expect(anterior()).toBeDisabled();
    });

    await step('Clicar em avançar leva ao segundo slide e acorda a seta de voltar', async () => {
      await userEvent.click(proximo());
      await emSlide(1);
      await expect(anterior()).toBeEnabled();
    });

    await step('A seta do teclado avança com o foco na região', async () => {
      // É o caminho que um carrossel só-de-arrasto não tem: a WCAG 2.1.1 exige
      // equivalente de teclado para toda navegação.
      regiao.focus();
      await expect(regiao).toHaveFocus();
      await userEvent.keyboard(eixo === 'y' ? '{ArrowDown}' : '{ArrowRight}');
      await emSlide(2);
    });

    await step('E a story termina no primeiro slide', async () => {
      // O Chromatic fotografa o último quadro e o axe varre o que sobrou na
      // tela: a story precisa terminar no estado que `visual.item1` promete.
      await voltarAoInicio();
      await expect(anterior()).toBeDisabled();
    });
  },
};
