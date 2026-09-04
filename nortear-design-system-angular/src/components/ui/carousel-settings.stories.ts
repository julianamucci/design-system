import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'Components/Display/Carousel/Settings',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio, NdsButton] })],
  parameters: { layout: 'centered', controls: { disable: true } },
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

/**
 * Um passo de arraste por PONTEIRO, com o evento que o componente assina.
 *
 * O arraste por mouse desta stack escuta `pointerdown`/`pointermove`/
 * `pointerup` e ignora o que não for ponteiro de mouse — o dedo tem caminho
 * próprio, que é a rolagem nativa. Despachar o evento direto é o que entrega o
 * gesto inteiro: a sequência de `userEvent.pointer` entregava o começo e
 * deixava o trilho parado onde o cursor largou, porque a soltura não chegava ao
 * manipulador.
 *
 * `buttons: 1` enquanto o botão está apertado: é por ele que o arraste sabe
 * que o gesto continua vivo.
 */
/** Um quadro de renderização — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

// ─── Um item por vez ──────────────────────────────────────────────────────────

export const Single: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { slides: [1, 2, 3] },
    template: `
      <nds-carousel class="nds-w-md" label="Um item por vez" slideLabel="Slide {index} de {total}">
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

    await step('O slide ocupa a largura inteira do viewport', async () => {
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(1, 2);
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
      <nds-carousel class="nds-w-lg" label="Conjunto longo de slides" slideLabel="Slide {index} de {total}">
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

    await step('A base do slide acompanha o breakpoint em vigor', async () => {
      // A classe é responsiva por definição: afirmar "metade" sem consultar a
      // media query amarraria o teste à largura do runner, que nenhum
      // `parameters.viewport` controla.
      const window = canvasElement.ownerDocument.defaultView!;
      const grande = window.matchMedia('(min-width: 1024px)').matches;
      const medio = window.matchMedia('(min-width: 768px)').matches;
      const esperado = grande ? 1 / 3 : medio ? 1 / 2 : 1;
      const slide = canvas.getAllByRole('group')[0];
      await expect(baseDoSlide(canvasElement, slide)).toBeCloseTo(esperado, 2);
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
          class="nds-w-md"
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
      await waitFor(
        () => expect(canvas.getByRole('button', { name: 'Retomar apresentação' })).toBeInTheDocument(),
        { timeout: 4000 },
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
      // depois de dois intervalos inteiros de autoplay (400ms cada) terem
      // passado.
      //
      // A referência é lida DEPOIS de uma espera de relógio, e não por um laço
      // que tenta detectar "assentou". O laço anterior contava quatro leituras
      // iguais dentro de um `waitFor`, e quatro leituras iguais NÃO são quatro
      // instantes separados: o `waitFor` reagenda por conta própria, então com
      // a máquina carregada — três suítes de navegador ao mesmo tempo, que é
      // como esta stack é medida — a thread congela, as quatro sondas rodam em
      // sequência sobre o MESMO quadro e a espera declara "assentou" com uma
      // rolagem suave ainda pendente do último tique de antes da pausa.
      //
      // Foi exatamente isso que reprovou: referência lida em 237, viewport
      // terminando em 928 (três slides adiante) com o relógio já parado. O
      // defeito não era do carrossel — era a referência ter sido tirada no meio
      // do voo.
      //
      // Esperar antes de medir resolve porque a espera é de relógio: se a
      // thread travar, o próprio temporizador atrasa junto, e quando ele acorda
      // a rolagem pendente já aterrissou. Os dentes ficam: com o relógio ainda
      // ligado, a segunda espera veria dois tiques.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const parado = viewport.scrollLeft;

      await new Promise((resolve) => setTimeout(resolve, 900));
      await expect(viewport.scrollLeft).toBe(parado);
    });
  },
};

// ─── Gesto de arrastar ────────────────────────────────────────────────────────

/**
 * Gesto de arrastar, nas duas metades — e elas são MECANISMOS DIFERENTES aqui.
 *
 * Esta stack não move o trilho por `transform`: quem desliza é o próprio
 * recorte, e a posição mora no `scrollLeft`. Isso divide o gesto em dois:
 *
 *   • O TOQUE é rolagem nativa. Não há código próprio no caminho — o que
 *     faltava era o recorte estar liberado, e é isso que o primeiro passo
 *     verifica. Um evento de toque SINTÉTICO não produz rolagem nativa em
 *     navegador nenhum (a rolagem por gesto acontece na thread do compositor,
 *     fora do alcance de eventos despachados por script), então "arrastar com o
 *     dedo" não é encenável aqui como é nas stacks de `transform`. O que É
 *     verificável, e está verificado: que o recorte rola de fato, que o gesto
 *     tem onde parar, e que a posição de rolagem — que é tudo o que o dedo
 *     produz — reconcilia o estado do componente.
 *   • O MOUSE é arraste escrito à mão, porque arrastar com o mouse não é gesto
 *     de rolagem em navegador nenhum. Esse sim é encenável de ponta a ponta, e
 *     é o que o último passo faz com `userEvent.pointer`.
 */
export const DragGesture: Story = {
  parameters: { covers: ['functional.item9'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4] },
    template: `
      <nds-carousel class="nds-w-md" label="Galeria com gesto de arrastar" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (i of slides; track i) {
            <div ndsCarouselItem>
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
    const previous = () =>
      canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;
    const next = () =>
      canvas.getByRole('button', { name: 'Próximo item' }) as HTMLButtonElement;
    const slides = () => canvas.getAllByRole('group') as HTMLElement[];

    /**
     * Espera a rolagem PARAR de verdade: quatro leituras seguidas dentro de
     * meio pixel. Duas não bastam — a rolagem suave desacelera até encostar, e
     * no fim da curva ela anda menos de meio pixel entre duas leituras
     * enquanto ainda falta caminho.
     */
    const settle = async () => {
      let estaveis = 0;
      let last = Number.NaN;
      await waitFor(async () => {
        const agora = viewport.scrollLeft;
        estaveis = Math.abs(agora - last) < 0.5 ? estaveis + 1 : 0;
        last = agora;
        await expect(estaveis).toBeGreaterThanOrEqual(3);
      }, { timeout: 4000 });
      return last;
    };

    /** Espera a rolagem chegar a uma coordenada já conhecida. */
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
          Math.abs(viewport.scrollLeft - target),
          `${onde}: posição=${viewport.scrollLeft} alvo=${target} setas=[ant:${desligada(previous())} prox:${desligada(next())}]`,
        ).toBeLessThan(2);
      }, { timeout: 4000 });
    };

    // ── A RÉGUA ───────────────────────────────────────────────────────────────
    //
    // As posições que as SETAS alcançam. É contra elas que o gesto é medido, e
    // não contra uma conta de `índice x largura`: o trilho compensa o respiro
    // do slide com margem negativa e a rolagem é contida no fim, então a conta
    // crua erra justamente nos extremos. Medir contra as setas é também o que o
    // contrato promete — que o gesto pare onde a seta pararia.
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
      // encostou em zero, mas quem desabilita a seta é a reconciliação do
      // índice, e ela espera de propósito o silêncio de 120ms — sem isso um
      // gesto com inércia emitiria uma troca de slide por quadro atravessado.
      // Afirmar o botão no mesmo instante mede uma janela onde o componente
      // ainda nem foi avisado de que parou.
      await waitFor(async () => {
        await expect(previous()).toBeDisabled();
      }, { timeout: 4000 });
    });

    await step('O recorte está LIBERADO para o gesto, com onde parar', async () => {
      // Era exatamente isto que faltava: a rolagem sempre esteve aqui, e o
      // recorte cego (`overflow: hidden`) a deixava alcançável só por script.
      // Um recorte que não rola não tem gesto de toque nenhum — nem que o
      // componente inteiro esteja correto.
      const estilo = getComputedStyle(viewport);
      await expect(['auto', 'scroll']).toContain(estilo.overflowX);
      // E o gesto para em slide, não em qualquer pixel.
      await expect(estilo.scrollSnapType).toContain('x');
      // Rolável de verdade: há mais trilho do que recorte.
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth + 1);
      // E alcançável por teclado — região rolável sem foco deixa quem não usa
      // mouse sem acesso ao que está fora da vista (WCAG 2.1.1).
      await expect(viewport).toHaveAttribute('tabindex', '0');
    });

    await step('A posição de rolagem reconcilia o estado do componente', async () => {
      // É tudo o que um dedo produz: ele move a rolagem e solta. A partir daí
      // quem tem de se ajustar é o componente — e antes desta rodada ele não se
      // ajustava, porque nada olhava para a rolagem.
      //
      // O TOQUE em si não é encenável aqui: a rolagem por gesto acontece na
      // thread do compositor, fora do alcance de qualquer evento despachado por
      // script. O que o dedo deixa para trás é esta posição, e é ela que o
      // componente precisa ler.
      viewport.scrollLeft = posUm;
      // Prazo explícito, como em toda outra espera deste arquivo. A rolagem
      // programática só vira `scroll` no quadro seguinte, e o componente espera
      // o SILÊNCIO de 120ms antes de reconciliar o índice — de propósito, para
      // um gesto com inércia não emitir uma troca de slide por quadro. Somando
      // a detecção de mudança e o novo render, o padrão de 1s da testing-library
      // fica no limite: passa na máquina ociosa e reprova sob carga, que foi
      // como esta reprovou uma vez em três rodadas.
      await waitFor(() => expect(previous()).toBeEnabled(), { timeout: 4000 });
    });

    const box = viewport.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const direita = box.left + box.width * 0.85;
    const esquerda = box.left + box.width * 0.15;

    await step('O arraste por MOUSE move o conteúdo junto com o ponteiro', async () => {
      await userEvent.click(previous());
      await inPosition(posZero, 'início do arraste por mouse');

      // Eventos de ponteiro despachados direto, e não por `userEvent.pointer`:
      // o arraste por mouse desta stack assina `pointerdown`/`pointermove`/
      // `pointerup` e distingue o tipo de ponteiro, e o caminho direto é o que
      // entrega o gesto inteiro — incluindo o fim dele.
      // Um quadro entre os passos, como num gesto de verdade. Não é folga: ao
      // começar o arraste o componente marca o recorte para o CSS suspender o
      // ponto de parada, e essa marca só chega ao DOM no próximo ciclo de
      // renderização. Despachando tudo no mesmo instante, a marca ainda não
      // valia e cada posição escrita era puxada de volta ao ponto de parada —
      // a rolagem media zero, que foi o que reprovou este passo.
      pointer(viewport, 'pointerdown', direita, y);
      await nextFrame();
      pointer(viewport, 'pointermove', direita - 40, y);
      await nextFrame();
      pointer(viewport, 'pointermove', direita - 80, y);
      // Medida com o gesto AINDA EM CURSO — é isto que separa "arrastou" de
      // "mudou de slide".
      await waitFor(async () => {
        await expect(viewport.scrollLeft).toBeGreaterThan(posZero + 4);
      }, { timeout: 4000 });
    });

    await step('Ao soltar, para onde a seta pararia', async () => {
      pointer(viewport, 'pointermove', esquerda, y);
      await nextFrame();
      pointer(viewport, 'pointerup', esquerda, y);

      // Assentou EM UM SLIDE, e no MESMO ponto que a seta alcança — não onde o
      // cursor largou. Um carrossel de rolagem livre pararia no meio.
      await inPosition(posUm, 'soltura do mouse');
      await waitFor(async () => {
        await expect(previous()).toBeEnabled();
      }, { timeout: 4000 });
    });

    await step('E a story termina no primeiro slide', async () => {
      // O Chromatic fotografa o quadro final e o axe varre a partir dele.
      await userEvent.click(previous());
      await inPosition(posZero, 'fim da story');
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
  },
};
