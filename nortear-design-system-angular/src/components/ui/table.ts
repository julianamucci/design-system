import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

// ─── Table ────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-table-wrapper e .nds-table (docs/shared/styles/nds/table.css).
//
// SEM primitivo do `@radix-ng/primitives`: o pacote não publica subcaminho
// `table` — e não haveria o que compor. Tabela de dados é markup semântico
// nativo: `<table>` / `<thead>` / `<tbody>` / `<tfoot>` / `<tr>` / `<th>` /
// `<td>` / `<caption>` já entregam papel, relação linha-coluna e leitura em
// ordem. O que um leitor de tela precisa a mais são dois atributos (`scope` no
// cabeçalho, `aria-sort` na coluna ordenada) e uma legenda — nada de estado,
// foco gerenciado ou navegação por teclado própria.
//
// Por isso a família inteira é de DIRETIVA de atributo, nunca `@Component`:
// nenhum subcomponente tem markup próprio nem projeta conteúdo (o conteúdo da
// célula é filho do `<td>` que a pessoa escreveu, no template dela). Um
// `@Component` com `template: '<ng-content />'` criaria view e ciclo de
// detecção para reemitir o que já estava lá — e, pior, um `<ng-content>` dentro
// de `<tr>` arriscaria o parser de HTML mover o conteúdo para fora da tabela.
//
// O DOM resultante é idêntico ao do Vanilla, que é a referência cross-stack.
//
// ─── Por que o wrapper é explícito aqui ───────────────────────────────────────
//
// React e Vanilla envolvem o `<table>` num `<div class="nds-table-wrapper">`
// por dentro do componente. Uma diretiva de atributo NÃO pode fazer isso: o
// host dela É o `<table>`, e não existe como criar um pai. Então o wrapper é um
// elemento que quem usa escreve, com `ndsTableWrapper` — é o que o snippet
// `anatomy.structureCode.angular` do conteúdo compartilhado já contrata.
//
// Divergência de API de framework, não de markup: o HTML final é o mesmo nas
// cinco stacks.

/**
 * Container rolável da tabela — `<div ndsTableWrapper>`.
 *
 * `.nds-table-wrapper` é `overflow-x: auto`, e região rolável precisa ser
 * alcançável por teclado: quem navega sem mouse não tem outro jeito de chegar
 * às colunas que ficaram fora da caixa (WCAG 2.1.1, regra `scrollable-region-focusable`
 * do axe). O `tabindex` é fixo, e não input, pelo mesmo motivo do Vanilla, onde
 * a factory o crava: torná-lo configurável só criaria a opção de desligar a
 * única coisa que faz a rolagem existir para o teclado.
 */
@Directive({
  selector: 'div[ndsTableWrapper]',
  standalone: true,
  host: {
    class: 'nds-table-wrapper',
    '[attr.data-slot]': '"table-container"',
    '[attr.tabindex]': '"0"',
  },
})
export class NdsTableWrapper {}

/** A tabela em si — `<table ndsTable>`. Só ela carrega classe; o CSS alcança as
 * seções por descendência (`.nds-table thead tr`, `.nds-table td`…). */
@Directive({
  selector: 'table[ndsTable]',
  standalone: true,
  host: {
    class: 'nds-table',
    '[attr.data-slot]': '"table"',
  },
})
export class NdsTable {}

/** Cabeçalho da tabela — `<thead ndsTableHeader>`. */
@Directive({
  selector: 'thead[ndsTableHeader]',
  standalone: true,
  host: { '[attr.data-slot]': '"table-header"' },
})
export class NdsTableHeader {}

/** Corpo da tabela — `<tbody ndsTableBody>`. */
@Directive({
  selector: 'tbody[ndsTableBody]',
  standalone: true,
  host: { '[attr.data-slot]': '"table-body"' },
})
export class NdsTableBody {}

/**
 * Rodapé da tabela — `<tfoot ndsTableFooter>`.
 *
 * É onde total e sumário vivem. Uma linha de `<tbody>` faria o mesmo desenho e
 * seria lida como mais um registro; o `tfoot` é anunciado como rodapé.
 */
@Directive({
  selector: 'tfoot[ndsTableFooter]',
  standalone: true,
  host: { '[attr.data-slot]': '"table-footer"' },
})
export class NdsTableFooter {}

/**
 * Linha — `<tr ndsTableRow>`.
 *
 * `selected` liga o `data-state="selected"` que o CSS compartilhado pinta. O
 * atributo escrito à mão (`<tr ndsTableRow data-state="selected">`, como as
 * outras stacks fazem nas fixtures) continua valendo: sem essa leitura o host
 * binding devolveria `null` e APAGARIA em silêncio o estado que a pessoa
 * escreveu — binding roda depois de atributo estático.
 *
 * Ler o atributo no construtor é seguro; ler um `input()` ali não seria (o
 * binding de quem consome ainda não foi aplicado — armadilha 9 do CLAUDE.md).
 */
@Directive({
  selector: 'tr[ndsTableRow]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"table-row"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsTableRow {
  /**
   * Marca a linha como selecionada. `booleanAttribute` para aceitar a forma
   * curta `<tr ndsTableRow selected>`, como o HTML faz com `disabled`.
   */
  readonly selected = input(false, { transform: booleanAttribute });

  private readonly estadoEscrito = inject<ElementRef<HTMLTableRowElement>>(
    ElementRef,
  ).nativeElement.getAttribute('data-state');

  protected readonly state = computed(() =>
    this.selected() ? 'selected' : this.estadoEscrito,
  );
}

/** Direção da ordenação exposta em `aria-sort`. */
export type TableSortDirection = 'ascending' | 'descending' | 'none';

/**
 * Célula de cabeçalho — `<th ndsTableHead>`.
 *
 * `scope` nasce em `"col"` porque é o caso de longe mais comum e porque uma
 * tabela sem `scope` é uma grade muda: o leitor de tela lê os valores sem dizer
 * de que coluna vieram (WCAG 1.3.1). Quem tem cabeçalho de linha escreve
 * `scope="row"` — o Angular aplica o atributo estático ao input de mesmo nome,
 * então a forma nativa continua sendo a forma certa de escrever.
 *
 * `sort` só emite `aria-sort` quando a coluna é de fato ordenável. Emitir
 * `aria-sort="none"` em coluna que não ordena anuncia uma capacidade que não
 * existe; por isso o default é `undefined`, e não `'none'`.
 */
@Directive({
  selector: 'th[ndsTableHead]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"table-head"',
    '[attr.scope]': 'scope()',
    '[attr.aria-sort]': 'sort() ?? null',
  },
})
export class NdsTableHead {
  readonly scope = input<'col' | 'row' | 'colgroup' | 'rowgroup'>('col');
  readonly sort = input<TableSortDirection | undefined>(undefined);
}

/** Célula de dados — `<td ndsTableCell>`. `colspan`/`rowspan` são atributos
 * nativos e não viram input: quem escreve o HTML já os tem. */
@Directive({
  selector: 'td[ndsTableCell]',
  standalone: true,
  host: { '[attr.data-slot]': '"table-cell"' },
})
export class NdsTableCell {}

/**
 * Legenda — `<caption ndsTableCaption>`.
 *
 * O leitor de tela a anuncia antes das células, então ela é o que dá contexto à
 * grade. Quando o título já está visível na página, some visualmente com
 * `class="nds-sr-only"` em vez de removê-la: o `.nds-table` é `caption-side: bottom`,
 * e uma tabela sem caption chega ao leitor sem nome nenhum.
 */
@Directive({
  selector: 'caption[ndsTableCaption]',
  standalone: true,
  host: { '[attr.data-slot]': '"table-caption"' },
})
export class NdsTableCaption {}
