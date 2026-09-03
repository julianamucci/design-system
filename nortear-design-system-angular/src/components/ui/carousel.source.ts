/**
 * Transform do painel Code do Carousel.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é o contrato de acessibilidade do carrossel: o
 * `label` da região e o `slideLabel` com os marcadores `{index}` e `{total}`,
 * que é como o leitor de tela sabe onde está. E ensina a armadilha do modo
 * vertical, em que o viewport precisa de altura definida — via classe de
 * proporção, nunca via `style`.
 */
import type { CarouselOrientation } from './carousel';

export type CarouselArgs = {
  orientation: CarouselOrientation;
  loop: boolean;
  onSlideChange: (evento: { index: number; total: number; trigger: string }) => void;
};

/** Ver a nota em separator.stories.ts sobre o painel Code do renderer Angular. */
export function carouselPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CarouselArgs> } = {},
): string {
  const { orientation = 'horizontal', loop = false } = ctx.args ?? {};
  const vertical = orientation === 'vertical';
  const attrs = [
    orientation === 'horizontal' ? '' : `orientation="${orientation}"`,
    loop ? '[loop]="true"' : '',
  ].filter(Boolean).join(' ');
  // Em vertical o viewport precisa de altura DEFINIDA — sem ela a base
  // `flex: 0 0 100%` do slide não tem contra o que resolver e o carrossel
  // empilha em vez de recortar. A altura vem de uma classe de proporção, nunca
  // de `style`.
  const classNameContent = vertical ? ' class="nds-aspect-4-3"' : '';

  return `import { NDS_CAROUSEL } from '@/components/ui/carousel';

@Component({
  imports: [NDS_CAROUSEL],
  template: \`
    <nds-carousel
      class="nds-w-md"
      label="Galeria de exemplos"
      slideLabel="Slide {index} de {total}"${attrs ? `\n      ${attrs}` : ''}
    >
      <div ndsCarouselContent${classNameContent}>
        @for (slide of slides; track slide.id) {
          <div ndsCarouselItem>{{ slide.titulo }}</div>
        }
      </div>
      <button ndsCarouselPrevious label="Item anterior"></button>
      <button ndsCarouselNext label="Próximo item"></button>
    </nds-carousel>
  \`,
})
export class Exemplo {
  // O laço do exemplo sai daqui: expressão de template só enxerga membro de
  // classe, e uma constante no topo do arquivo é invisível ali.
  readonly slides = [{ id: 1 }, { id: 2 }, { id: 3 }];
}`;
}
