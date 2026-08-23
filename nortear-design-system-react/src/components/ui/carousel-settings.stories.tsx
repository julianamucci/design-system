import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor, within, expect } from "storybook/test";
import AutoplayPlugin from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./carousel";
import { SlideCard, viewportVisible } from "./carousel.fixtures";
import {
  carouselAutoplaySource,
  carouselItemUnicoSource,
  carouselSource,
  carouselMultipleItemsSource,
} from "./carousel.source";

const meta = {
  title: "UI/Carousel/Settings",
  tags: ["display"],
  component: Carousel,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: carouselSource },
      description: {
        component:
          "Configuracoes funcionais do Carousel: item único, múltiplos itens responsivos e autoplay via plugin.",
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
  const trail = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;
  return slide.getBoundingClientRect().width / trail.getBoundingClientRect().width;
}

function viewportDe(canvasElement: HTMLElement): HTMLElement {
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
  alvo: HTMLElement,
  tipo: "touchstart" | "touchmove" | "touchend",
  x: number,
  y: number
): void {
  const dedo = new Touch({ identifier: 1, target: alvo, clientX: x, clientY: y });
  const soltou = tipo === "touchend";
  alvo.dispatchEvent(
    new TouchEvent(tipo, {
      touches: soltou ? [] : [dedo],
      targetTouches: soltou ? [] : [dedo],
      changedTouches: [dedo],
      bubbles: true,
      cancelable: true,
    })
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
  tipo: "mousedown" | "mousemove" | "mouseup",
  x: number,
  y: number,
): void {
  alvo.dispatchEvent(
    new MouseEvent(tipo, {
      clientX: x,
      clientY: y,
      button: 0,
      buttons: tipo === "mouseup" ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

export const Single: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // A base de largura mora no ITEM, e é ela que faz um slide por vez —
      // nenhum arg do carrossel descreve essa escolha.
      source: { transform: carouselItemUnicoSource },
      description: {
        story: "Um item por vez: cada slide ocupa a largura inteira do viewport.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-md" aria-label="Um item por vez">
      <CarouselContent>
        {Array.from({ length: 3 }).map((_, i) => (
          <CarouselItem key={i} className="nds-basis-full">
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = viewportDe(canvasElement);

    await step("O slide ocupa a largura inteira do viewport", async () => {
      const slide = canvas.getAllByRole("group")[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1, 2);
    });

    await step("Só um slide cabe de cada vez, e ainda há para onde ir", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBeGreaterThan(1);
      await expect(viewportVisible(slides[1], viewport)).toBe(false);
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeEnabled();
      }, { timeout: 4000 });
    });
  },
};

export const MultiResponsive: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item3"],
    docs: {
      // A responsividade é um par de classes de base no item; o snippet do meta
      // esconderia justamente o que muda por breakpoint.
      source: { transform: carouselMultipleItemsSource },
      description: {
        story:
          "A base do slide muda por breakpoint: um item em telas estreitas, dois em médias, três em largas.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-lg" aria-label="Conjunto longo de slides">
      <CarouselContent>
        {Array.from({ length: 6 }).map((_, i) => (
          <CarouselItem key={i} className="nds-md-basis-half nds-lg-basis-third">
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = viewportDe(canvasElement);
    // A classe é responsiva por definição: afirmar "um terço" sem consultar a
    // media query amarraria o teste à largura do runner, que nenhum
    // `parameters.viewport` controla aqui.
    const window = canvasElement.ownerDocument.defaultView!;
    const grande = window.matchMedia("(min-width: 1024px)").matches;
    const medio = window.matchMedia("(min-width: 768px)").matches;
    const byScreen = grande ? 3 : medio ? 2 : 1;

    await step("A base do slide acompanha o breakpoint em vigor", async () => {
      const slide = canvas.getAllByRole("group")[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1 / byScreen, 2);
    });

    await step("Vários slides ficam enquadrados ao mesmo tempo", async () => {
      const slides = canvas.getAllByRole("group");
      await expect(slides.length).toBe(6);
      const visiveis = slides.filter((s) => viewportVisible(s, viewport)).length;
      await expect(visiveis).toBe(byScreen);
    });

    await step("Todos os slides continuam anunciáveis", async () => {
      for (const slide of canvas.getAllByRole("group")) {
        await expect(slide).toHaveAttribute("aria-roledescription", "slide");
      }
    });
  },
};

/**
 * Instância do Embla desta story, capturada por `setApi`.
 *
 * É por ela que o play religa o relógio antes de medir: o replay do painel
 * Interactions roda no MESMO DOM, e sem a precondição a segunda rodada
 * começaria do estado parado que a primeira deixou.
 */
let autoplayApi: CarouselApi;

export const Autoplay: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item3"],
    docs: {
      // O avanço automático vem de um plugin do motor e de `opts`, não de uma
      // prop do componente: sem o snippet próprio a lição inteira se perderia.
      source: { transform: carouselAutoplaySource },
      description: {
        story:
          "O plugin avança sozinho a cada intervalo e cede o controle na primeira interação com o carrossel.",
      },
    },
  },
  render: () => (
    <Carousel
      className="nds-w-md"
      aria-label="Destaques"
      opts={{ loop: true }}
      setApi={(api) => {
        autoplayApi = api;
      }}
      plugins={[AutoplayPlugin({ delay: 400, stopOnInteraction: true })]}
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = viewportDe(canvasElement);
    // O `!` é intencional: enquanto o Embla não tiver montado, a chamada lança
    // e o `waitFor` do passo de precondição repete até a instância existir.
    const relogio = () => autoplayApi!.plugins().autoplay;
    const position = () => {
      const slide = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-item"]')!;
      return slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
    };

    await step("Os slides estão montados e a navegação manual segue disponível", async () => {
      // Com repetição ligada as setas nunca desabilitam: o avanço automático
      // não é o único caminho, que é o que a WCAG 2.2.2 pede.
      await expect(canvas.getAllByRole("group")).toHaveLength(5);
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: /próximo item/i })).toBeEnabled();
      }, { timeout: 4000 });
      // A POSIÇÃO chega antes do ESTADO: a rolagem encostou no alvo, mas quem
      // muda o controle é a reconciliação do índice, adiada até o motor silenciar.
      await waitFor(async () => {
        await expect(canvas.getByRole("button", { name: /item anterior/i })).toBeEnabled();
      }, { timeout: 4000 });
    });

    await step("Precondição: o relógio do avanço automático está ligado", async () => {
      await waitFor(async () => {
        await expect(relogio()).toBeDefined();
      }, { timeout: 4000 });
      // `play()` aqui é o método do plugin de autoplay do Embla, não o play de
      // outra story — a regra do lint casa pelo nome e não sabe distinguir.
      // eslint-disable-next-line storybook/context-in-play-function
      if (!relogio().isPlaying()) relogio().play();
      await expect(relogio().isPlaying()).toBe(true);
    });

    await step("O carrossel avança sozinho, sem ninguém tocar nele", async () => {
      const antes = position();
      // Geometria, não `scrollLeft`: o Embla desloca o trilho por `transform`.
      await waitFor(() => expect(position()).not.toBe(antes), { timeout: 4000 });
    });

    await step("Interagir com o carrossel entrega o controle a quem interagiu", async () => {
      // `stopOnInteraction` escuta o evento `pointerDown` do Embla, que nasce do
      // mousedown no viewport arrastável. Clicar na SETA não passa por ali — é
      // navegação programática, e o relógio continuaria correndo.
      await userEvent.click(viewport);
      await waitFor(async () => {
        await expect(relogio().isPlaying()).toBe(false);
      }, { timeout: 4000 });
    });

    await step("E a story termina parada, para a captura e para o axe", async () => {
      // Estado observável, não só a bandeira do plugin: passado mais de um
      // intervalo inteiro de autoplay, o carrossel continua no MESMO slide.
      //
      // O índice, e não a caixa do primeiro slide. Com repetição ligada o Embla
      // reposiciona slides individualmente para montar a ilusão do laço, então
      // a caixa se mexe alguns pixels sem ninguém ter avançado nada — foram os
      // 5px de deriva que reprovaram este passo duas vezes. O índice não tem
      // esse ruído, e é exatamente o que "não avançou" quer dizer.
      const antes = autoplayApi!.selectedScrollSnap();
      await new Promise((resolve) => setTimeout(resolve, 1400));   // 3,5x o delay
      await expect(autoplayApi!.selectedScrollSnap()).toBe(antes);
      await expect(relogio().isPlaying()).toBe(false);
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
    covers: ["functional.item9"],
    docs: {
      description: {
        story:
          "Arrastar a área dos slides move o conteúdo junto com o ponteiro e assenta no slide mais próximo ao soltar.",
      },
    },
  },
  render: () => (
    <Carousel className="nds-w-md" aria-label="Galeria com gesto de arrastar">
      <CarouselContent>
        {Array.from({ length: 4 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideCard label={`Slide ${i + 1}`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Item anterior" />
      <CarouselNext aria-label="Próximo item" />
    </Carousel>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = viewportDe(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>(".nds-carousel-track")!;
    const previous = () => canvas.getByRole("button", { name: "Item anterior" }) as HTMLButtonElement;
    const next = () => canvas.getByRole("button", { name: "Próximo item" });

    // Quanto o trilho já saiu do recorte. O motor move o trilho por
    // `transform`, então `scrollLeft` fica em zero o tempo todo.
    const deslocamento = () =>
      viewport.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const slides = () => canvas.getAllByRole("group") as HTMLElement[];

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

    const inPosition = async (alvo: number, onde: string) => {
      await waitFor(async () => {
        await expect(
          Math.abs(deslocamento() - alvo),
          `${onde}: posição=${deslocamento()} alvo=${alvo} setas=[ant:${desligada(previous())} prox:${desligada(next())}]`,
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

    await step("Precondição: a régua sai das próprias setas", async () => {
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

    const caixa = viewport.getBoundingClientRect();
    const y = caixa.top + caixa.height / 2;
    const direita = caixa.left + caixa.width * 0.85;
    const esquerda = caixa.left + caixa.width * 0.15;

    await step("O conteúdo acompanha o DEDO durante o gesto", async () => {
      // Pressiona e anda um pedaço, sem soltar. A medida acontece com o gesto
      // ainda em curso — é isto que separa "arrastou" de "mudou de slide".
      toque(viewport, "touchstart", direita, y);
      toque(viewport, "touchmove", direita - 30, y);
      toque(viewport, "touchmove", direita - 60, y);
      toque(viewport, "touchmove", direita - 90, y);
      await waitFor(async () => {
        await expect(deslocamento()).toBeGreaterThan(posZero + 4);
      }, { timeout: 4000 });
    });

    await step("Ao soltar, para onde a seta pararia", async () => {
      toque(viewport, "touchmove", esquerda, y);
      toque(viewport, "touchend", esquerda, y);

      // Assentou EM UM SLIDE, e no MESMO ponto que a seta alcança — não onde o
      // dedo largou. Um carrossel de rolagem livre pararia no meio, e é isto
      // que este passo reprova.
      await inPosition(posUm, 'soltura do dedo');
      await waitFor(async () => {
        await expect(previous()).toBeEnabled();
      }, { timeout: 4000 });
    });

    await step("O MOUSE percorre o mesmo caminho, de volta ao primeiro slide", async () => {
      // Mesma engrenagem, outro conjunto de eventos: o motor trata arraste de
      // mouse e de dedo no mesmo manipulador, e o que muda é só por onde as
      // coordenadas chegam. Os eventos são despachados direto, pelo mesmo
      // motivo do gesto de dedo: é o que o motor escuta.
      //
      // O arraste é para a DIREITA, então volta um slide: a story termina no
      // estado inicial, que é o que o Chromatic fotografa e o replay do painel
      // Interactions reencontra.
      mouse(viewport, "mousedown", esquerda, y);
      mouse(viewport, "mousemove", esquerda + 40, y);
      mouse(viewport, "mousemove", esquerda + 80, y);
      // Já andou de volta junto com o cursor, antes de soltar.
      await waitFor(async () => {
        await expect(deslocamento()).toBeLessThan(posUm - 4);
      }, { timeout: 4000 });

      mouse(viewport, "mousemove", direita, y);
      mouse(viewport, "mouseup", direita, y);

      await inPosition(posZero, 'soltura do mouse');
      await waitFor(async () => {
        await expect(previous()).toBeDisabled();
      }, { timeout: 4000 });
    });
  },
};
