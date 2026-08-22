import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import { focusSlide } from './carousel.fixtures';
import CarouselDocs from '@/components/docs/CarouselDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { carouselSource } from './carousel.source';

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CarouselDocs), source: { transform: carouselSource } },
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
      <Carousel v-bind="args" class="nds-w-sm" aria-label="Galeria de exemplos">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n">
            <div class="nds-cluster nds-aspect-16-9 nds-bg-muted-soft nds-rounded-lg" data-justify="center">
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
      waitFor(async () => { await expect(focusSlide(canvasElement, eixo)).toBe(i); }, { timeout: 4000 });

    /** Volta ao primeiro slide clicando ENQUANTO a seta de voltar estiver viva. */
    const startVoltar = async () => {
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
      await startVoltar();

      // `canScrollNext` nasce falso e só vira verdadeiro quando o embla emite
      // `init` — que ele agenda com `setTimeout(…, 0)`. Ler no primeiro quadro
      // pegaria o valor de partida, não o estado do componente montado.
      await waitFor(() => expect(proximo()).toBeEnabled(), { timeout: 4000 });
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
      await startVoltar();
      await expect(anterior()).toBeDisabled();
    });
  },
};
