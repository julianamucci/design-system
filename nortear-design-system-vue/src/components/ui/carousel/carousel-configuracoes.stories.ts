import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import AutoplayPlugin from 'embla-carousel-autoplay';
import type { CarouselApi } from './index';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';

const meta = {
  title: 'UI/Carousel/Settings',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Configuracoes principais do Carousel — quantos itens por vez, autoplay via plugin.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const viewportDe = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

export const Single: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story: 'Um item por vez: cada slide ocupa a largura inteira do viewport e a navegação anda de um em um.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4, 5] }; },
    template: `
      <Carousel class="nds-w-full nds-max-w-sm" aria-label="Galeria de item único">
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
    const viewport = viewportDe(canvasElement);

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      // Um pouco maior que 1: a margem negativa do trilho puxa o padding do
      // primeiro slide para fora, e é ele que dá o respiro entre os slides.
      await expect(proporcao).toBeGreaterThan(0.98);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      // `canScrollNext` só vira verdadeiro no `init` do embla, agendado com
      // `setTimeout(…, 0)`.
      await waitFor(() => expect(canvas.getByRole('button', { name: /próximo item/i })).toBeEnabled());
      await expect(canvas.getByRole('region', { name: /galeria de item único/i })).toBeInTheDocument();
    });
  },
};

export const MultiResponsive: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: {
      description: {
        story: 'A base do slide muda com o breakpoint: um item em telas estreitas, dois a partir de 768px e três a partir de 1024px.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4, 5, 6] }; },
    template: `
      <Carousel class="nds-w-full nds-max-w-md" aria-label="Galeria responsiva">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n" class="nds-md-basis-half nds-lg-basis-third">
            <div class="nds-cluster nds-aspect-square nds-bg-muted-soft nds-rounded-lg" data-justify="center">
              <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ n }}</span>
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
    const viewport = viewportDe(canvasElement);
    const janela = canvasElement.ownerDocument.defaultView!;
    const grande = janela.matchMedia('(min-width: 1024px)').matches;
    const medio = janela.matchMedia('(min-width: 768px)').matches;

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla.
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;
      const slide = canvas.getAllByRole('group')[0];
      const proporcao = slide.getBoundingClientRect().width / viewport.clientWidth;
      await expect(proporcao).toBeCloseTo(esperado, 1);
    });

    await step('A partir de 768px há mais de um item à mostra ao mesmo tempo', async () => {
      const slides = canvas.getAllByRole('group');
      const v = viewport.getBoundingClientRect();
      const segundoEntrou = slides[1].getBoundingClientRect().left < v.right - 2;
      // Abaixo do breakpoint a base volta a 100% e um item por vez é o
      // comportamento correto — a afirmação segue o layout, não o contrário.
      await expect(segundoEntrou).toBe(medio);
    });

    await step('Todos os slides continuam anunciáveis como slide', async () => {
      const slides = canvas.getAllByRole('group');
      await expect(slides.length).toBe(6);
      for (const slide of slides) {
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      }
    });
  },
};

/**
 * O relógio do plugin não tem controle visível nesta composição, e a play
 * precisa dele para se reexecutar: o painel Interactions replaya sobre o MESMO
 * DOM, onde a rodada anterior já desligou o autoplay. A referência guardada no
 * `init-api` é o que permite religá-lo como precondição.
 */
let apiAutoplay: CarouselApi | null = null;

export const Autoplay: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: {
      description: {
        story: 'O avanço automático anda sozinho a cada intervalo e para assim que alguém toca no carrossel — quem tomou o controle não é atropelado pelo relógio.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() {
      // `delay` curto para o teste não ficar preso esperando o relógio; sem
      // `loop`, para que voltar ao começo no fim da story seja determinístico.
      const plugins = [AutoplayPlugin({ delay: 400, stopOnInteraction: true })];
      const aoIniciar = (api: CarouselApi) => { apiAutoplay = api; };
      return { plugins, slides: [1, 2, 3, 4, 5], aoIniciar };
    },
    template: `
      <Carousel :plugins="plugins" @init-api="aoIniciar" class="nds-w-full nds-max-w-sm" aria-label="Galeria com autoplay">
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
    const viewport = viewportDe(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    // O embla translada o TRILHO; a matriz calculada é a posição observável de
    // fora, e comparar a string é exato — não tem margem de subpixel.
    const posicao = () => getComputedStyle(track).transform;

    /**
     * Espera duas leituras seguidas iguais: o trilho parou de animar.
     *
     * A semente é uma string impossível de propósito. Semeando com a leitura
     * corrente, a primeira volta do `waitFor` — que roda no mesmo quadro —
     * compararia o valor consigo mesmo e daria "parado" antes de a animação
     * sequer começar.
     */
    async function posicaoAssentada() {
      let anterior = '';
      await waitFor(async () => {
        const atual = posicao();
        const igual = atual === anterior;
        anterior = atual;
        await expect(igual).toBe(true);
      }, { timeout: 4000 });
      return anterior;
    }

    const relogio = () => apiAutoplay!.plugins().autoplay;

    await step('O carrossel avança sozinho', async () => {
      await expect(canvas.getByRole('region', { name: /galeria com autoplay/i })).toBeInTheDocument();

      // Precondição do próprio passo: numa montagem nova o plugin já está de pé
      // e `play()` só reagenda o mesmo intervalo; no replay do painel ele está
      // desligado desde a rodada anterior, e sem religar a espera abaixo
      // expiraria sem nada ter acontecido.
      await waitFor(() => expect(apiAutoplay?.plugins().autoplay).toBeDefined());
      // Desestruturado de propósito: `relogio().play()` faz o `eslint-plugin-
      // storybook` ler a chamada como a play function de outra story. O método
      // do plugin é uma closure, não usa `this`, então soltá-lo do objeto é
      // seguro.
      const { play: ligarRelogio } = relogio();
      ligarRelogio();
      await expect(relogio().isPlaying()).toBe(true);

      const partida = posicao();
      await waitFor(() => expect(posicao()).not.toBe(partida), { timeout: 4000 });
    });

    await step('Tocar no carrossel desliga o relógio', async () => {
      // `stopOnInteraction` do plugin escuta o `pointerDown` do embla, que nasce
      // do `mousedown` no VIEWPORT — as setas ficam fora dele e não passam por
      // ali. Clicar sobre os slides é a interação que o conteúdo descreve
      // ("pausa ao clicar ou arrastar") e a única que o plugin observa.
      await userEvent.click(viewport);

      // O estado interno do plugin e a posição têm de contar a mesma história:
      // o sinalizador sozinho não prova que o trilho parou, e a imobilidade
      // sozinha não distingue "parado" de "entre dois disparos".
      await expect(relogio().isPlaying()).toBe(false);

      // O SLIDE SELECIONADO, e não a matriz do trilho. A animação do embla tem
      // cauda longa e sub-pixel por quadro: duas leituras seguidas da matriz
      // saem iguais enquanto ainda faltam ~7px de percurso, e a comparação
      // exata reprovava depois, com o carrossel parado no mesmo slide o tempo
      // todo. O índice não tem esse ruído, e é o que "não avançou" quer dizer.
      const slideParado = apiAutoplay!.selectedScrollSnap();
      // Três vezes e meia o `delay`: se o relógio ainda estivesse de pé teria
      // disparado ao menos três vezes nesta janela. Provar a parada por estado
      // observável é o que impede a story de ficar viva sob o Chromatic e o axe.
      await new Promise((resolve) => { setTimeout(resolve, 1400); });
      await expect(apiAutoplay!.selectedScrollSnap()).toBe(slideParado);
      await expect(relogio().isPlaying()).toBe(false);
    });

    await step('E a story termina parada e no começo', async () => {
      const anterior = () => canvas.getByRole('button', { name: /item anterior/i }) as HTMLButtonElement;
      const total = canvas.getAllByRole('group').length;
      for (let passo = 0; passo < total; passo++) {
        const botao = anterior();
        // `.nds-button:disabled` declara `pointer-events: none` — checar antes
        // de clicar, senão o userEvent recusa e a story quebra no replay.
        if (botao.disabled) break;
        await userEvent.click(botao);
      }
      await expect(anterior()).toBeDisabled();

      // Alvo absoluto dentro da espera: o slide selecionado volta a ser o
      // primeiro. Medir depois de um `posicaoAssentada` que pode sair cedo
      // leria a geometria a meio caminho.
      await waitFor(async () => {
        await expect(apiAutoplay!.selectedScrollSnap()).toBe(0);
      });
    });
  },
};
