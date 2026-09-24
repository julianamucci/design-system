/**
 * Transforms do painel Code da Pagination, e os rótulos acessíveis que ela publica.
 *
 * Módulo próprio porque é o que põe os construtores sob o
 * `source-snippets.test.ts`: a guarda varre `*.source.ts` por glob e CHAMA cada
 * export. Construtor inline é função local, e o que o leitor copia ficava sem
 * portão nenhum.
 *
 * Os três rótulos moram aqui porque os construtores fecham sobre eles, e as
 * stories os importam de volta: o mesmo texto vai para o snippet, para a
 * demonstração e para as consultas por nome acessível da `play`. Valor
 * duplicado em dois lugares é o que faz uma das cópias envelhecer sozinha.
 *
 * O que os snippets ensinam é a faixa de números montada a partir do total, com
 * o `[isActive]` marcando a página corrente e os extremos desabilitados por
 * estado — não por remoção do link.
 *
 * POR QUE CADA STORY TEM A PRÓPRIA TRANSFORM, e não uma herdada do `meta`: a
 * catraca `story_sem_transform_proprio` reprova qualquer story sem transform
 * própria em arquivo fora da linha de base, e os quatro arquivos de story deste
 * componente publicavam o TEMPLATE da story — o andaime com `pages`, espião e
 * binding do renderer — no único painel da página feito para ser copiado.
 *
 * O corpo da classe de cada exemplo é escrito INLINE em cada construtor, e não
 * montado por helper: a guarda lê o TEXTO deste módulo para saber que membros a
 * classe declara, e ela apaga todo `${…}` antes de varrer. Corpo que chegasse
 * por interpolação sumiria da leitura, e o `@for` sobre `pages` passaria a
 * parecer um laço sobre membro inexistente.
 */

/** Rótulos acessíveis fixos — não são controls, então ficam fora dos `args`. */
export const LABEL_PREVIOUS = 'Ir para a página anterior';
export const LABEL_NEXT = 'Ir para a próxima página';
export const LABEL_PAGE = 'Ir para página';
/** Nome acessível do salto para as pontas — o padrão de `NdsPaginationFirst`/`Last`. */
export const LABEL_FIRST = 'Ir para a primeira página';
export const LABEL_LAST = 'Ir para a última página';

export type PaginationArgs = {
  total: number;
  current: number;
  previousText: string;
  nextText: string;
};

/** Opções que separam um exemplo de faixa numérica do seguinte. */
type RangeOptions = {
  total?: number;
  current?: number;
  /** Nome acessível do landmark. Omitido, o componente assume `Paginação`. */
  label?: string;
  previousText?: string;
  nextText?: string;
};

/** O atributo `label` do `<nav>`, presente só quando o exemplo o nomeia. */
function labelAttribute(label: string | undefined): string {
  return label ? ` label="${label}"` : '';
}

/**
 * A faixa numérica completa, com os extremos desabilitados por estado.
 *
 * É a forma que serve Simple, FirstPage, LastPage, FocusVisible e Contrast: o
 * que muda entre elas é o total, a página corrente e o nome do landmark, nunca
 * a estrutura. Um molde só evita que uma das cinco envelheça sozinha.
 */
function rangeSnippet(o: RangeOptions = {}): string {
  const {
    total = 5,
    current = 1,
    label,
    previousText = 'Anterior',
    nextText = 'Próxima',
  } = o;

  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination${labelAttribute(label)}>
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text="${previousText}"
            label="${LABEL_PREVIOUS}"
            [disabled]="current() === 1"
            (click)="goTo(current() - 1)"
          ></button>
        </li>
        @for (n of pages; track n) {
          <li ndsPaginationItem>
            <button
              ndsPaginationLink
              type="button"
              [isActive]="n === current()"
              [attr.aria-label]="'${LABEL_PAGE} ' + n"
              (click)="goTo(n)"
            >{{ n }}</button>
          </li>
        }
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text="${nextText}"
            label="${LABEL_NEXT}"
            [disabled]="current() === total"
            (click)="goTo(current() + 1)"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly total = ${total};
  readonly pages = Array.from({ length: this.total }, (_, i) => i + 1);
  readonly current = signal(${current});

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

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

  return rangeSnippet({ total, current, previousText, nextText });
}

// ─── Composições ──────────────────────────────────────────────────────────────

/** `Compositions/Simple` — total pequeno, a faixa inteira visível. */
export function paginationSimpleSource(): string {
  return rangeSnippet({ total: 5, current: 1, label: 'Paginação simples' });
}

/** `Compositions/LastPage` — a última página, com Próxima desabilitado. */
export function paginationLastPageSource(): string {
  return rangeSnippet({ total: 5, current: 5, label: 'Paginação na última página' });
}

/**
 * `Compositions/WithEllipsis` — lista longa colapsada.
 *
 * A faixa recortada é DADO da classe, e não uma sequência derivada do total:
 * quem decide quais números aparecem é quem consome, e o exemplo tem de mostrar
 * essa decisão em vez de escondê-la.
 */
export function paginationWithEllipsisSource(): string {
  return `import { Component } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  NdsPaginationEllipsis,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
    NdsPaginationEllipsis,
  ],
  template: \`
    <nav ndsPagination label="Paginação com reticências">
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text="Anterior"
            label="${LABEL_PREVIOUS}"
          ></button>
        </li>
        @for (section of sections; track $index) {
          <li ndsPaginationItem>
            @if (section === 'ellipsis') {
              <span ndsPaginationEllipsis></span>
            } @else {
              <button
                ndsPaginationLink
                type="button"
                [isActive]="section === current"
                [attr.aria-label]="'${LABEL_PAGE} ' + section"
              >{{ section }}</button>
            }
          </li>
        }
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text="Próxima"
            label="${LABEL_NEXT}"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly current = 6;
  readonly sections: Array<number | 'ellipsis'> = [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12];
}`;
}

/**
 * `Compositions/Interactive` — a página vive fora do componente.
 *
 * O componente não guarda a página: ele desenha a que recebeu e avisa qual foi
 * pedida. O parágrafo de estado existe no snippet porque é ele que prova o
 * ponto — sem um leitor do valor, o exemplo ensinaria uma paginação que parece
 * guardar estado sozinha.
 */
export function paginationInteractiveSource(): string {
  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <div class="nds-stack" data-spacing="sm">
      <nav ndsPagination label="Paginação interativa">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button
              ndsPaginationPrevious
              type="button"
              text="Anterior"
              label="${LABEL_PREVIOUS}"
              [disabled]="current() === 1"
              (click)="goTo(current() - 1)"
            ></button>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <button
                ndsPaginationLink
                type="button"
                [isActive]="n === current()"
                [attr.aria-label]="'${LABEL_PAGE} ' + n"
                (click)="goTo(n)"
              >{{ n }}</button>
            </li>
          }
          <li ndsPaginationItem>
            <button
              ndsPaginationNext
              type="button"
              text="Próxima"
              label="${LABEL_NEXT}"
              [disabled]="current() === total"
              (click)="goTo(current() + 1)"
            ></button>
          </li>
        </ul>
      </nav>
      <p class="nds-text-body">Página {{ current() }} de {{ total }}</p>
    </div>
  \`,
})
export class Exemplo {
  readonly total = 8;
  readonly pages = Array.from({ length: this.total }, (_, i) => i + 1);
  readonly current = signal(3);

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

// ─── Variações ────────────────────────────────────────────────────────────────

/**
 * `Variants/Directional` — só os controles de direção.
 *
 * Sem faixa numérica não há `@for`, e os dois controles carregam o rótulo
 * acessível por `label`: o texto visível some abaixo de 40rem, o nome acessível
 * não.
 */
export function paginationDirectionalSource(): string {
  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination label="Paginação direcional">
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text="Anterior"
            label="${LABEL_PREVIOUS}"
            (click)="goTo(current() - 1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text="Próxima"
            label="${LABEL_NEXT}"
            (click)="goTo(current() + 1)"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly current = signal(1);

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

// ─── Os três eixos do rodapé de tabela (2026-09-23) ──────────────────────────
//
// `appearance` e os saltos para as pontas nasceram quando o rodapé do DataTable
// passou a compor esta faixa. O terceiro eixo — a régua numerada — não tem
// forma própria AQUI: nesta stack quem monta a faixa é o consumidor, e a faixa
// sem números é a que não escreve os `<li>` de número. O snippet de
// `WithoutPages` é o que ensina essa forma.

/**
 * `Variants/Appearance` — a faixa inteira em `outline`.
 *
 * O eixo vale para os controles NÃO ativos: a página atual segue `outline`
 * sempre, porque é ela que o realce existe para marcar.
 */
export function paginationAppearanceSource(): string {
  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination label="Paginação em outline">
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text="Anterior"
            appearance="outline"
            label="${LABEL_PREVIOUS}"
            (click)="goTo(current() - 1)"
          ></button>
        </li>
        @for (n of pages; track n) {
          <li ndsPaginationItem>
            <button
              ndsPaginationLink
              type="button"
              appearance="outline"
              [isActive]="n === current()"
              [attr.aria-label]="'${LABEL_PAGE} ' + n"
              (click)="goTo(n)"
            >{{ n }}</button>
          </li>
        }
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text="Próxima"
            appearance="outline"
            label="${LABEL_NEXT}"
            (click)="goTo(current() + 1)"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly pages = [1, 2, 3, 4, 5];
  readonly current = signal(2);

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

/**
 * `Variants/FirstLast` — o salto para as pontas.
 *
 * Os dois entram POR FORA dos direcionais: primeira antes do anterior, última
 * depois do próximo. Sem texto visível, e por isso quadrados — quem os nomeia é
 * o `label`.
 */
export function paginationFirstLastSource(): string {
  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationFirst, NdsPaginationLast,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationFirst, NdsPaginationLast,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination label="Paginação com salto para as pontas">
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationFirst
            type="button"
            label="${LABEL_FIRST}"
            [disabled]="current() === 1"
            (click)="goTo(1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text="Anterior"
            label="${LABEL_PREVIOUS}"
            [disabled]="current() === 1"
            (click)="goTo(current() - 1)"
          ></button>
        </li>
        @for (n of pages; track n) {
          <li ndsPaginationItem>
            <button
              ndsPaginationLink
              type="button"
              [isActive]="n === current()"
              [attr.aria-label]="'${LABEL_PAGE} ' + n"
              (click)="goTo(n)"
            >{{ n }}</button>
          </li>
        }
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text="Próxima"
            label="${LABEL_NEXT}"
            [disabled]="current() === total"
            (click)="goTo(current() + 1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationLast
            type="button"
            label="${LABEL_LAST}"
            [disabled]="current() === total"
            (click)="goTo(total)"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly total = 8;
  readonly pages = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly current = signal(4);

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

/**
 * `Variants/WithoutPages` — a faixa sem régua numerada.
 *
 * É a forma do rodapé de tabela: quatro saltos e passos, nome acessível em cada
 * um, nenhuma palavra na tela. Quem diz em que página se está é o texto ao lado
 * da faixa, e não um número realçado dentro dela.
 *
 * `text=""` é o que deixa o direcional quadrado: sem palavra, o controle é só
 * de ícone, e o `<span>` do rótulo nem chega a existir.
 */
export function paginationWithoutPagesSource(): string {
  return `import { Component, signal } from '@angular/core';
import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationFirst, NdsPaginationLast,
  NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationFirst, NdsPaginationLast,
    NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination data-align="end" label="Paginação sem números">
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <button
            ndsPaginationFirst
            type="button"
            appearance="outline"
            label="Primeira página"
            [disabled]="current() === 1"
            (click)="goTo(1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationPrevious
            type="button"
            text=""
            appearance="outline"
            label="Página anterior"
            [disabled]="current() === 1"
            (click)="goTo(current() - 1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationNext
            type="button"
            text=""
            appearance="outline"
            label="Próxima página"
            [disabled]="current() === total"
            (click)="goTo(current() + 1)"
          ></button>
        </li>
        <li ndsPaginationItem>
          <button
            ndsPaginationLast
            type="button"
            appearance="outline"
            label="Última página"
            [disabled]="current() === total"
            (click)="goTo(total)"
          ></button>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly total = 10;
  readonly current = signal(5);

  goTo(page: number): void {
    this.current.set(page);
  }
}`;
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/** `States/FirstPage` — na primeira página o Anterior fica desabilitado. */
export function paginationFirstPageSource(): string {
  return rangeSnippet({ total: 5, current: 1, label: 'Paginação na primeira página' });
}

/** `States/FocusVisible` — o anel de foco vale para qualquer link da faixa. */
export function paginationFocusVisibleSource(): string {
  return rangeSnippet({ total: 5, current: 3, label: 'Paginação com foco' });
}

/** `States/Contrast` — o texto de todo link medido sobre o fundo em que aparece. */
export function paginationContrastSource(): string {
  return rangeSnippet({ total: 5, current: 3, label: 'Paginação medida por contraste' });
}
