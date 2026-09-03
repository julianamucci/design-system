/**
 * Transform do painel Code da Pagination, e os rótulos acessíveis que ela publica.
 *
 * Módulo próprio porque é o que põe o construtor sob o
 * `source-snippets.test.ts`: a guarda varre `*.source.ts` por glob e CHAMA cada
 * export. Construtor inline é função local, e o que o leitor copia ficava sem
 * portão nenhum.
 *
 * Os três rótulos moram aqui porque o construtor fecha sobre eles, e a story os
 * importa de volta: o mesmo texto vai para o snippet, para a demonstração e
 * para as consultas por nome acessível da `play`. Valor duplicado em dois
 * lugares é o que faz uma das cópias envelhecer sozinha.
 *
 * O que o snippet ensina é a faixa de números montada a partir do total, com o
 * `[isActive]` marcando a página corrente e os extremos desabilitados por
 * estado — não por remoção do link.
 */

/** Rótulos acessíveis fixos — não são controls, então ficam fora dos `args`. */
export const LABEL_PREVIOUS = 'Ir para a página anterior';
export const LABEL_NEXT = 'Ir para a próxima página';
export const LABEL_PAGE = 'Ir para página';

export type PaginationArgs = {
  total: number;
  current: number;
  previousText: string;
  nextText: string;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `@for` que
 * monta a faixa de números e com os bindings ligados aos args. É o andaime da
 * story, não o que alguém escreve para usar uma paginação. O `transform`
 * devolve o uso real, com o valor atual dos controls já resolvido. Ver a nota
 * em `separator.stories.ts` e a armadilha 3 do CLAUDE.md deste stack.
 */
export function paginationPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<PaginationArgs> } = {},
): string {
  const {
    total = 5,
    current = 2,
    previousText = 'Anterior',
    nextText = 'Próxima',
  } = ctx.args ?? {};

  return `import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination>
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <a
            ndsPaginationPrevious
            href="#"
            text="${previousText}"
            label="${LABEL_PREVIOUS}"
            [disabled]="atual() === 1"
            (click)="irPara($event, atual() - 1)"
          ></a>
        </li>
        @for (n of paginas; track n) {
          <li ndsPaginationItem>
            <a
              ndsPaginationLink
              href="#"
              [isActive]="n === atual()"
              [attr.aria-label]="'${LABEL_PAGE} ' + n"
              (click)="irPara($event, n)"
            >{{ n }}</a>
          </li>
        }
        <li ndsPaginationItem>
          <a
            ndsPaginationNext
            href="#"
            text="${nextText}"
            label="${LABEL_NEXT}"
            [disabled]="atual() === total"
            (click)="irPara($event, atual() + 1)"
          ></a>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly total = ${total};
  readonly paginas = Array.from({ length: this.total }, (_, i) => i + 1);
  readonly atual = signal(${current});

  irPara(evento: Event, pagina: number): void {
    evento.preventDefault();
    this.atual.set(pagina);
  }
}`;
}
