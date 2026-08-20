// ─── Carousel — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-carousel-* (standalone).
// Comportamento: gesto de arrastar (dedo e mouse) + setas + setas do teclado +
// autoplay opcional (pausa no hover, para de vez na primeira interação de quem
// lê).
//
// ── O motor ──────────────────────────────────────────────────────────────────
//
// O deslize é do `embla-carousel` (core, agnóstico de framework), o mesmo motor
// das stacks que rodam React, Vue e Svelte — lá pelos pacotes `-react`, `-vue` e
// `-svelte`, que são casca fina sobre este mesmo núcleo. Antes daqui a fábrica
// escrevia `track.style.transform = -index * 100%` a cada clique, e isso custava
// duas coisas que não davam para contornar por story:
//
//   • NÃO havia gesto. Um passo de 100% do track só sabe ir de slide inteiro em
//     slide inteiro; arrastar exige posição contínua, com atrito, inércia e
//     volta ao ponto de parada mais próximo.
//   • NÃO havia base fracionária. Mostrar 2 ou 3 slides por vez depende de o
//     motor MEDIR onde cada slide começa; um deslocamento de 100% do track
//     assume que o slide ocupa o recorte inteiro, e por isso `nds-md-basis-half`
//     não tinha como valer aqui. Era o item do contrato que esta stack declarava
//     como não aplicável.
//
// O Embla resolve os dois com o mesmo mecanismo: ele mede os slides reais. A
// árvore e as classes `.nds-*` continuam EXATAMENTE as mesmas — o motor troca o
// que move o track, não o que o DOM é.

import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel';
import { cn } from '@/lib/utils';
import { btnClass } from '@/components/ui/button';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { prefersReducedMotion } from '@/lib/motion';
import { marcarSlideAtual } from '@shared/primitives/carousel-active-slide';
import DOMPurify from 'dompurify';

// ─── Types ────────────────────────────────────────────────────────────────────

// PATCH: api — origem da navegação exposta para analytics (ver PATCHES.md#vanilla-carousel-nav-source)
// 'init' é o posicionamento inicial no mount — consumidores normalmente o ignoram.
// 'swipe' é o gesto de arrastar, que não existia antes de o motor mudar. O nome
// é o do catálogo tipado de analytics (`slide_change.trigger`), e não um sinônimo
// novo: fonte de navegação e evento medido falam o mesmo vocabulário.
export type CarouselNavSource = 'init' | 'button' | 'keyboard' | 'autoplay' | 'swipe';

export type CarouselOrientation = 'horizontal' | 'vertical';

export type CarouselOptions = {
  items: HTMLElement[];
  /** Eixo do deslize. Em vertical o viewport precisa de altura definida via `contentClass`. */
  orientation?: CarouselOrientation;
  autoplay?: boolean;
  autoplayInterval?: number;
  // PATCH: api — origem da navegação exposta para analytics (ver PATCHES.md#vanilla-carousel-nav-source)
  onIndexChange?: (index: number, source: CarouselNavSource) => void;
  class?: string;
  /** Classes do recorte — é onde mora a altura definida do carrossel vertical. */
  contentClass?: string;
  /**
   * Classes aplicadas a CADA slide. É por aqui que passa a base fracionária:
   * `nds-md-basis-half nds-lg-basis-third` faz caber 2 slides a partir de
   * tablet e 3 a partir de desktop, exatamente como as outras stacks fazem
   * classificando cada item da composição. A fábrica constrói os slides, então
   * quem consome não tem outro lugar onde pendurar a classe.
   */
  slideClass?: string;
  /** Nome acessível da região. Sem ele o leitor anuncia "carrossel" sem dizer de quê. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /** Rótulo de cada slide. `{index}` e `{total}` são substituídos. */
  slideLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
};

// ─── SVGs ─────────────────────────────────────────────────────────────────────

const CHEVRON_LEFT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const CHEVRON_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// ─── createCarousel ───────────────────────────────────────────────────────────

export function createCarousel(options: CarouselOptions): DestroyableElement {
  const {
    items,
    orientation = 'horizontal',
    autoplay = false,
    autoplayInterval = 3000,
    onIndexChange,
    slideClass,
    slideLabel = 'Slide {index} de {total}',
    previousLabel = 'Item anterior',
    nextLabel = 'Próximo item',
  } = options;

  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const label = options['aria-label'] ?? options.label ?? 'Carrossel';

  const vertical = orientation === 'vertical';
  let currentIndex = 0;
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;
  // Separado de `autoplay`: o hover só SUSPENDE o relógio, a interação de quem
  // lê o DESLIGA. Sem os dois estados, sair do hover ressuscitaria um autoplay
  // que a pessoa já tinha interrompido de propósito.
  let autoplayLigado = autoplay;

  const root = document.createElement('div');
  root.dataset.slot = 'carousel';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', label);
  // `tabindex` é o que torna a navegação por teclado alcançável sem passar
  // pelas setas: WCAG 2.1.1 pede equivalente de teclado, e o listener de
  // `keydown` abaixo só recebe evento se o foco puder cair aqui dentro.
  root.tabIndex = 0;
  root.className = cn('nds-carousel', options.class);

  // Overflow wrapper — é o RECORTE, e é ele que o motor recebe: o Embla mede a
  // caixa deste nó e move o primeiro filho dele.
  //
  // `contentClass` cai aqui, que é o único nó da árvore com largura definida —
  // e é de largura definida que uma proporção tira altura. No track a conta não
  // fecha: a altura do recorte viria do track e a do track da proporção dele
  // próprio, um ciclo que o layout resolve caindo no conteúdo. Com a altura no
  // recorte, `.nds-carousel-track[data-orientation="vertical"]` a herda por
  // `height: 100%`, e aí sim a base `flex: 0 0 100%` do slide tem contra o que
  // resolver.
  const overflow = document.createElement('div');
  overflow.className = cn('nds-carousel-overflow', options.contentClass);
  // As outras quatro stacks marcam o recorte com este `data-slot`; esta não
  // marcava, e por isso todo seletor de sonda e de story precisava de uma forma
  // só para cá. A marca não muda um pixel — só torna o recorte alcançável pelo
  // mesmo seletor nas cinco.
  overflow.dataset.slot = 'carousel-content';

  // Track
  const track = document.createElement('div');
  track.className = 'nds-carousel-track';
  track.dataset.slot = 'carousel-track';
  // Sempre escrito, nos dois eixos. O seletor `[data-orientation="horizontal"]`
  // do CSS compartilhado traz a margem negativa que encosta o primeiro slide na
  // borda; enquanto ela não era escrita aqui, esta stack começava 16px para
  // dentro das outras quatro. A dona decidiu alinhar (2026-08-19).
  track.dataset.orientation = vertical ? 'vertical' : 'horizontal';

  items.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = cn('nds-carousel-slide', slideClass);
    slide.dataset.slot = 'carousel-item';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute(
      'aria-label',
      slideLabel.replace('{index}', String(i + 1)).replace('{total}', String(items.length)),
    );
    if (vertical) slide.dataset.orientation = 'vertical';
    slide.appendChild(item);
    track.appendChild(slide);
  });

  overflow.appendChild(track);
  root.appendChild(overflow);

  // Navigation buttons
  //
  // ── A FAMÍLIA DE CLASSE É UMA SÓ ───────────────────────────────────────────
  //
  // Estes controles usavam `.nds-carousel-button`, uma segunda família que
  // redeclarava à mão a caixa, a cor, a borda, o foco e o desabilitado de um
  // botão de ícone `outline` — enquanto as outras quatro stacks compunham
  // `.nds-button` sob `.nds-carousel-arrow`. Duas famílias para o mesmo
  // controle é uma segunda cópia do CSS do botão, e cópia envelhece: a que
  // ficava aqui já não tinha a superfície elevada do modo escuro, nem
  // `touch-action`, nem o anel de foco opaco que o botão ganhou por WCAG
  // 1.4.11. Nada disso aparecia, porque as duas rendem um círculo com um
  // chevron dentro.
  //
  // A direção da unificação não foi decidida por maioria — o conteúdo
  // compartilhado descreve estes controles como "Button de navegação (variante
  // outline)" e documenta o raio deles como `--radius-button`. Compor é cumprir
  // o que está escrito. É a exceção declarada da regra de que esta stack é a
  // referência: ela vale para markup e comportamento, não para uma cópia
  // privada de um primitivo que o design system já define num lugar só.
  //
  // `data-orientation` agora é SEMPRE escrito, inclusive `"horizontal"`. As
  // regras de posição do controle são seletores de atributo com valor, e sem o
  // valor escrito o controle ficaria sem posição nenhuma no eixo horizontal.
  const orientacao = vertical ? 'vertical' : 'horizontal';
  const classeDaSeta = (direcao: 'prev' | 'next') =>
    cn(btnClass('outline', 'icon-sm'), 'nds-carousel-arrow', `nds-carousel-arrow-${direcao}`);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = classeDaSeta('prev');
  prevBtn.dataset.slot = 'carousel-previous';
  prevBtn.dataset.orientation = orientacao;
  prevBtn.setAttribute('aria-label', previousLabel);
  prevBtn.setAttribute('aria-disabled', 'true');
  prevBtn.disabled = true;
  prevBtn.innerHTML = DOMPurify.sanitize(CHEVRON_LEFT);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = classeDaSeta('next');
  nextBtn.dataset.slot = 'carousel-next';
  nextBtn.dataset.orientation = orientacao;
  nextBtn.setAttribute('aria-label', nextLabel);
  // Nasce vivo quando há para onde ir. Estado SÍNCRONO: o motor só mede depois
  // que a raiz entra no documento, e sem isto a seta apareceria apagada no
  // primeiro quadro de toda story.
  const podeAvancarNoInicio = items.length > 1;
  nextBtn.setAttribute('aria-disabled', podeAvancarNoInicio ? 'false' : 'true');
  nextBtn.disabled = !podeAvancarNoInicio;
  nextBtn.innerHTML = DOMPurify.sanitize(CHEVRON_RIGHT);

  root.appendChild(prevBtn);
  root.appendChild(nextBtn);

  // ── Motor ───────────────────────────────────────────────────────────────────

  let embla: EmblaCarouselType | null = null;
  // O gesto é reconhecido pelo motor, que avisa `pointerDown` antes de avisar a
  // troca. A bandeira é o que permite dizer de ONDE veio a mudança sem inventar
  // um segundo detector de arraste ao lado do que o motor já tem.
  let veioDeGesto = false;

  function sincronizarSetas(): void {
    const podePrev = embla ? embla.canScrollPrev() : false;
    const podeNext = embla ? embla.canScrollNext() : podeAvancarNoInicio;
    prevBtn.setAttribute('aria-disabled', podePrev ? 'false' : 'true');
    prevBtn.toggleAttribute('disabled', !podePrev);
    nextBtn.setAttribute('aria-disabled', podeNext ? 'false' : 'true');
    nextBtn.toggleAttribute('disabled', !podeNext);
    // O estado do slide atual anda junto com o das setas: os dois saem da mesma
    // pergunta ao motor, e separá-los abriria a janela em que a seta já sabe
    // que andou e a escala ainda não.
    if (embla) marcarSlideAtual(embla.slideNodes(), embla.selectedScrollSnap());
  }

  // A origem é declarada por quem MANDA o motor andar, e lida quando ele avisa
  // que andou — o Embla não carrega essa informação no evento.
  let origemPendente: CarouselNavSource = 'button';

  function aoSelecionar(): void {
    if (!embla) return;
    currentIndex = embla.selectedScrollSnap();
    sincronizarSetas();
    onIndexChange?.(currentIndex, veioDeGesto ? 'swipe' : origemPendente);
    veioDeGesto = false;
    origemPendente = 'button';
  }

  function mover(alvo: 'prev' | 'next', source: CarouselNavSource): void {
    origemPendente = source;
    // O motor é montado quando a raiz entra no documento, e isso acontece um
    // quadro depois de a fábrica devolver o nó. Quem clica ANTES desse quadro
    // teria o comando engolido em silêncio — e engolido de verdade: foi uma
    // reprovação intermitente, com o carrossel parando um slide antes do fim
    // porque o primeiro clique se perdeu. Montar sob demanda fecha a janela:
    // se há um comando, a raiz já está na página.
    if (!embla) iniciarMotor();
    if (!embla) return;
    if (alvo === 'next') {
      // O avanço automático dá a volta; a navegação de quem usa respeita os
      // extremos. Sem essa distinção o teclado atravessava o fim do trilho e
      // voltava ao primeiro slide enquanto a seta ao lado estava desabilitada
      // dizendo que não dava — as duas metades do mesmo componente discordando.
      if (embla.canScrollNext()) embla.scrollNext();
      else if (source === 'autoplay') embla.scrollTo(0);
    } else if (embla.canScrollPrev()) {
      embla.scrollPrev();
    }
  }

  /**
   * O motor só mede depois que a raiz está no documento.
   *
   * A fábrica devolve um nó SOLTO — quem consome o insere depois. Um Embla
   * iniciado sobre um nó desanexado mede zero em tudo, conclui que não há para
   * onde rolar e nasce travado, sem erro nenhum no console. Por isso a
   * inicialização espera a conexão em vez de acontecer no corpo da fábrica.
   */
  let quadro: number | null = null;

  function iniciarMotor(): void {
    if (embla || !root.isConnected) return;
    embla = EmblaCarousel(overflow, {
      axis: vertical ? 'y' : 'x',
      // Duração do deslize EM UNIDADES DO MOTOR. Zerada sob movimento reduzido:
      // nenhuma media query alcança uma animação escrita em JS, e o track deixou
      // de ter transição de CSS justamente porque ela atrapalhava o gesto.
      duration: prefersReducedMotion() ? 0 : 25,
    });
    embla.on('select', aoSelecionar);
    embla.on('reInit', sincronizarSetas);
    embla.on('pointerDown', () => {
      veioDeGesto = true;
    });
    // Um toque que não arrasta nada (um clique seco na área dos slides) marca a
    // bandeira e nunca chega a um `select` que a limpe. Sem esta baixa, a
    // PRÓXIMA troca — vinda de uma seta ou do teclado — seria relatada como
    // gesto. `settle` é o fim do movimento, e vem sempre depois de `select`.
    embla.on('settle', () => {
      veioDeGesto = false;
    });
    sincronizarSetas();
  }

  function aguardarConexao(): void {
    if (embla) return;
    if (root.isConnected) {
      iniciarMotor();
      return;
    }
    quadro = requestAnimationFrame(aguardarConexao);
  }

  aguardarConexao();

  // ── Autoplay ────────────────────────────────────────────────────────────────
  //
  // Três verbos, e a diferença entre eles é o contrato: `suspender` é o hover,
  // reversível; `parar` é a interação de quem lê, definitiva. É o
  // `stopOnInteraction` que o conteúdo compartilhado documenta — antes daqui, a
  // interação REINICIAVA o relógio, então quem clicava para ler um slide era
  // atropelado alguns segundos depois.

  function suspenderAutoplay(): void {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function iniciarAutoplay(): void {
    if (!autoplayLigado || autoplayTimer) return;
    autoplayTimer = setInterval(() => mover('next', 'autoplay'), autoplayInterval);
  }

  function pararAutoplay(): void {
    autoplayLigado = false;
    suspenderAutoplay();
  }

  prevBtn.addEventListener('click', () => {
    mover('prev', 'button');
    pararAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    mover('next', 'button');
    pararAutoplay();
  });

  // Keyboard navigation — o par de teclas acompanha o eixo: quem lê uma pilha
  // de cima para baixo não procura ArrowLeft.
  const teclaVoltar = vertical ? 'ArrowUp' : 'ArrowLeft';
  const teclaAvancar = vertical ? 'ArrowDown' : 'ArrowRight';

  root.addEventListener('keydown', (e) => {
    if (e.key !== teclaVoltar && e.key !== teclaAvancar) return;
    e.preventDefault();
    mover(e.key === teclaAvancar ? 'next' : 'prev', 'keyboard');
    pararAutoplay();
  });

  if (autoplay) {
    // Qualquer toque dentro do carrossel encerra o avanço automático — é o
    // `stopOnInteraction` que o conteúdo compartilhado documenta, e é o mesmo
    // gesto que as outras stacks reconhecem: o plugin delas assina o
    // `pointerDown` da área dos slides, não o clique das setas.
    root.addEventListener('pointerdown', pararAutoplay);
    root.addEventListener('mouseenter', suspenderAutoplay);
    root.addEventListener('mouseleave', iniciarAutoplay);
    iniciarAutoplay();
  }

  onIndexChange?.(0, 'init');

  // O motor prende ouvintes de ponteiro, um ResizeObserver e um laço de
  // animação — nada disso sai sozinho quando a raiz deixa a página. `destroy()`
  // é a forma única desta stack, e a raiz saindo do documento já o dispara.
  return tornarDestruivel(root, root, () => {
    if (quadro !== null) cancelAnimationFrame(quadro);
    suspenderAutoplay();
    embla?.destroy();
    embla = null;
  });
}
