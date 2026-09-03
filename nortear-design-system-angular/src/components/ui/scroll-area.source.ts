/**
 * Transform do painel Code do ScrollArea.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: a janela rolável é um `<div ndsScrollArea>` com
 * degrau de altura e nome acessível, e o conteúdo entra dentro dela. A barra é
 * a NATIVA do navegador, então não há nó a desenhar nem a estilizar — o que
 * decide se existe rolagem é o teto de altura, e é por isso que `size` aparece
 * sempre no snippet.
 */
import type { ScrollAreaSize } from './scroll-area';

export type ScrollAreaArgs = {
  orientation: 'vertical' | 'horizontal' | 'both';
  itemCount: number;
  size: ScrollAreaSize;
  label: string;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `@if` que
 * alterna os três exemplos e com os bindings ligados aos args. Ninguém escreve
 * isso ao usar o componente. O `transform` devolve o uso real a partir dos
 * valores atuais dos controls (armadilha 3 do CLAUDE.md deste stack).
 */
export function scrollAreaPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ScrollAreaArgs> } = {},
): string {
  const {
    orientation = 'vertical',
    size = 'lg',
    label = 'Lista de tags',
  } = ctx.args ?? {};

  // `size` entra sempre, e não só quando difere do valor de partida: ele não tem
  // default no componente — sem ele não há teto, e sem teto não há rolagem.
  const root = [
    '<div ndsScrollArea',
    `size="${size}"`,
    `label="${label}"`,
    `class="${orientation === 'vertical' ? 'nds-w-sm' : 'nds-max-w-md'} nds-rounded-md nds-border-default"`,
  ]
    .filter(Boolean)
    .join(' ');

  const content =
    orientation === 'vertical'
      ? `  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (tag of tags; track tag) {
      <p class="nds-text-body nds-m-0">{{ tag }}</p>
    }
  </div>`
      : orientation === 'horizontal'
        ? `  <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
    @for (card of cards; track card) {
      <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted">{{ card }}</div>
    }
  </div>`
        : `  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (linha of linhas; track linha) {
      <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
        @for (coluna of colunas; track coluna) {
          <span class="nds-text-body nds-shrink-0">{{ linha }} · {{ coluna }}</span>
        }
      </div>
    }
  </div>`;

  return `import { NdsScrollArea } from '@/components/ui/scroll-area';

@Component({
  imports: [NdsScrollArea],
  template: \`
    ${root}>
    ${content}
    </div>
  \`,
})
export class Exemplo {
  // Os quatro laços do exemplo saem daqui: expressão de template só enxerga
  // membro de classe, e uma constante no topo do arquivo é invisível ali.
  readonly tags = ['Design', 'Sistema', 'Tokens'];
  readonly cards = ['Cartão A', 'Cartão B', 'Cartão C'];
  readonly linhas = [1, 2, 3];
  readonly colunas = ['A', 'B', 'C'];
}`;
}
