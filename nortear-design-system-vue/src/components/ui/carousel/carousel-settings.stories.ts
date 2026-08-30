import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import AutoplayPlugin from 'embla-carousel-autoplay';
import type { CarouselApi } from './index';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './index';
import {
  carouselArrastarSource,
  carouselAutoplaySource,
  carouselItemUnicoSource,
  carouselMultiResponsivoSource,
} from './carousel.source';

const meta = {
  title: 'Primitives/Display/Carousel/Settings',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselItemUnicoSource },
      description: {
        component: 'Configuracoes principais do Carousel — quantos itens por vez, autoplay via plugin.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A base do slide, medida contra a TRILHA e não contra o recorte.
 *
 * `flex-basis` resolve contra o contêiner flex, e a trilha é 16px MAIS
 * larga que o recorte de propósito: a margem negativa dela puxa o
 * `padding-left` do primeiro slide para fora, que é o que encosta o
 * primeiro slide na borda.
 *
 * Dividir pelo recorte devolvia `1 + 16/largura`, que não é a base de nada:
 * a conta só passava enquanto o carrossel fosse largo o bastante para o
 * gutter caber na tolerância. Com 163px de recorte ela dá 1,098 e reprova —
 * e é essa a largura no painel Interactions, que nenhuma suíte reproduz.
 *
 * Contra a trilha o gutter cancela, e a razão passa a ser exatamente a
 * fração do `flex-basis` — por isso a tolerância pôde fechar de 0,05 para
 * 0,005.
 */
function baseDoSlide(canvasElement: HTMLElement, slide: HTMLElement): number {
  const trail = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
  return slide.getBoundingClientRect().width / trail.getBoundingClientRect().width;
}

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
  target: HTMLElement,
  type: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
  y: number,
): void {
  const dedo = new Touch({ identifier: 1, target: target, clientX: x, clientY: y });
  const soltou = type === 'touchend';
  target.dispatchEvent(
    new TouchEvent(type, {
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
  target: HTMLElement,
  type: 'mousedown' | 'mousemove' | 'mouseup',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
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
      <Carousel class="nds-w-sm" aria-label="Um item por vez">
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

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1, 2);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      // `canScrollNext` só vira verdadeiro no `init` do embla, agendado com
      // `setTimeout(…, 0)`.
      await waitFor(() => expect(canvas.getByRole('button', { name: /próximo item/i })).toBeEnabled(), { timeout: 4000 });
      await expect(canvas.getByRole('region', { name: /um item por vez/i })).toBeInTheDocument();
    });
  },
};

export const MultiResponsive: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: {
      // A base responsiva mora no ITEM, e o conjunto de slides é maior: nada
      // disso está nos args, e a do `meta` mostraria um item por vez.
      source: { transform: carouselMultiResponsivoSource },
      description: {
        story: 'A base do slide muda com o breakpoint: um item em telas estreitas, dois a partir de 768px e três a partir de 1024px.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4, 5, 6] }; },
    template: `
      <Carousel class="nds-w-lg" aria-label="Conjunto longo de slides">
        <CarouselContent>
          <CarouselItem v-for="n in slides" :key="n" class="nds-md-basis-half nds-lg-basis-third">
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
    const viewport = viewportDe(canvasElement);
    const window = canvasElement.ownerDocument.defaultView!;
    const grande = window.matchMedia('(min-width: 1024px)').matches;
    const medio = window.matchMedia('(min-width: 768px)').matches;

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla.
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(esperado, 2);
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
      // O avanço automático entra por plugin do motor, com import próprio.
      source: { transform: carouselAutoplaySource },
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
      const onStart = (api: CarouselApi) => { apiAutoplay = api; };
      return { plugins, slides: [1, 2, 3, 4, 5], onStart };
    },
    template: `
      <Carousel :plugins="plugins" @init-api="onStart" class="nds-w-sm" aria-label="Destaques">
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
    const viewport = viewportDe(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    // O embla translada o TRILHO; a matriz calculada é a posição observável de
    // fora, e comparar a string é exato — não tem margem de subpixel.
    const position = () => getComputedStyle(track).transform;

    const relogio = () => apiAutoplay!.plugins().autoplay;

    await step('O carrossel avança sozinho', async () => {
      await expect(canvas.getByRole('region', { name: /destaques/i })).toBeInTheDocument();

      // Precondição do próprio passo: numa montagem nova o plugin já está de pé
      // e `play()` só reagenda o mesmo intervalo; no replay do painel ele está
      // desligado desde a rodada anterior, e sem religar a espera abaixo
      // expiraria sem nada ter acontecido.
      await waitFor(() => expect(apiAutoplay?.plugins().autoplay).toBeDefined(), { timeout: 4000 });
      // Desestruturado de propósito: `relogio().play()` faz o `eslint-plugin-
      // storybook` ler a chamada como a play function de outra story. O método
      // do plugin é uma closure, não usa `this`, então soltá-lo do objeto é
      // seguro.
      const { play: ligarRelogio } = relogio();
      ligarRelogio();
      await expect(relogio().isPlaying()).toBe(true);

      const partida = position();
      await waitFor(() => expect(position()).not.toBe(partida), { timeout: 4000 });
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
      const previous = () => canvas.getByRole('button', { name: /item anterior/i }) as HTMLButtonElement;
      const total = canvas.getAllByRole('group').length;
      for (let step = 0; step < total; step++) {
        const button = previous();
        // `.nds-button:disabled` declara `pointer-events: none` — checar antes
        // de clicar, senão o userEvent recusa e a story quebra no replay.
        if (button.disabled) break;
        await userEvent.click(button);
      }
      await expect(previous()).toBeDisabled();

      // Alvo absoluto dentro da espera: o slide selecionado volta a ser o
      // primeiro. Medir depois de um `posicaoAssentada` que pode sair cedo
      // leria a geometria a meio caminho.
      await waitFor(async () => {
        await expect(apiAutoplay!.selectedScrollSnap()).toBe(0);
      }, { timeout: 4000 });
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
      // O gesto não liga prop nenhuma; o que muda é o conjunto de slides.
      source: { transform: carouselArrastarSource },
      description: {
        story: 'Arrastar a área dos slides move o conteúdo junto com o ponteiro e assenta no slide mais próximo ao soltar.',
      },
    },
  },
  render: () => ({
    components: { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext },
    setup() { return { slides: [1, 2, 3, 4] }; },
    template: `
      <Carousel class="nds-w-sm" aria-label="Galeria com gesto de arrastar">
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
    const viewport = viewportDe(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    const previous = () => canvas.getByRole('button', { name: /item anterior/i }) as HTMLButtonElement;
    const next = () => canvas.getByRole('button', { name: /próximo item/i });

    // Quanto o trilho já saiu do recorte. O motor move o trilho por
    // `transform`, então `scrollLeft` fica em zero o tempo todo.
    const deslocamento = () =>
      viewport.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const slides = () => canvas.getAllByRole('group') as HTMLElement[];

    /**
     * Espera a posição PARAR de verdade: quatro leituras IDÊNTICAS.
     *
     * `< 0.5px` entre leituras não é parar — é andar devagar. O motor desacelera
     * até encostar, e na cauda da curva ele anda meio pixel por leitura enquanto
     * ainda falta caminho: primeiro isso deu por assentada uma posição a 152px do
     * ponto de parada, e depois, com a margem apertada para meio pixel, uma a
     * 3.12px dele. O segundo caso reprovava o GESTO por um erro da régua — o
     * gesto tinha chegado ao ponto certo, e era a posição da seta, colhida cedo
     * demais, que estava errada.
     *
     * Igualdade exata é o único critério que separa os dois: enquanto anima, o
     * motor reescreve a posição a cada quadro e duas leituras nunca coincidem; ao
     * terminar, ele escreve o valor final e para de escrever.
     */
    const settle = async () => {
      let estaveis = 0;
      let last = Number.NaN;
      await waitFor(async () => {
        const agora = deslocamento();
        estaveis = agora === last ? estaveis + 1 : 0;
        last = agora;
        await expect(estaveis).toBeGreaterThanOrEqual(3);
      }, { timeout: 4000 });
      return last;
    };

    /** Espera a posição chegar a uma coordenada já conhecida. */
    const inPosition = async (target: number) => {
      await waitFor(async () => {
        await expect(Math.abs(deslocamento() - target)).toBeLessThan(2);
      }, { timeout: 4000 });
    };

    // O motor só mede depois que a raiz entra no documento: esperar a seta de
    // avanço acordar é o portão de montagem, não uma folga arbitrária.
    await waitFor(() => expect(next()).toBeEnabled(), { timeout: 4000 });

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
        const button = previous();
        if (button.disabled) break;
        await userEvent.click(button);
      }
      posZero = await settle();
      await expect(previous()).toBeDisabled();

      await userEvent.click(next());
      posUm = await settle();
      await expect(posUm).toBeGreaterThan(posZero);

      await userEvent.click(previous());
      await inPosition(posZero);
      // A POSIÇÃO chega antes do ESTADO. `inPosition` prova que a rolagem
      // encostou no alvo, mas quem desabilita a seta é a reconciliação do
      // índice, e ela espera de propósito o silêncio do motor — sem isso um
      // gesto com inércia emitiria uma troca de slide por quadro atravessado.
      // Afirmar o botão no mesmo instante mede uma janela em que o componente
      // ainda nem foi avisado de que parou: passa na máquina ociosa e reprova
      // sob carga, que foi como esta reprovou no Angular e no Vanilla.
      await waitFor(async () => {
        await expect(previous()).toBeDisabled();
      }, { timeout: 4000 });
    });

    const box = viewport.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const direita = box.left + box.width * 0.85;
    const esquerda = box.left + box.width * 0.15;

    await step('O conteúdo acompanha o DEDO durante o gesto', async () => {
      // Pressiona e anda um pedaço, sem soltar. A medida acontece com o gesto
      // ainda em curso — é isto que separa "arrastou" de "mudou de slide".
      toque(viewport, 'touchstart', direita, y);
      toque(viewport, 'touchmove', direita - 30, y);
      toque(viewport, 'touchmove', direita - 60, y);
      toque(viewport, 'touchmove', direita - 90, y);
      await waitFor(async () => {
        await expect(deslocamento()).toBeGreaterThan(posZero + 4);
      }, { timeout: 4000 });
    });

    await step('Ao soltar, para onde a seta pararia', async () => {
      toque(viewport, 'touchmove', esquerda, y);
      toque(viewport, 'touchend', esquerda, y);

      // Assentou EM UM SLIDE, e no MESMO ponto que a seta alcança — não onde o
      // dedo largou. Um carrossel de rolagem livre pararia no meio, e é isto
      // que este passo reprova.
      await inPosition(posUm);
      await waitFor(async () => {
        await expect(previous()).toBeEnabled();
      }, { timeout: 4000 });
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
      }, { timeout: 4000 });

      mouse(viewport, 'mousemove', direita, y);
      mouse(viewport, 'mouseup', direita, y);

      await inPosition(posZero);
      await waitFor(async () => {
        await expect(previous()).toBeDisabled();
      }, { timeout: 4000 });
    });
  },
};
