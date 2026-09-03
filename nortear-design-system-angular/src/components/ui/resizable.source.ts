/**
 * Transform do painel Code do Resizable, e o rótulo do punho que ela publica.
 *
 * Módulo próprio porque é o que põe o construtor sob o
 * `source-snippets.test.ts`: a guarda varre `*.source.ts` por glob e CHAMA cada
 * export para ler o texto. Função local dentro da story não é alcançável.
 *
 * `LABEL_HANDLE` mora aqui porque o construtor fecha sobre ele, e a story o
 * importa de volta — o mesmo texto vai para o snippet, para a demonstração e
 * para a consulta por nome acessível da `play`.
 *
 * O que o snippet ensina é o par de painéis com o punho no meio, os limites de
 * tamanho declarados em porcentagem e o `(layout)`, que emite uma vez por
 * gesto — não uma vez por pixel.
 */
import type { ResizableDirection } from './resizable';

/**
 * Rótulo do punho repetido nas stories.
 *
 * O aria-label é o nome acessível de um `role="separator"` focável — sem ele o
 * leitor de tela anuncia "separador" e nada mais. E ele diz o ATALHO, porque a
 * alternativa ao arrasto não tem nenhuma pista visual.
 */
export const LABEL_HANDLE = 'Redimensionar painéis — use as setas para ajustar';

export type ResizableArgs = {
  direction: ResizableDirection;
  withHandle: boolean;
  defaultSize: number;
  minSize: number;
};

/**
 * O painel Code imprime o `template` da story literalmente — com a caixa da
 * demo e os bindings nos args, que não é o que a pessoa deve escrever. Ver a
 * nota em `separator.stories.ts`.
 */
export function resizablePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ResizableArgs> } = {},
): string {
  const {
    direction = 'horizontal',
    withHandle = true,
    defaultSize = 30,
    minSize = 20,
  } = ctx.args ?? {};

  return `import { NdsResizable, NdsResizablePanel, NdsResizableHandle } from '@/components/ui/resizable';

@Component({
  imports: [NdsResizable, NdsResizablePanel, NdsResizableHandle],
  template: \`
    <div ndsResizable direction="${direction}" class="nds-min-h-50" (layout)="aoLayout($event)">
      <div ndsResizablePanel [defaultSize]="${defaultSize}" [minSize]="${minSize}" [maxSize]="60">
        <!-- Painel inicial -->
      </div>

      <div
        ndsResizableHandle
        ${withHandle ? '[withHandle]="true"\n        ' : ''}aria-label="${LABEL_HANDLE}"
      ></div>

      <div ndsResizablePanel [defaultSize]="${100 - defaultSize}" [minSize]="${minSize}">
        <!-- Painel seguinte -->
      </div>
    </div>
  \`,
})
export class Exemplo {
  aoLayout(tamanhos: number[]): void {
    // Porcentagens finais, uma emissão por gesto — não uma por pixel.
    console.log(tamanhos);
  }
}`;
}
