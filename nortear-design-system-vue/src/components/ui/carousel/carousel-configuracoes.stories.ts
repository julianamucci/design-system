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

/**
 * Um passo de gesto de TOQUE, com o evento que o motor de fato assina.
 *
 * Medido, não suposto: o motor registra `touchstart`/`touchmove`/`touchend` e
 * `mousedown`/`mousemove`/`mouseup`, e NUNCA eventos de ponteiro. Uma sequência
 * de `userEvent.pointer` com `[TouchA>]` deixou o trilho parado em 0px — ela
 * despacha eventos de ponteiro, que aqui não são escutados por ninguém. Estes
 * são os eventos de toque de verdade, com as coordenadas no lugar em que o
 * motor as lê (`touches[0]`).
 *
 * `cancelable: true` não é enfeite: o motor devolve o gesto quando o
 * `touchmove` não é cancelável, porque aí não teria como impedir a página de
 * rolar junto.
 */
function toque(
  alvo: HTMLElement,
  tipo: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
  y: number,
): void {
  const dedo = new Touch({ identifier: 1, target: alvo, clientX: x, clientY: y });
  const soltou = tipo === 'touchend';
  alvo.dispatchEvent(
    new TouchEvent(tipo, {
      touches: soltou ? [] : [dedo],
      targetTouches: soltou ? [] : [dedo],
      changedTouches: [dedo],
      bubbles: true,
      cancelable: true,
    }),
  );
}

/**
 * Um passo de arraste por MOUSE, com os eventos que o motor de fato assina.
 *
 * Simétrico ao de toque, e pelo mesmo motivo: o motor registra
 * `mousedown`/`mousemove`/`mouseup`. A sequência de `userEvent.pointer`
 * entregava o começo do arraste mas não o fim — o trilho ficava parado onde o
 * cursor largou, a 135px do ponto de parada, porque o `mouseup` nunca chegou
 * ao manipulador. Despachar o evento certo remove o intermediário.
 *
 * `buttons: 1` enquanto o botão está apertado: é por ele que o motor sabe que
 * o arraste continua vivo.
 */
function mouse(
  alvo: HTMLElement,
  tipo: 'mousedown' | 'mousemove' | 'mouseup',
  x: number,
  y: number,
): void {
  alvo.dispatchEvent(
    new MouseEvent(tipo, {
      clientX: x,
      clientY: y,
      button: 0,
      buttons: tipo === 'mouseup' ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

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

/**
 * Gesto de arrastar — o mesmo caminho para o dedo e para o mouse.
 *
 * O motor de deslize reconhece eventos de PONTEIRO, e ponteiro é o que o dedo e
 * o mouse produzem: um único mecanismo atende os dois, e não há caminho separado
 * de toque para testar à parte. É por isso que o gesto aqui é conduzido com
 * `[TouchA>]` — o tipo de ponteiro que um toque real emite.
 *
 * Clique sintético não serve para isto: um `click` não tem trajeto, e o que está
 * sendo verificado é justamente que o conteúdo ACOMPANHA o trajeto e só depois
 * assenta. Daí a sequência de `userEvent.pointer` em passos, com uma medição
 * NO MEIO do gesto — sem ela, a story provaria apenas que a posição final mudou,
 * o que um clique na seta também faria.
 */
export const DragGesture: Story = {
  parameters: {
    covers: ['functional.item9'],
    docs: {
      description: {
        story: 'Arrastar a área dos slides move o conteúdo junto com o ponteiro e assenta no slide mais próximo ao soltar.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4] }; },
    template: `
      <Carousel class="nds-w-full nds-max-w-sm" aria-label="Galeria com gesto de arrastar">
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
    const anterior = () => canvas.getByRole('button', { name: /item anterior/i }) as HTMLButtonElement;
    const proximo = () => canvas.getByRole('button', { name: /próximo item/i });

    // Quanto o trilho já saiu do recorte. O motor move o trilho por
    // `transform`, então `scrollLeft` fica em zero o tempo todo.
    const deslocamento = () =>
      viewport.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const slides = () => canvas.getAllByRole('group') as HTMLElement[];

    /**
     * Espera a posição PARAR de verdade: quatro leituras seguidas dentro de
     * meio pixel.
     *
     * Duas não bastam. O motor desacelera até encostar, e no fim da curva ele
     * anda menos de meio pixel entre duas leituras enquanto ainda falta
     * caminho — foi assim que uma medida de "parou" deu por assentada uma
     * posição a 152px do ponto de parada.
     */
    const assentar = async () => {
      let estaveis = 0;
      let ultimo = Number.NaN;
      await waitFor(async () => {
        const agora = deslocamento();
        estaveis = Math.abs(agora - ultimo) < 0.5 ? estaveis + 1 : 0;
        ultimo = agora;
        await expect(estaveis).toBeGreaterThanOrEqual(3);
      }, { timeout: 4000 });
      return ultimo;
    };

    /** Espera a posição chegar a uma coordenada já conhecida. */
    const emPosicao = async (alvo: number) => {
      await waitFor(async () => {
        await expect(Math.abs(deslocamento() - alvo)).toBeLessThan(2);
      }, { timeout: 4000 });
    };

    // O motor só mede depois que a raiz entra no documento: esperar a seta de
    // avanço acordar é o portão de montagem, não uma folga arbitrária.
    await waitFor(() => expect(proximo()).toBeEnabled());

    // ── A RÉGUA ───────────────────────────────────────────────────────────────
    //
    // As posições que as SETAS alcançam. É contra elas que o gesto é medido, e
    // não contra uma conta de `índice x largura`: a geometria do trilho varia
    // entre as stacks (onde ele compensa o respiro do slide com margem
    // negativa, nasce deslocado), e uma conta que sirva a uma erra na outra.
    // Medir contra as setas também é exatamente o que o contrato promete — que
    // o gesto pare onde a seta pararia.
    let posZero = 0;
    let posUm = 0;

    await step('Precondição: a régua sai das próprias setas', async () => {
      // O painel Interactions reexecuta a play no MESMO DOM: começar voltando
      // ao primeiro slide é o que faz a segunda rodada valer tanto quanto a
      // primeira.
      for (let volta = 0; volta < slides().length; volta++) {
        const botao = anterior();
        if (botao.disabled) break;
        await userEvent.click(botao);
      }
      posZero = await assentar();
      await expect(anterior()).toBeDisabled();

      await userEvent.click(proximo());
      posUm = await assentar();
      await expect(posUm).toBeGreaterThan(posZero);

      await userEvent.click(anterior());
      await emPosicao(posZero);
      await expect(anterior()).toBeDisabled();
    });

    const caixa = viewport.getBoundingClientRect();
    const y = caixa.top + caixa.height / 2;
    const direita = caixa.left + caixa.width * 0.85;
    const esquerda = caixa.left + caixa.width * 0.15;

    await step('O conteúdo acompanha o DEDO durante o gesto', async () => {
      // Pressiona e anda um pedaço, sem soltar. A medida acontece com o gesto
      // ainda em curso — é isto que separa "arrastou" de "mudou de slide".
      toque(viewport, 'touchstart', direita, y);
      toque(viewport, 'touchmove', direita - 30, y);
      toque(viewport, 'touchmove', direita - 60, y);
      toque(viewport, 'touchmove', direita - 90, y);
      await waitFor(async () => {
        await expect(deslocamento()).toBeGreaterThan(posZero + 4);
      });
    });

    await step('Ao soltar, para onde a seta pararia', async () => {
      toque(viewport, 'touchmove', esquerda, y);
      toque(viewport, 'touchend', esquerda, y);

      // Assentou EM UM SLIDE, e no MESMO ponto que a seta alcança — não onde o
      // dedo largou. Um carrossel de rolagem livre pararia no meio, e é isto
      // que este passo reprova.
      await emPosicao(posUm);
      await waitFor(async () => {
        await expect(anterior()).toBeEnabled();
      });
    });

    await step('O MOUSE percorre o mesmo caminho, de volta ao primeiro slide', async () => {
      // Mesma engrenagem, outro conjunto de eventos: o motor trata arraste de
      // mouse e de dedo no mesmo manipulador, e o que muda é só por onde as
      // coordenadas chegam. Os eventos são despachados direto, pelo mesmo
      // motivo do gesto de dedo: é o que o motor escuta.
      //
      // O arraste é para a DIREITA, então volta um slide: a story termina no
      // estado inicial, que é o que o Chromatic fotografa e o replay do painel
      // Interactions reencontra.
      mouse(viewport, 'mousedown', esquerda, y);
      mouse(viewport, 'mousemove', esquerda + 40, y);
      mouse(viewport, 'mousemove', esquerda + 80, y);
      // Já andou de volta junto com o cursor, antes de soltar.
      await waitFor(async () => {
        await expect(deslocamento()).toBeLessThan(posUm - 4);
      });

      mouse(viewport, 'mousemove', direita, y);
      mouse(viewport, 'mouseup', direita, y);

      await emPosicao(posZero);
      await waitFor(async () => {
        await expect(anterior()).toBeDisabled();
      });
    });
  },
};
