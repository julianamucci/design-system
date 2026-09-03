/**
 * Transform do painel Code do Skeleton.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: a forma vem por ATRIBUTO (`data-shape`, `data-width`)
 * e nunca por medida cravada — guideline 12 —, e quem anuncia o carregamento é
 * o CONTAINER, porque o bloco em si é decorativo. O elemento pai é que precisa
 * de `role` e de `aria-busy`.
 *
 * A DÍVIDA QUE A GUARDA ACHOU no primeiro dia sob portão: o template ligava
 * `[attr.aria-busy]="carregando()"` contra uma classe VAZIA. O binding não
 * resolvia na mão de quem copiasse, e nada acusava — é exatamente o defeito que
 * o `ligacoesSemMembro` existe para pegar. O sinal ganhou declaração e o import
 * que ele exige.
 */
export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

/** Ver a nota em separator.source.ts. */
export function skeletonPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SkeletonArgs> } = {},
): string {
  const { shape = 'text', width = '3-4' } = ctx.args ?? {};
  const widthAttr = shape === 'text' || shape === 'heading' ? ` data-width="${width}"` : '';
  return `import { signal } from '@angular/core';
import { NdsSkeleton } from '@/components/ui/skeleton';

@Component({
  imports: [NdsSkeleton],
  template: \`
    <!-- aria-busy no CONTAINER: o esqueleto é aria-hidden e quem anuncia
         o carregamento é a região que vai receber o conteúdo. -->
    <div role="status" [attr.aria-busy]="carregando()" aria-label="Carregando conteúdo">
      <div ndsSkeleton data-shape="${shape}"${widthAttr}></div>
    </div>
  \`,
})
export class Exemplo {
  readonly carregando = signal(true);
}`;
}
