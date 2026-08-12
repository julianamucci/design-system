import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'UI/Carousel/Settings',
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio, NdsButton] })],
  parameters: { layout: 'centered', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

// ─── Um item por vez ──────────────────────────────────────────────────────────

export const Single: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { slides: [1, 2, 3] },
    template: `
      <nds-carousel class="nds-w-full nds-max-w-md" label="Um item por vez" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (i of slides; track i) {
            <div ndsCarouselItem class="nds-basis-full">
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      // Um pouco maior que 1: a margem negativa do track puxa o padding do
      // primeiro slide para fora, e é ele que dá o respiro entre os slides.
      await expect(proporcao).toBeGreaterThan(0.98);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });
  },
};

// ─── Vários itens visíveis ────────────────────────────────────────────────────

export const MultiResponsive: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4, 5, 6] },
    template: `
      <nds-carousel class="nds-w-full nds-max-w-lg" label="Vários itens por vez" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (i of slides; track i) {
            <div ndsCarouselItem class="nds-md-basis-half nds-lg-basis-third">
              <div ndsAspectRatio [ratio]="1">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ i }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla.
      const janela = canvasElement.ownerDocument.defaultView!;
      const grande = janela.matchMedia('(min-width: 1024px)').matches;
      const medio = janela.matchMedia('(min-width: 768px)').matches;
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      await expect(proporcao).toBeCloseTo(esperado, 1);
    });

    await step('Todos os slides continuam anunciáveis com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      const total = slides.length;
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });
  },
};

// ─── Autoplay com pausa ───────────────────────────────────────────────────────

export const Autoplay: Story = {
  parameters: { covers: ['functional.item7', 'visual.item3'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4] },
    // O botão de pausa é o mecanismo que a WCAG 2.2.2 exige para movimento
    // automático com mais de 5s de duração — e o rótulo dele é a única forma
    // de ver, de fora, que o autoplay parou.
    template: `
      <div class="nds-stack" data-spacing="md">
        <nds-carousel
          #carrossel
          class="nds-w-full nds-max-w-md"
          label="Destaques"
          slideLabel="Slide {index} de {total}"
          [autoplay]="true"
          [loop]="true"
          [autoplayDelay]="400"
        >
          <div ndsCarouselContent>
            @for (i of slides; track i) {
              <div ndsCarouselItem>
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Destaque {{ i }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
          <button ndsCarouselPrevious label="Item anterior"></button>
          <button ndsCarouselNext label="Próximo item"></button>
        </nds-carousel>

        <button ndsButton variant="outline" size="sm" (click)="carrossel.alternarAutoplay()">
          {{ carrossel.autoplayAtivo() ? 'Pausar apresentação' : 'Retomar apresentação' }}
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O carrossel avança sozinho', async () => {
      await expect(canvas.getByRole('button', { name: 'Pausar apresentação' })).toBeInTheDocument();
      await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(0), { timeout: 4000 });
    });

    await step('Interagir para o avanço automático', async () => {
      // `stopOnInteraction`: quem tomou o controle não deve ser atropelado pelo
      // relógio. O rótulo do botão vira "Retomar", que é o estado observável.
      await userEvent.click(canvas.getByRole('button', { name: 'Próximo item' }));
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: 'Retomar apresentação' })).toBeInTheDocument(),
      );
    });

    await step('O comando de retomar devolve o avanço automático', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Retomar apresentação' }));
      await expect(canvas.getByRole('button', { name: 'Pausar apresentação' })).toBeInTheDocument();
    });

    await step('E a story termina com o relógio parado', async () => {
      // Autoplay é temporizador, e a story terminava com ele LIGADO: o
      // carrossel seguia andando durante a foto do Chromatic e durante a
      // varredura do axe, que rodam depois da play. Cada execução fotografava
      // um slide diferente e a diferença lia como regressão visual.
      //
      // Parar no fim também é o que torna a story replayável: a segunda rodada
      // recomeça de um componente parado, não de um que já andou sozinho
      // enquanto ninguém olhava.
      await userEvent.click(canvas.getByRole('button', { name: 'Pausar apresentação' }));
      await expect(canvas.getByRole('button', { name: 'Retomar apresentação' })).toBeInTheDocument();

      // O rótulo é o estado declarado; a prova é o viewport não sair do lugar
      // depois de um intervalo inteiro de autoplay (400ms) ter passado.
      //
      // A medida de referência só vale depois que a rolagem assenta: parar o
      // relógio não cancela o quadro que já estava em curso, e ler o valor no
      // instante do clique compararia contra um número ainda em movimento —
      // a mesma corrida do contraste ~1.0 em elemento a meio do fade.
      // `NaN` na semente não é descuido, é o que obriga a espera a comparar
      // duas amostras SEPARADAS NO TEMPO. Semeando com a posição atual, a
      // primeira verificação — que roda no mesmo quadro — compararia o valor
      // consigo mesmo, daria "assentou" e a espera sairia sem provar nada.
      let anterior = NaN;
      await waitFor(async () => {
        const agora = viewport.scrollLeft;
        const assentou = agora === anterior;
        anterior = agora;
        await expect(assentou).toBe(true);
      }, { timeout: 3000 });
      const parado = anterior;

      await new Promise((resolve) => setTimeout(resolve, 900));
      await expect(viewport.scrollLeft).toBe(parado);
    });
  },
};
