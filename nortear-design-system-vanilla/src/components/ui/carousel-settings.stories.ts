import type { Meta, StoryObj } from '@storybook/html-vite';
import { createCarousel } from './carousel';
import { slidesDeExemplo } from './carousel.fixtures';
import { carouselSource, carouselSourceWith } from './carousel.source';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';

// ─── Slide helpers ────────────────────────────────────────────────────────────


// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Settings',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: carouselSource },
      description: {
        component:
          'Configuracoes do Carousel — um item por vez (padrão), conjuntos longos e avanço automático com parada na primeira interação.',
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
  const trail = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
  return slide.getBoundingClientRect().width / trail.getBoundingClientRect().width;
}

// ─── Um item por vez ──────────────────────────────────────────────────────────

export const Single: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: carouselSourceWith({ slides: 4, ariaLabel: 'Um item por vez' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(createCarousel({ items: slidesDeExemplo(4), label: 'Um item por vez' }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O slide ocupa a largura inteira do recorte', async () => {
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1, 2);
    });

    await step('Há mais slides do que cabem, e a seta de avanço está viva', async () => {
      await expect(canvas.getAllByRole('group').length).toBeGreaterThan(1);
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });
  },
};

// ─── Conjunto longo ───────────────────────────────────────────────────────────

/** Ver a nota em carousel-estados: o motor move o trilho, não o `scrollLeft`. */
function clipVisible(slide: Element, clip: Element): boolean {
  const s = slide.getBoundingClientRect();
  const v = clip.getBoundingClientRect();
  return s.right > v.left + 1 && s.left < v.right - 1 && s.bottom > v.top + 1 && s.top < v.bottom - 1;
}

function clipOf(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
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

export const MultiResponsive: Story = {
  parameters: {
    // `functional.item6` deixou de ser "não aplicável" nesta stack. A base
    // fracionária dependia de o motor MEDIR onde cada slide começa, e o motor
    // antigo assumia que o slide ocupava o recorte inteiro. Com a medição vindo
    // do motor compartilhado, `nds-md-basis-half` passou a valer aqui como vale
    // nas outras quatro, e o item passou a ser verificado em vez de declarado.
    covers: ['functional.item6', 'visual.item3'],
    // Override de story: a base fracionária entra por `slideClass`, que não tem
    // control — a fábrica é quem constrói o slide, então é o único lugar onde
    // quem consome pendura a classe.
    docs: {
      source: {
        transform: carouselSourceWith({
          slides: 6,
          ariaLabel: 'Conjunto longo de slides',
          slideClass: 'nds-md-basis-half nds-lg-basis-third',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-lg';
    wrap.appendChild(
      createCarousel({
        items: slidesDeExemplo(6),
        // A base do slide é responsiva e vem por CLASSE, do mesmo vocabulário
        // que as outras stacks penduram em cada item da composição. Aqui a
        // fábrica é quem constrói o slide, então a classe entra por `slideClass`
        // — divergência de API de framework, não de capacidade.
        slideClass: 'nds-md-basis-half nds-lg-basis-third',
        label: 'Conjunto longo de slides',
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const clip = clipOf(canvasElement);
    // A classe é responsiva por definição: afirmar "um terço" sem consultar a
    // media query amarraria o teste à largura do runner, que nenhum
    // `parameters.viewport` controla aqui.
    const window = canvasElement.ownerDocument.defaultView!;
    const grande = window.matchMedia('(min-width: 1024px)').matches;
    const medio = window.matchMedia('(min-width: 768px)').matches;
    const byScreen = grande ? 3 : medio ? 2 : 1;

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1 / byScreen, 2);
    });

    await step('Vários slides ficam enquadrados ao mesmo tempo', async () => {
      const slides = canvas.getAllByRole('group');
      await expect(slides.length).toBe(6);
      const visiveis = slides.filter((s) => clipVisible(s, clip)).length;
      await expect(visiveis).toBe(byScreen);
    });

    await step('Todos os slides continuam anunciáveis com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      const total = slides.length;
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });

    await step('O conjunto longo não muda o extremo de entrada', async () => {
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });
  },
};

// ─── Autoplay com parada na interação ─────────────────────────────────────────

/**
 * Trocas de slide desta story, com a origem de cada uma.
 *
 * Escopo de MÓDULO, não do `render`: um espião criado lá dentro é inalcançável
 * pela play. É por ele que o passo de parada mede, e não mais pela posição do
 * trilho — com o motor animando quadro a quadro, "o trilho não se moveu" é uma
 * medida com deriva, e ela reprovou este passo por 56px de sobra de uma
 * animação que ainda terminava. O índice não tem esse ruído, e é exatamente o
 * que "não avançou mais" quer dizer.
 */
const aoTrocarSlide = fn();

export const Autoplay: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: {
      source: {
        transform: carouselSourceWith({
          slides: 4,
          ariaLabel: 'Destaques',
          autoplay: true,
          // Sem `autoplayInterval`: os 400ms daqui são velocidade de teste, e
          // um snippet que os ensinasse recomendaria um carrossel que ninguém
          // consegue ler. Sem a opção vale o padrão da fábrica, 3000ms.
          onIndexChange: '(index, origem) => registrar(index, origem)',
        }),
      },
    },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(
      createCarousel({
        items: slidesDeExemplo(4, { prefixo: 'Destaque' }),
        autoplay: true,
        // Intervalo curto para o teste não esperar por três segundos; em uso
        // real a recomendação do conteúdo compartilhado é 3–6s.
        autoplayInterval: 400,
        label: 'Destaques',
        onIndexChange: (index, source) => aoTrocarSlide(index, source),
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const clip = clipOf(canvasElement);

    await step('O carrossel avança sozinho', async () => {
      await waitFor(
        () => expect(aoTrocarSlide).toHaveBeenCalledWith(expect.any(Number), 'autoplay'),
        { timeout: 4000 },
      );
    });

    await step('A primeira interação para o relógio de vez', async () => {
      // `stopOnInteraction`: quem tomou o controle não deve ser atropelado
      // alguns segundos depois. Antes desta rodada a factory REINICIAVA o
      // temporizador na interação, o oposto do que o conteúdo compartilhado
      // documenta.
      //
      // O gesto é um toque na ÁREA DOS SLIDES, não um clique na seta: a
      // posição aqui é conduzida por um temporizador, e quando o relógio para
      // num extremo a seta nasce desabilitada — o `userEvent` recusa o clique e
      // o teste falha por corrida, não por defeito. É também o gesto que as
      // outras stacks reconhecem, onde o motor assina o começo do arraste na
      // área dos slides e nunca vê o clique das setas.
      await userEvent.click(clip);

      // Zera DEPOIS do preparo: o que está sendo medido é o que acontece a
      // partir daqui, e a contagem anterior é do avanço que já foi provado.
      aoTrocarSlide.mockClear();

      // Dois intervalos inteiros sem nenhuma troca de origem 'autoplay'. É
      // também o que deixa a foto do Chromatic e a varredura do axe caírem num
      // componente imóvel — story com temporizador vivo fotografa um slide
      // diferente a cada rodada.
      await new Promise((resolve) => setTimeout(resolve, 900));
      await expect(aoTrocarSlide).not.toHaveBeenCalledWith(expect.any(Number), 'autoplay');
    });
  },
};

/**
 * Gesto de arrastar — o mesmo caminho para o dedo e para o mouse.
 *
 * Este gesto não existia nesta stack: o motor antigo andava de slide inteiro em
 * slide inteiro e o único ouvinte de ponteiro servia para PARAR o avanço
 * automático. Com o motor compartilhado, arrastar passou a mover o trilho
 * continuamente, e o ponteiro atende dedo e mouse pelo mesmo caminho.
 *
 * Clique sintético não serve para verificar isto: um `click` não tem trajeto, e
 * o que está sendo verificado é justamente que o conteúdo ACOMPANHA o trajeto e
 * só depois assenta. Daí a sequência de `userEvent.pointer` em passos, com uma
 * medição NO MEIO do gesto — sem ela, a story provaria apenas que a posição
 * final mudou, o que um clique na seta também faria.
 */
export const DragGesture: Story = {
  parameters: {
    covers: ['functional.item9'],
    docs: { source: { transform: carouselSourceWith({ slides: 4, ariaLabel: 'Galeria com gesto de arrastar' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-md';
    wrap.appendChild(
      createCarousel({ items: slidesDeExemplo(4), label: 'Galeria com gesto de arrastar' }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const clip = clipOf(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>('.nds-carousel-track')!;
    const previous = () => canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const next = () => canvas.getByRole('button', { name: 'Próximo item' });

    // Quanto o trilho já saiu do recorte. O motor move o trilho por
    // `transform`, então `scrollLeft` fica em zero o tempo todo.
    const deslocamento = () =>
      clip.getBoundingClientRect().left - track.getBoundingClientRect().left;
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
    /*
     * O rótulo NÃO é enfeite. Esta story chama `inPosition` de três lugares —
     * volta pela seta, soltura do dedo, soltura do mouse — e a reprovação
     * intermitente só diz a linha do helper, que é a mesma para os três. Sem
     * saber QUAL passo, sobra a distância: 4,1px é resíduo de encaixe e 288px é
     * um slide inteiro, e os dois são defeitos diferentes. Já perdi três
     * medições desta falha por não registrar isso.
     */
    /*
     * Desabilitada nos DOIS idiomas: o React usa a propriedade nativa e o
     * Vanilla escreve `aria-disabled`. Ler só um deles devolvia `null` numa das
     * stacks — diagnóstico que não diagnostica.
     */
    const desligada = (el: Element) => el.matches('[disabled], [aria-disabled="true"]');

    const inPosition = async (target: number, onde: string) => {
      await waitFor(async () => {
        await expect(
          Math.abs(deslocamento() - target),
          `${onde}: posição=${deslocamento()} alvo=${target} setas=[ant:${desligada(previous())} prox:${desligada(next())}]`,
        ).toBeLessThan(2);
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
      await inPosition(posZero, 'volta pela seta');
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

    const box = clip.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const direita = box.left + box.width * 0.85;
    const esquerda = box.left + box.width * 0.15;

    await step('O conteúdo acompanha o DEDO durante o gesto', async () => {
      // Pressiona e anda um pedaço, sem soltar. A medida acontece com o gesto
      // ainda em curso — é isto que separa "arrastou" de "mudou de slide".
      toque(clip, 'touchstart', direita, y);
      toque(clip, 'touchmove', direita - 30, y);
      toque(clip, 'touchmove', direita - 60, y);
      toque(clip, 'touchmove', direita - 90, y);
      await waitFor(async () => {
        await expect(deslocamento()).toBeGreaterThan(posZero + 4);
      }, { timeout: 4000 });
    });

    await step('Ao soltar, para onde a seta pararia', async () => {
      toque(clip, 'touchmove', esquerda, y);
      toque(clip, 'touchend', esquerda, y);

      // Assentou EM UM SLIDE, e no MESMO ponto que a seta alcança — não onde o
      // dedo largou. Um carrossel de rolagem livre pararia no meio, e é isto
      // que este passo reprova.
      await inPosition(posUm, 'soltura do dedo');
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
      mouse(clip, 'mousedown', esquerda, y);
      mouse(clip, 'mousemove', esquerda + 40, y);
      mouse(clip, 'mousemove', esquerda + 80, y);
      // Já andou de volta junto com o cursor, antes de soltar.
      await waitFor(async () => {
        await expect(deslocamento()).toBeLessThan(posUm - 4);
      }, { timeout: 4000 });

      mouse(clip, 'mousemove', direita, y);
      mouse(clip, 'mouseup', direita, y);

      await inPosition(posZero, 'soltura do mouse');
      await waitFor(async () => {
        await expect(previous()).toBeDisabled();
      }, { timeout: 4000 });
    });
  },
};
