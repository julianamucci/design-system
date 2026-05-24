// ─── Carousel — Vanilla factory standalone ──────────────────────────────────
// Visual: classes .nds-carousel-* (zero Tailwind/basecoat-css).
// Comportamento: setas + ArrowLeft/Right + autoplay opcional (pausa no hover).

// ─── Types ────────────────────────────────────────────────────────────────────

export type CarouselOptions = {
  items: HTMLElement[];
  autoplay?: boolean;
  autoplayInterval?: number;
  onIndexChange?: (index: number) => void;
  class?: string;
};

// ─── SVGs ─────────────────────────────────────────────────────────────────────

const CHEVRON_LEFT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const CHEVRON_RIGHT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

// ─── createCarousel ───────────────────────────────────────────────────────────

export function createCarousel(options: CarouselOptions): HTMLElement {
  const { items, autoplay = false, autoplayInterval = 3000, onIndexChange } = options;
  let currentIndex = 0;
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;

  const root = document.createElement('div');
  root.dataset.slot = 'carousel';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.className = 'nds-carousel';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  // Overflow wrapper
  const overflow = document.createElement('div');
  overflow.className = 'nds-carousel-overflow';

  // Track
  const track = document.createElement('div');
  track.className = 'nds-carousel-track';
  track.dataset.slot = 'carousel-track';

  items.forEach((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'nds-carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${items.length}`);
    slide.appendChild(item);
    track.appendChild(slide);
  });

  overflow.appendChild(track);
  root.appendChild(overflow);

  // Navigation buttons
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'nds-carousel-button nds-carousel-button-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.setAttribute('aria-disabled', 'true');
  prevBtn.disabled = true;
  prevBtn.innerHTML = CHEVRON_LEFT;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'nds-carousel-button nds-carousel-button-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = CHEVRON_RIGHT;

  root.appendChild(prevBtn);
  root.appendChild(nextBtn);

  function goTo(index: number): void {
    currentIndex = (index + items.length) % items.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    prevBtn.setAttribute('aria-disabled', currentIndex === 0 ? 'true' : 'false');
    prevBtn.toggleAttribute('disabled', currentIndex === 0);
    nextBtn.setAttribute('aria-disabled', currentIndex === items.length - 1 ? 'true' : 'false');
    nextBtn.toggleAttribute('disabled', currentIndex === items.length - 1);
    onIndexChange?.(currentIndex);
  }

  prevBtn.addEventListener('click', () => {
    goTo(currentIndex - 1);
    if (autoplay) restartAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    goTo(currentIndex + 1);
    if (autoplay) restartAutoplay();
  });

  // Keyboard navigation
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); if (autoplay) restartAutoplay(); }
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); if (autoplay) restartAutoplay(); }
  });

  function startAutoplay(): void {
    autoplayTimer = setInterval(() => goTo(currentIndex + 1), autoplayInterval);
  }

  function restartAutoplay(): void {
    if (autoplayTimer) clearInterval(autoplayTimer);
    startAutoplay();
  }

  // Pause on hover
  if (autoplay) {
    root.addEventListener('mouseenter', () => { if (autoplayTimer) clearInterval(autoplayTimer); });
    root.addEventListener('mouseleave', startAutoplay);
    startAutoplay();
  }

  goTo(0);
  return root;
}
