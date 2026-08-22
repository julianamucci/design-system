/**
 * Slide de exemplo do Carousel — um construtor, seis consumidores.
 *
 * Existiam SEIS cópias desta função: quatro arquivos de story, a página de
 * documentação e as composições. Todas montavam a mesma árvore com pequenas
 * variações, e foi por isso que corrigir uma delas deixou cinco erradas — a
 * dona viu a borda voltar nas composições e sumir em todo o resto.
 *
 * A árvore aqui é a que React e Angular já montavam, e é deliberadamente SEM
 * `createCard`: o card declara `background-color` próprio, e `card.css` é
 * importado depois de `colors.css` no `index.css`. Mesma especificidade, o
 * posterior vence — o fundo do card apagava `nds-bg-muted-soft`, o slide saía
 * branco e o anel do card ainda desaparecia por ser `box-shadow` recortado pelo
 * `overflow` do slide.
 */

export type TomDoSlide = 'muted' | 'primary';

export interface SlideDeExemploOptions {
  /**
   * Classe de medida da moldura. O padrão é a proporção 16:9 que as outras
   * stacks usam; o eixo vertical passa altura cheia, porque ali quem manda na
   * medida é o recorte e não a proporção do slide.
   */
  measurement?: string;
  /** Realce do slide atual nas demonstrações da página. */
  tom?: TomDoSlide;
}

const BACKGROUND: Record<TomDoSlide, string> = {
  muted: 'nds-bg-muted-soft',
  primary: 'nds-bg-primary-soft',
};

/** Um slide, com o rótulo centralizado. */
export function slideDeExemplo(rotulo: string, o: SlideDeExemploOptions = {}): HTMLElement {
  const { measurement = 'nds-aspect-16-9', tom = 'muted' } = o;

  const frame = document.createElement('div');
  frame.className = measurement;

  const caixa = document.createElement('div');
  caixa.className = `nds-cluster nds-h-full nds-rounded-lg ${BACKGROUND[tom]}`;
  caixa.dataset.align = 'center';
  caixa.dataset.justify = 'center';

  const labelEl = document.createElement('span');
  labelEl.className = 'nds-text-h3 nds-font-semibold nds-text-muted-foreground';
  labelEl.textContent = rotulo;

  caixa.appendChild(labelEl);
  frame.appendChild(caixa);
  return frame;
}

/** `count` slides numerados, na ordem. */
export function slidesDeExemplo(
  count: number,
  o: SlideDeExemploOptions & { prefixo?: string } = {},
): HTMLElement[] {
  const { prefixo = 'Slide', ...remainder } = o;
  return Array.from({ length: count }, (_, i) => slideDeExemplo(`${prefixo} ${i + 1}`, remainder));
}
