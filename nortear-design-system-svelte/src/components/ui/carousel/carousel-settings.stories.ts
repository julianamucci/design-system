import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import {
  carouselAutoplaySource,
  carouselSource,
  carouselMultipleItemsSource,
} from './carousel.source';

const meta: Meta = {
  title: 'UI/Carousel/Settings',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; as que mudam a chamada
      // sobrescrevem com a sua logo abaixo.
      source: { transform: carouselSource },
      description: {
        component:
          'Configurações comuns: um item por vez, conjunto longo de slides com base responsiva e avanço automático com parada na interação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
  const trilha = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
  return slide.getBoundingClientRect().width / trilha.getBoundingClientRect().width;
}

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
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 5,
      widthClass: 'nds-w-md',
      ariaLabel: 'Um item por vez',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const proximo = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;

    // `canScrollNext` nasce falso: esperar por ele é o portão de montagem do
    // Embla, e não uma folga arbitrária.
    await waitFor(() => expect(proximo()).toBeEnabled(), { timeout: 4000 });

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1, 2);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      await expect(proximo()).toBeEnabled();
    });
  },
};

export const MultiResponsive: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    docs: { source: { transform: carouselMultipleItemsSource } },
  },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'multi',
      slideCount: 6,
      widthClass: 'nds-w-lg',
      ariaLabel: 'Conjunto longo de slides',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled(),
      { timeout: 4000 },
    );

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla aqui.
      const janela = canvasElement.ownerDocument.defaultView!;
      const grande = janela.matchMedia('(min-width: 1024px)').matches;
      const medio = janela.matchMedia('(min-width: 768px)').matches;
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;

      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(esperado, 2);
    });

    await step('Todos os slides continuam anunciáveis como grupo', async () => {
      const slides = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'),
      );
      await expect(slides.length).toBe(6);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAttribute('role', 'group');
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${slides.length}`);
      }
    });
  },
};

export const Autoplay: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: { source: { transform: carouselAutoplaySource } },
  },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'autoplay',
      slideCount: 5,
      widthClass: 'nds-w-md',
      ariaLabel: 'Destaques',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;

    // O Embla translada o trilho por `transform` e nunca mexe em `scrollLeft`:
    // a posição só se lê pela geometria.
    const position = () =>
      track.getBoundingClientRect().left - viewport.getBoundingClientRect().left;

    /** Índice do slide que ocupa a maior parte do viewport. */
    const focusSlide = () => {
      const v = viewport.getBoundingClientRect();
      let melhor = 0;
      let maior = -Infinity;
      canvas.getAllByRole('group').forEach((slide, i) => {
        const r = slide.getBoundingClientRect();
        const visivel = Math.min(r.right, v.right) - Math.max(r.left, v.left);
        if (visivel > maior) { maior = visivel; melhor = i; }
      });
      return melhor;
    };

    await step('O carrossel avança sozinho', async () => {
      // O intervalo do plugin está em 400ms nesta montagem — ver o comentário
      // em CarouselStory.svelte. A folga do `waitFor` é generosa porque o
      // relógio é do navegador, não do teste.
      const antes = position();
      await waitFor(() => expect(Math.abs(position() - antes)).toBeGreaterThan(1), {
        timeout: 4000,
      });
    });

    await step('Interagir com o carrossel para o avanço automático', async () => {
      // `stopOnInteraction`: quem tomou o controle não deve ser atropelado pelo
      // relógio. O gatilho é o `pointerDown` do próprio Embla, que só nasce
      // dentro do nó raiz — as setas ficam FORA dele nesta stack, então quem
      // para o relógio é o toque sobre a área dos slides, não o clique na seta.
      await userEvent.click(viewport);
    });

    await step('E a story termina com o relógio parado', async () => {
      // Autoplay é temporizador, e uma story que termina com ele LIGADO segue
      // andando durante a foto do Chromatic e durante a varredura do axe: cada
      // execução fotografa um slide diferente e a diferença lê como regressão.
      //
      // O SLIDE em foco, e não a caixa do trilho. Esta montagem liga a
      // repetição, e com ela o Embla reposiciona slides individualmente para
      // montar a ilusão do laço: a caixa do trilho se mexe uma dezena de pixels
      // sem ninguém ter avançado nada, e a comparação por pixel reprovava com o
      // carrossel parado no mesmo slide o tempo todo.
      const slideParado = focusSlide();

      // Três intervalos inteiros de autoplay sem trocar de slide: é a prova
      // observável de que o relógio parou, e não de que ele só estava entre
      // dois passos.
      await new Promise((resolve) => setTimeout(resolve, 1400));
      await expect(focusSlide()).toBe(slideParado);
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
  parameters: { covers: ['functional.item9'] },
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 4,
      widthClass: 'nds-w-md',
      ariaLabel: 'Galeria com gesto de arrastar',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    const anterior = () => canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const proximo = () => canvas.getByRole('button', { name: 'Próximo item' });

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
      let ultimo = Number.NaN;
      await waitFor(async () => {
        const agora = deslocamento();
        estaveis = agora === ultimo ? estaveis + 1 : 0;
        ultimo = agora;
        await expect(estaveis).toBeGreaterThanOrEqual(3);
      }, { timeout: 4000 });
      return ultimo;
    };

    /** Espera a posição chegar a uma coordenada já conhecida. */
    const inPosition = async (alvo: number) => {
      await waitFor(async () => {
        await expect(Math.abs(deslocamento() - alvo)).toBeLessThan(2);
      }, { timeout: 4000 });
    };

    // O motor só mede depois que a raiz entra no documento: esperar a seta de
    // avanço acordar é o portão de montagem, não uma folga arbitrária.
    await waitFor(() => expect(proximo()).toBeEnabled(), { timeout: 4000 });

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
      posZero = await settle();
      await expect(anterior()).toBeDisabled();

      await userEvent.click(proximo());
      posUm = await settle();
      await expect(posUm).toBeGreaterThan(posZero);

      await userEvent.click(anterior());
      await inPosition(posZero);
      // A POSIÇÃO chega antes do ESTADO. `inPosition` prova que a rolagem
      // encostou no alvo, mas quem desabilita a seta é a reconciliação do
      // índice, e ela espera de propósito o silêncio do motor — sem isso um
      // gesto com inércia emitiria uma troca de slide por quadro atravessado.
      // Afirmar o botão no mesmo instante mede uma janela em que o componente
      // ainda nem foi avisado de que parou: passa na máquina ociosa e reprova
      // sob carga, que foi como esta reprovou no Angular e no Vanilla.
      await waitFor(async () => {
        await expect(anterior()).toBeDisabled();
      }, { timeout: 4000 });
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
        await expect(anterior()).toBeEnabled();
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
        await expect(anterior()).toBeDisabled();
      }, { timeout: 4000 });
    });
  },
};
