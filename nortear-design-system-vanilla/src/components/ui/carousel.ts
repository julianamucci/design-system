// ─── Carousel — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-carousel-* (standalone).
// Comportamento: setas + setas do teclado + autoplay opcional (pausa no hover,
// para de vez na primeira interação de quem lê).

import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

// ─── Types ────────────────────────────────────────────────────────────────────

// PATCH: api — origem da navegação exposta para analytics (ver PATCHES.md#vanilla-carousel-nav-source)
// 'init' é o posicionamento inicial no mount — consumidores normalmente o ignoram.
export type CarouselNavSource = 'init' | 'button' | 'keyboard' | 'autoplay';

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
  /** Nome acessível da região. Sem ele o leitor anuncia "carrossel" sem dizer de quê. */
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

export function createCarousel(options: CarouselOptions): HTMLElement {
  const {
    items,
    orientation = 'horizontal',
    autoplay = false,
    autoplayInterval = 3000,
    onIndexChange,
    label = 'Carrossel',
    slideLabel = 'Slide {index} de {total}',
    previousLabel = 'Item anterior',
    nextLabel = 'Próximo item',
  } = options;

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

  // Overflow wrapper
  // `contentClass` cai no RECORTE, que é o único nó da árvore com largura
  // definida — e é de largura definida que uma proporção tira altura. No track
  // a conta não fecha: a altura do recorte viria do track e a do track da
  // proporção dele próprio, um ciclo que o layout resolve caindo no conteúdo.
  // Com a altura no recorte, `.nds-carousel-track[data-orientation="vertical"]`
  // a herda por `height: 100%`, e aí sim a base `flex: 0 0 100%` do slide tem
  // contra o que resolver.
  const overflow = document.createElement('div');
  overflow.className = cn('nds-carousel-overflow', options.contentClass);

  // Track
  const track = document.createElement('div');
  track.className = 'nds-carousel-track';
  track.dataset.slot = 'carousel-track';
  // Só em vertical. O seletor `[data-orientation="horizontal"]` do CSS
  // compartilhado traz a margem negativa que encosta o primeiro slide na borda
  // — comportamento das outras stacks, e ligá-lo aqui mudaria a renderização
  // horizontal desta stack de imediato. Alinhar as duas é decisão de design,
  // não efeito colateral de uma orientação nova.
  if (vertical) track.dataset.orientation = 'vertical';

  items.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'nds-carousel-slide';
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
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'nds-carousel-button nds-carousel-button-prev';
  prevBtn.setAttribute('aria-label', previousLabel);
  prevBtn.setAttribute('aria-disabled', 'true');
  prevBtn.disabled = true;
  if (vertical) prevBtn.dataset.orientation = 'vertical';
  prevBtn.innerHTML = DOMPurify.sanitize(CHEVRON_LEFT);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'nds-carousel-button nds-carousel-button-next';
  nextBtn.setAttribute('aria-label', nextLabel);
  if (vertical) nextBtn.dataset.orientation = 'vertical';
  nextBtn.innerHTML = DOMPurify.sanitize(CHEVRON_RIGHT);

  root.appendChild(prevBtn);
  root.appendChild(nextBtn);

  function goTo(index: number, source: CarouselNavSource): void {
    // O avanço automático dá a volta; a navegação de quem usa respeita os
    // extremos. Sem essa distinção o teclado atravessava o fim do trilho e
    // voltava ao primeiro slide enquanto a seta ao lado estava desabilitada
    // dizendo que não dava — as duas metades do mesmo componente discordando.
    currentIndex = source === 'autoplay'
      ? (index + items.length) % items.length
      : Math.min(Math.max(index, 0), items.length - 1);
    const deslocamento = `-${currentIndex * 100}%`;
    track.style.transform = vertical
      ? `translateY(${deslocamento})`
      : `translateX(${deslocamento})`;
    prevBtn.setAttribute('aria-disabled', currentIndex === 0 ? 'true' : 'false');
    prevBtn.toggleAttribute('disabled', currentIndex === 0);
    nextBtn.setAttribute('aria-disabled', currentIndex === items.length - 1 ? 'true' : 'false');
    nextBtn.toggleAttribute('disabled', currentIndex === items.length - 1);
    onIndexChange?.(currentIndex, source);
  }

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
    autoplayTimer = setInterval(() => goTo(currentIndex + 1, 'autoplay'), autoplayInterval);
  }

  function pararAutoplay(): void {
    autoplayLigado = false;
    suspenderAutoplay();
  }

  prevBtn.addEventListener('click', () => {
    goTo(currentIndex - 1, 'button');
    pararAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    goTo(currentIndex + 1, 'button');
    pararAutoplay();
  });

  // Keyboard navigation — o par de teclas acompanha o eixo: quem lê uma pilha
  // de cima para baixo não procura ArrowLeft.
  const teclaVoltar = vertical ? 'ArrowUp' : 'ArrowLeft';
  const teclaAvancar = vertical ? 'ArrowDown' : 'ArrowRight';

  root.addEventListener('keydown', (e) => {
    if (e.key !== teclaVoltar && e.key !== teclaAvancar) return;
    e.preventDefault();
    goTo(currentIndex + (e.key === teclaAvancar ? 1 : -1), 'keyboard');
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

  goTo(0, 'init');
  return root;
}
