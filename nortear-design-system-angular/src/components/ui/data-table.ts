import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  OnInit,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Settings2,
} from 'lucide';
import type { CheckedState } from '@radix-ng/primitives/menu';
import { cn } from '@/lib/utils';
import { NdsBadge, type BadgeVariant } from './badge';
import { NdsButton } from './button';
import { NdsCheckbox } from './checkbox';
import { NdsInput } from './input';
import {
  NdsTable,
  NdsTableBody,
  NdsTableCaption,
  NdsTableCell,
  NdsTableHead,
  NdsTableHeader,
  NdsTableRow,
  NdsTableWrapper,
  type TableSortDirection,
} from './table';
import {
  NdsDropdownMenu,
  NdsDropdownMenuCheckboxItem,
  NdsDropdownMenuContent,
  NdsDropdownMenuGroup,
  NdsDropdownMenuLabel,
  NdsDropdownMenuSeparator,
  NdsDropdownMenuTrigger,
} from './dropdown-menu';

// ─── DataTable ────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-data-table-* (docs/shared/styles/nds/data-table.css),
// sobre o `.nds-table` do primitivo Table. O markup final é o mesmo das outras
// stacks: toolbar, container rolável, `<table>` semântico e rodapé de paginação.
//
// ─── Por que NÃO há TanStack aqui ─────────────────────────────────────────────
//
// React, Vue, Svelte e Vanilla montam este componente sobre `@tanstack/*-table`:
// a engine headless calcula ordenação, filtro, seleção e paginação, e a camada
// visual só desenha. Neste stack o estado é de SIGNAL, escrito à mão.
//
// Não é preferência. O Angular 22 é zoneless e signals-first, e o adapter
// `@tanstack/angular-table` publica seu estado por um `computed` próprio que
// espera ser lido dentro de um ciclo de detecção — o que sobreporia um segundo
// modelo de reatividade ao que o resto deste stack já usa. Com signal, cada
// derivação (filtrar → ordenar → paginar) é um `computed` que o template lê
// direto, e a mudança de qualquer entrada recalcula só o que depende dela.
//
// A consequência é uma DIVERGÊNCIA DE API DE FRAMEWORK, e ela é registrada, não
// "alinhada" (regra do CLAUDE.md da raiz): lá a coluna é uma `ColumnDef` do
// TanStack com `accessorKey`/`header`/`cell`; aqui é uma `DataTableColumn` com
// `accessor`/`header`/`format`. O DOM que sai dos dois lados é o mesmo — é ele
// que a auditoria cross-stack compara.
//
// ─── Escopo ───────────────────────────────────────────────────────────────────
//
// Entregues: filtro global, filtros por coluna, ordenação com `aria-sort`,
// seleção de linhas com tri-state e contagem anunciada, menu de visibilidade de
// colunas, edição inline e paginação.
//
// FORA, de propósito: redimensionamento, reordenação por arrasto, fixação de
// coluna e virtualização. Os quatro dependem de geometria em pixel escrita no
// elemento (`style="width: 187px"`, `left` de coluna fixa, altura das linhas
// fantasma do virtualizador), e CSS inline é proibido neste stack — inline
// vence a folha e tira o componente do tema, da densidade e da escala
// tipográfica. Enquanto não houver forma de expressar largura arrastada como
// classe ou token, entregar meia funcionalidade seria pior que não entregar.

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Configuração do filtro de uma coluna. `select` exige `options`. */
export interface DataTableColumnFilter {
  type: 'text' | 'select';
  options?: readonly string[];
  placeholder?: string;
}

/**
 * Definição de uma coluna.
 *
 * `accessor` devolve o valor BRUTO (usado para ordenar e filtrar) e `format` o
 * texto exibido. Separar os dois é o que faz "R$ 1.250,00" ordenar como 1250 e
 * não como a string que começa com "R".
 */
export interface DataTableColumn<TData> {
  /** Identificador estável da coluna — usado em ordenação, filtro e edição. */
  id: string;
  /** Rótulo do cabeçalho. Substantivo curto, sem ponto final. */
  header: string;
  accessor: (row: TData) => unknown;
  format?: (value: unknown, row: TData) => string;
  /** Coluna ordenável ganha botão no cabeçalho e `aria-sort`. */
  sortable?: boolean;
  /** Coluna que pode ser escondida pelo menu de colunas. Padrão: true. */
  hideable?: boolean;
  /** Célula vira input ao clicar; o valor sai por `cellEdit`. */
  editable?: boolean;
  filter?: DataTableColumnFilter;
  /**
   * Coluna numérica: a célula E o cabeçalho alinham à direita.
   *
   * O que este comentário dizia até 2026-09-22 era que o cabeçalho NÃO
   * acompanhava, porque `.nds-table th` valia (0,1,1) e vencia a utilitária
   * `.nds-text-right` (0,1,0) — "escrever a classe no `<th>` não faria nada".
   * A premissa venceu: a regra compartilhada foi rebaixada para
   * `:where(.nds-table) th`, que vale (0,0,1), e o que resta disputando é
   * `.nds-data-table-th` (0,1,0) contra a utilitária (0,1,0) — empate, em que
   * vence quem carrega depois. `index.css` importa `utilities.css` depois de
   * `data-table.css`, então hoje quem decide é a classe do markup.
   * `docs/shared/guidelines/20-tabelas.md` manda alinhar nos dois.
   *
   * `text-align` sozinho não basta, e vale registrar por quê: o miolo do
   * cabeçalho é `display: flex`, e o rótulo de coluna ordenável mora dentro de
   * um botão que também é flex — alinhamento de texto não move item de flex.
   * Três agentes acharam isso no mesmo dia, cada uma numa stack.
   *
   * Quem resolve é a FOLHA COMPARTILHADA, e de propósito:
   * `.nds-data-table-th.nds-text-right .nds-data-table-sort-btn` justifica o
   * conteúdo do botão ao fim. Esta stack chegou a empurrar o rótulo com
   * `.nds-spacer-start` (margem automática) e a classe foi removida em
   * 2026-09-22: somada à regra da folha ela AFASTA o rótulo da seta, e um
   * mecanismo por stack para o mesmo efeito é a divergência que a próxima
   * rodada paga. Aqui basta a utilitária no `<th>`.
   */
  numeric?: boolean;
  /**
   * Selo semântico na célula: devolve a variante do Badge para aquele valor,
   * ou `null` para texto puro.
   *
   * A chave da decisão nunca é o TEXTO exibido. Rótulo traduzido muda com o
   * idioma e levaria a variante junto — "Pago" vira "Paid" e o selo perde a
   * cor. Por isso a função recebe o valor BRUTO do `accessor` e a linha
   * inteira, e quem mapeia pendura a variante na chave estável do domínio.
   *
   * Divergência de API de framework, registrada e não "alinhada": nas outras
   * stacks o mesmo selo sai de um `cell`/`renderCell` que devolve elemento.
   * Aqui a coluna é um objeto de dado escrito de dentro de um template, e
   * função que devolve DOM não cabe nele — o que cabe é a DECISÃO, e quem
   * desenha é o componente.
   */
  badge?: (value: unknown, row: TData) => BadgeVariant | null;
}

/** Payload de uma edição inline confirmada. */
export interface DataTableCellEdit {
  rowIndex: number;
  columnId: string;
  value: string | number;
}

/**
 * Textos do componente.
 *
 * São TEMPLATES com marcador, não funções: aqui `sortBy` é
 * `'Ordenar por {col}'`, e nas outras quatro stacks é `(col) => ...`; o mesmo
 * vale para `selectRow`, `{row}` aqui e `(row) => ...` lá. Template Angular não
 * declara função, e quem passa este objeto o passa de dentro de um template.
 *
 * É DIVERGÊNCIA DE API DE FRAMEWORK — registrada, não "alinhada" (regra do
 * CLAUDE.md da raiz). A CAPACIDADE é a mesma nas cinco: todo rótulo é
 * substituível, e os que dependem de contexto recebem o mesmo contexto. `{col}`
 * é o rótulo da coluna, `{row}` o identificador da linha, `{n}` o total de
 * linhas e `{s}` o total selecionado.
 *
 * O que NÃO tem par aqui são as chaves de fixar e de redimensionar coluna
 * (`pinLeft`, `unpin`, `resize`): elas nomeiam controles que este stack não
 * entrega, pelo motivo registrado no cabeçalho deste arquivo. Rótulo sem
 * controle é promessa de recurso inexistente.
 */
export interface DataTableLabels {
  columns: string;
  showColumns: string;
  selectAll: string;
  /** Precisa conter `{row}`: sem identificador, doze checkboxes têm um nome só. */
  selectRow: string;
  sortBy: string;
  filter: string;
  filterPlaceholder: string;
  edit: string;
  allOption: string;
  rowsPerPage: string;
  page: string;
  pageOf: string;
  firstPage: string;
  prevPage: string;
  nextPage: string;
  lastPage: string;
  rowsTotal: string;
  rowsSelected: string;
  noFilter: string;
}

export const DATA_TABLE_LABELS_DEFAULT: DataTableLabels = {
  columns: 'Colunas',
  showColumns: 'Exibir colunas',
  selectAll: 'Selecionar todas as linhas',
  selectRow: 'Selecionar linha {row}',
  sortBy: 'Ordenar por {col}',
  filter: 'Filtrar {col}',
  filterPlaceholder: 'Filtrar...',
  edit: 'Editar {col}',
  allOption: 'Todos',
  rowsPerPage: 'Linhas por página',
  page: 'Página',
  pageOf: 'de',
  firstPage: 'Primeira página',
  prevPage: 'Página anterior',
  nextPage: 'Próxima página',
  lastPage: 'Última página',
  rowsTotal: '{n} linha(s).',
  rowsSelected: '{s} de {n} linha(s) selecionada(s).',
  noFilter: 'Sem filtro para {col}',
};

/** Vazio tipográfico: o que uma célula sem valor mostra nas cinco stacks. */
const CELL_VAZIA = '—';

function preencher(modelo: string, values: Record<string, string | number>): string {
  let result = modelo;
  for (const [key, value] of Object.entries(values)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

// ─── Ícone ────────────────────────────────────────────────────────────────────
//
// Mesma montagem do `NdsButtonIcon`: nós criados por `createElementNS`, porque
// cada ícone do lucide é uma lista `[tag, attrs]` com tag variável e template
// Angular exige tag estática. Construir nós é imune a XSS — não há `innerHTML`
// no caminho.
//
// Não é exportado: é peça interna deste arquivo, e exportá-lo criaria uma
// segunda família de ícones concorrendo com a do botão.

export type DataTableIconKind =
  | 'search' | 'settings' | 'arrow-up' | 'arrow-down' | 'arrow-up-down'
  | 'chevron-left' | 'chevron-right' | 'chevrons-left' | 'chevrons-right';

type LucideIconNode = [string, Record<string, string>];

const DATA_TABLE_ICON_MAP: Record<DataTableIconKind, LucideIconNode[]> = {
  'search':          Search        as unknown as LucideIconNode[],
  'settings':        Settings2     as unknown as LucideIconNode[],
  'arrow-up':        ArrowUp       as unknown as LucideIconNode[],
  'arrow-down':      ArrowDown     as unknown as LucideIconNode[],
  'arrow-up-down':   ArrowUpDown   as unknown as LucideIconNode[],
  'chevron-left':    ChevronLeft   as unknown as LucideIconNode[],
  'chevron-right':   ChevronRight  as unknown as LucideIconNode[],
  'chevrons-left':   ChevronsLeft  as unknown as LucideIconNode[],
  'chevrons-right':  ChevronsRight as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsDataTableIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    // `[attr.class]` e não `[class]`: em SVG o `className` é `SVGAnimatedString`
    // e não aceita binding de classe (mesma exceção do NdsButtonIcon).
    '[attr.class]': 'svgClass()',
  },
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsDataTableIcon {
  readonly kind = input.required<DataTableIconKind>();
  /** `muted` apaga o ícone de "ordenável, sem ordem aplicada". */
  readonly tone = input<'default' | 'muted'>('default');

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  protected readonly svgClass = computed(() =>
    cn('nds-dt-icon', this.tone() === 'muted' && 'nds-dt-icon-muted'),
  );

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of DATA_TABLE_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Linha renderizada ────────────────────────────────────────────────────────

interface CellRenderizada {
  columnId: string;
  header: string;
  text: string;
  /** Valor sem formatação — é ele que entra no campo de edição. */
  raw: string;
  numeric: boolean;
  /** Variante do selo desta célula, ou `null` quando a coluna não usa selo. */
  badge: BadgeVariant | null;
  editable: boolean;
  editLabel: string;
  /** `linha:coluna` — identifica a célula que está em edição. */
  key: string;
}

interface LineRenderizada {
  key: string;
  index: number;
  label: string;
  selectLabel: string;
  search: string;
  celulas: CellRenderizada[];
}

// ─── NdsDataTable ─────────────────────────────────────────────────────────────

/**
 * Tabela avançada — `<div ndsDataTable>`.
 *
 * Seletor de atributo num `<div>` pelo mesmo motivo do resto do stack: o host É
 * o elemento que o CSS compartilhado descreve (`.nds-data-table`), então o DOM
 * sai idêntico ao do Vanilla, que é a referência cross-stack.
 */
@Component({
  selector: 'div[ndsDataTable]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsBadge, NdsButton, NdsCheckbox, NdsInput, NdsDataTableIcon,
    NdsTable, NdsTableBody, NdsTableCaption, NdsTableCell, NdsTableHead,
    NdsTableHeader, NdsTableRow, NdsTableWrapper,
    NdsDropdownMenu, NdsDropdownMenuTrigger, NdsDropdownMenuContent,
    NdsDropdownMenuGroup, NdsDropdownMenuLabel, NdsDropdownMenuSeparator,
    NdsDropdownMenuCheckboxItem,
  ],
  host: {
    class: 'nds-data-table',
    '[attr.data-slot]': '"data-table"',
  },
  template: `
    @if (showToolbar()) {
      <div class="nds-data-table-toolbar" data-slot="data-table-toolbar">
        @if (enableGlobalFilter()) {
          <div class="nds-data-table-search">
            <svg ndsDataTableIcon kind="search" tone="muted"></svg>
            <input
              ndsInput
              type="search"
              class="nds-data-table-search-input"
              [value]="filtroGlobal()"
              [placeholder]="globalFilterPlaceholder()"
              [attr.aria-label]="globalFilterPlaceholder()"
              (input)="aoDigitarFiltroGlobal($event)"
            />
          </div>
        }

        @if (enableColumnVisibility()) {
          <div class="nds-data-table-columns-wrap">
            <nds-dropdown-menu>
              <!-- Duas diretivas no mesmo botão: o gatilho do menu e o visual do
                   botão. As duas ligam data-slot e uma sobrescreve a outra sem
                   ordem garantida (armadilha 11) — por isso o que identifica
                   este elemento em teste é a CLASSE, não o data-slot. -->
              <button
                ndsDropdownMenuTrigger
                ndsButton
                variant="outline"
                size="sm"
                class="nds-data-table-columns-btn"
              >
                <svg ndsDataTableIcon kind="settings"></svg>
                {{ rotulos().columns }}
              </button>

              <ng-template ndsDropdownMenuContent align="end">
                <div ndsDropdownMenuGroup class="nds-data-table-columns-menu-content">
                  <div ndsDropdownMenuLabel>{{ rotulos().showColumns }}</div>
                  <div ndsDropdownMenuSeparator></div>
                  @for (column of colunasOcultaveis(); track column.id) {
                    <div class="nds-data-table-columns-menu-row">
                      <div
                        ndsDropdownMenuCheckboxItem
                        class="nds-data-table-columns-menu-check"
                        [checked]="!ocultas().has(column.id)"
                        (checkedChange)="toggleVisibility(column.id, $event)"
                      >
                        {{ column.header }}
                      </div>
                    </div>
                  }
                </div>
              </ng-template>
            </nds-dropdown-menu>
          </div>
        }
      </div>
    }

    <div class="nds-data-table-scroll">
      <!-- Quem rola na horizontal é o wrapper do primitivo Table, que tem
           tabindex="0". O .nds-data-table-scroll é só moldura (borda e raio):
           ele NÃO está na ordem de tabulação, e rolar por ali deixaria as
           colunas de fora inalcançáveis para quem navega sem mouse
           (WCAG 2.1.1, regra scrollable-region-focusable do axe). -->
      <!-- O nome e o papel da região rolável andam juntos (guideline 20): a
           moldura tem tabindex zero, e região focável sem nome não diz o que
           é. O nome é o MESMO da legenda — quem chega ali por teclado ouve a
           tabela que está prestes a rolar. Sem legenda não há nome, e aí o
           primitivo não emite papel nenhum (aria-prohibited-attr). -->
      <div ndsTableWrapper [regionLabel]="caption()">
        <table ndsTable>
          @if (caption()) {
            <caption ndsTableCaption class="nds-sr-only">{{ caption() }}</caption>
          }

          <thead ndsTableHeader>
            <tr ndsTableRow>
              @if (enableRowSelection()) {
                <th ndsTableHead class="nds-data-table-th">
                  <div class="nds-data-table-th-inner">
                    <button
                      ndsCheckbox
                      [attr.aria-label]="rotulos().selectAll"
                      [checked]="todasDaPaginaSelecionadas()"
                      [indeterminate]="algumasDaPaginaSelecionadas()"
                      (checkedChange)="toggleAllOnPage($event)"
                    ></button>
                  </div>
                </th>
              }
              @for (column of visibleColumns(); track column.id) {
                <!-- Coluna numérica alinha à direita no CABEÇALHO também
                     (guideline 20). A utilitária resolve o cabeçalho sem botão;
                     o com botão quem resolve é a folha compartilhada, porque
                     alinhamento de texto não move item de flex. Ver o docblock
                     de numeric na definição de coluna. -->
                <th
                  ndsTableHead
                  class="nds-data-table-th"
                  [class.nds-text-right]="column.numeric"
                  [sort]="direcaoAria(column)"
                >
                  <div class="nds-data-table-th-inner">
                    @if (column.sortable) {
                      <button
                        type="button"
                        class="nds-data-table-sort-btn"
                        [attr.aria-label]="sortLabel(column)"
                        (click)="toggleSort(column.id)"
                      >
                        <span>{{ column.header }}</span>
                        <svg
                          ndsDataTableIcon
                          [kind]="sortIcon(column.id)"
                          [tone]="ordenacao()?.id === column.id ? 'default' : 'muted'"
                        ></svg>
                      </button>
                    } @else {
                      <div class="nds-data-table-th-label">{{ column.header }}</div>
                    }
                  </div>
                </th>
              }
            </tr>

            @if (showFilterRow()) {
              <tr ndsTableRow class="nds-data-table-filter-row">
                @if (enableRowSelection()) {
                  <th ndsTableHead>
                    <span class="nds-sr-only">{{ noFilterLabel(rotulos().selectAll) }}</span>
                  </th>
                }
                @for (column of visibleColumns(); track column.id) {
                  <th ndsTableHead>
                    <!-- Todo th da linha de filtros carrega texto para leitor de
                         tela. O valor de um input NÃO entra no nome acessível da
                         célula, então uma célula que só tem o campo chega ao axe
                         como cabeçalho vazio (empty-table-header). -->
                    @if (column.filter) {
                      <span class="nds-sr-only">{{ filterLabel(column) }}</span>
                      @if (column.filter.type === 'select') {
                        <select
                          class="nds-data-table-filter-select"
                          [attr.aria-label]="filterLabel(column)"
                          (change)="aoEscolherFiltro(column.id, $event)"
                        >
                          <option value="">{{ rotulos().allOption }}</option>
                          @for (option of column.filter.options ?? []; track option) {
                            <option [value]="option" [selected]="columnFilterValue(column.id) === option">
                              {{ option }}
                            </option>
                          }
                        </select>
                      } @else {
                        <input
                          ndsInput
                          class="nds-data-table-filter-input"
                          [value]="columnFilterValue(column.id)"
                          [placeholder]="column.filter.placeholder ?? rotulos().filterPlaceholder"
                          [attr.aria-label]="filterLabel(column)"
                          (input)="onColumnFilterInput(column.id, $event)"
                        />
                      }
                    } @else {
                      <span class="nds-sr-only">{{ noFilterLabel(column.header) }}</span>
                    }
                  </th>
                }
              </tr>
            }
          </thead>

          <tbody ndsTableBody>
            @for (line of pageRows(); track line.key) {
              <tr
                ndsTableRow
                class="nds-data-table-tr"
                [selected]="selecionadas().has(line.key)"
              >
                @if (enableRowSelection()) {
                  <td ndsTableCell class="nds-data-table-td">
                    <button
                      ndsCheckbox
                      [attr.aria-label]="line.selectLabel"
                      [checked]="selecionadas().has(line.key)"
                      (checkedChange)="toggleSelection(line.key, $event)"
                    ></button>
                  </td>
                }
                @for (celula of line.celulas; track celula.columnId) {
                  <td
                    ndsTableCell
                    class="nds-data-table-td"
                    [class.nds-text-right]="celula.numeric"
                    [class.nds-tabular-nums]="celula.numeric"
                  >
                    @if (celula.editable) {
                      <div class="nds-data-table-editable">
                        @if (emEdicao() === celula.key) {
                          <input
                            #campoDeEdicao
                            ndsInput
                            class="nds-data-table-edit-input"
                            [value]="rascunho()"
                            [attr.aria-label]="celula.editLabel"
                            (input)="aoDigitarEdicao($event)"
                            (blur)="confirmarEdicao(line, celula)"
                            (keydown)="aoTeclarNaEdicao($event, line, celula)"
                          />
                        } @else {
                          <button
                            type="button"
                            class="nds-data-table-edit-btn"
                            [attr.aria-label]="celula.editLabel"
                            (click)="openEdit(celula)"
                          >
                            {{ celula.text }}
                          </button>
                        }
                      </div>
                    } @else if (celula.badge; as badgeVariant) {
                      <!-- Selo semântico: a variante veio da coluna, que a
                           decidiu pela chave estável do domínio. A cor sozinha
                           não informa, e por isso o TEXTO continua dentro do
                           selo — ele é que nomeia o estado. -->
                      <span ndsBadge [variant]="badgeVariant">{{ celula.text }}</span>
                    } @else {
                      {{ celula.text }}
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr ndsTableRow>
                <!-- colspan derivado das colunas visíveis: número escrito à mão
                     deixaria a mensagem torta assim que uma coluna sumisse pelo
                     menu de visibilidade. -->
                <td ndsTableCell class="nds-data-table-empty" [attr.colspan]="totalDeColunas()">
                  {{ emptyMessage() }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showPagination()) {
      <div class="nds-data-table-pagination" data-slot="data-table-pagination">
        <div class="nds-data-table-pagination-count">{{ contagemText() }}</div>

        <div class="nds-data-table-pagination-controls">
          <div class="nds-data-table-page-size">
            <span>{{ rotulos().rowsPerPage }}</span>
            <select
              class="nds-data-table-page-size-select"
              [attr.aria-label]="rotulos().rowsPerPage"
              (change)="onPageSizeChange($event)"
            >
              @for (option of pageSizeOptions(); track option) {
                <option [value]="option" [selected]="option === currentPageSize()">{{ option }}</option>
              }
            </select>
          </div>

          <div class="nds-data-table-pagination-count">
            {{ rotulos().page }} {{ currentPage() + 1 }} {{ rotulos().pageOf }} {{ totalDePaginas() }}
          </div>

          <div class="nds-data-table-pagination-nav">
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().firstPage"
              [disabled]="!podeVoltar()"
              (click)="goToPage(0)"
            ><svg ndsDataTableIcon kind="chevrons-left"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().prevPage"
              [disabled]="!podeVoltar()"
              (click)="goToPage(currentPage() - 1)"
            ><svg ndsDataTableIcon kind="chevron-left"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().nextPage"
              [disabled]="!podeAvancar()"
              (click)="goToPage(currentPage() + 1)"
            ><svg ndsDataTableIcon kind="chevron-right"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().lastPage"
              [disabled]="!podeAvancar()"
              (click)="goToPage(totalDePaginas() - 1)"
            ><svg ndsDataTableIcon kind="chevrons-right"></svg></button>
          </div>
        </div>
      </div>
    }

    @if (enableRowSelection()) {
      <!-- Uma tabela que só muda de COR ao selecionar é muda para quem não vê.
           A região viva anuncia a contagem a cada mudança; ela existe mesmo com
           a paginação desligada, que é onde o número não aparece em lugar
           nenhum da tela. -->
      <div class="nds-sr-only" role="status" aria-live="polite">{{ selectionText() }}</div>
    }
  `,
})
export class NdsDataTable<TData> implements OnInit {
  // ─── Entradas ───────────────────────────────────────────────────────────────

  readonly columns = input.required<readonly DataTableColumn<TData>[]>();
  readonly data = input.required<readonly TData[]>();

  /**
   * Identificador estável da linha. O índice do array seria suficiente até a
   * primeira ordenação: com ele, ordenar moveria a seleção de linha.
   */
  readonly rowKey = input<(row: TData, index: number) => string>(
    (_row, index) => String(index),
  );

  /**
   * Texto que identifica a linha no rótulo do checkbox de seleção. Sem ele o
   * identificador sai da primeira coluna e, se ela vier vazia, da chave da
   * linha (a cadeia está em `linhasBrutas`).
   */
  readonly rowLabel = input<((row: TData) => string) | undefined>(undefined);

  /** Nome acessível da tabela. Vira `<caption>` fora da tela. */
  readonly caption = input<string>('');

  readonly enableGlobalFilter = input(true, { transform: booleanAttribute });
  readonly globalFilterPlaceholder = input('Buscar...');
  readonly enableRowSelection = input(false, { transform: booleanAttribute });
  readonly enableColumnVisibility = input(true, { transform: booleanAttribute });
  readonly enableColumnFilters = input(false, { transform: booleanAttribute });
  readonly enablePagination = input(true, { transform: booleanAttribute });
  readonly pageSize = input(10, { transform: numberAttribute });
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  readonly emptyMessage = input('Sem resultados.');
  readonly labels = input<Partial<DataTableLabels>>({});

  // ─── Saídas ─────────────────────────────────────────────────────────────────

  /** Edição inline confirmada. Quem consome atualiza o array de dados. */
  readonly cellEdit = output<DataTableCellEdit>();
  /** Linhas selecionadas, na ordem em que estão nos dados. */
  readonly selectionChange = output<readonly TData[]>();

  // ─── Estado ─────────────────────────────────────────────────────────────────

  protected readonly ordenacao = signal<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  protected readonly filtroGlobal = signal('');
  protected readonly filtersByColumn = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly ocultas = signal<ReadonlySet<string>>(new Set());
  protected readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  protected readonly currentPage = signal(0);
  protected readonly currentPageSize = signal(10);
  protected readonly emEdicao = signal<string | null>(null);
  protected readonly rascunho = signal('');

  private readonly editField = viewChild<ElementRef<HTMLInputElement>>('campoDeEdicao');

  constructor() {
    // O foco vai para o campo assim que ele existe. Sem isso, abrir a edição
    // exigiria um segundo clique — e quem chegou pelo teclado ficaria com o
    // foco no botão que acabou de sumir do DOM.
    effect(() => {
      const field = this.editField();
      if (!field) return;
      field.nativeElement.focus();
      field.nativeElement.select();
    });
  }

  ngOnInit(): void {
    // Ler `input()` no construtor devolveria o DEFAULT: o binding de quem
    // consome ainda não foi aplicado (armadilha 9 do CLAUDE.md deste stack).
    this.currentPageSize.set(this.pageSize());
  }

  // ─── Rótulos ────────────────────────────────────────────────────────────────

  protected readonly rotulos = computed<DataTableLabels>(() => ({
    ...DATA_TABLE_LABELS_DEFAULT,
    ...this.labels(),
  }));

  protected sortLabel(column: DataTableColumn<TData>): string {
    return preencher(this.rotulos().sortBy, { col: column.header });
  }

  protected filterLabel(column: DataTableColumn<TData>): string {
    return preencher(this.rotulos().filter, { col: column.header });
  }

  protected noFilterLabel(col: string): string {
    return preencher(this.rotulos().noFilter, { col });
  }

  // ─── Colunas ────────────────────────────────────────────────────────────────

  protected readonly visibleColumns = computed(() => {
    const escondidas = this.ocultas();
    return this.columns().filter((c) => !escondidas.has(c.id));
  });

  protected readonly colunasOcultaveis = computed(() =>
    this.columns().filter((c) => c.hideable !== false),
  );

  /** Colunas visíveis mais a de seleção, quando existe — base do `colspan`. */
  protected readonly totalDeColunas = computed(
    () => this.visibleColumns().length + (this.enableRowSelection() ? 1 : 0),
  );

  protected readonly showToolbar = computed(
    () => this.enableGlobalFilter() || this.enableColumnVisibility(),
  );

  protected readonly showFilterRow = computed(
    () => this.enableColumnFilters() && this.visibleColumns().some((c) => !!c.filter),
  );

  // ─── Derivação: bruto → filtrado → ordenado → paginado ──────────────────────

  private text(column: DataTableColumn<TData>, row: TData): string {
    const value = column.accessor(row);
    if (column.format) return column.format(value, row);
    // Nunca a string "undefined" numa célula: travessão é o vazio tipográfico,
    // e é o que as outras stacks mostram.
    return value === null || value === undefined || value === '' ? CELL_VAZIA : String(value);
  }

  private readonly linhasBrutas = computed<LineRenderizada[]>(() => {
    const colunas = this.visibleColumns();
    const all = this.columns();
    const keyOf = this.rowKey();
    const labelOf = this.rowLabel();
    const modeloSelection = this.rotulos().selectRow;
    const modeloEdit = this.rotulos().edit;

    return this.data().map((row, index) => {
      const key = keyOf(row, index);
      // Cadeia do rótulo da linha, a mesma nas cinco stacks:
      //  1. `rowLabel`, quando quem usa souber qual campo identifica a linha;
      //  2. o valor da PRIMEIRA coluna — é ela que identifica a linha na leitura
      //     visual, então é o mesmo texto que a pessoa vidente usaria;
      //  3. a chave da linha, quando a primeira coluna vem vazia.
      // Nunca cai em "Selecionar linha" puro: nome repetido em doze controles é o
      // mesmo que nome nenhum (WCAG 4.1.2).
      const ofFirstColumn = all.length > 0 ? this.text(all[0], row) : CELL_VAZIA;
      const label =
        labelOf?.(row) || (ofFirstColumn === CELL_VAZIA ? key : ofFirstColumn);
      return {
        key,
        index,
        label,
        selectLabel: preencher(modeloSelection, { row: label }),
        // A busca livre casa em TODA coluna, inclusive nas escondidas pelo
        // menu: esconder uma coluna é decisão de leitura, não de escopo.
        search: all.map((c) => this.text(c, row)).join(' ').toLowerCase(),
        celulas: colunas.map((c) => ({
          columnId: c.id,
          header: c.header,
          text: this.text(c, row),
          // O rascunho da edição parte do valor CRU: abrir o campo com
          // "R$ 250,00" faria a pessoa editar a formatação, e o commit
          // devolveria NaN para uma coluna que é número.
          raw: (() => {
            const v = c.accessor(row);
            return v === null || v === undefined ? '' : String(v);
          })(),
          numeric: !!c.numeric,
          badge: c.badge ? (c.badge(c.accessor(row), row) ?? null) : null,
          editable: !!c.editable,
          editLabel: preencher(modeloEdit, { col: c.header }),
          key: `${key}:${c.id}`,
        })),
      };
    });
  });

  private readonly linhasFiltradas = computed(() => {
    const search = this.filtroGlobal().trim().toLowerCase();
    const byColumn = this.filtersByColumn();
    const colunas = this.columns();
    const data = this.data();

    return this.linhasBrutas().filter((line) => {
      if (search && !line.search.includes(search)) return false;
      for (const [columnId, value] of byColumn) {
        if (!value) continue;
        const column = colunas.find((c) => c.id === columnId);
        if (!column) continue;
        const text = this.text(column, data[line.index]);
        const casa = column.filter?.type === 'select'
          ? text === value
          : text.toLowerCase().includes(value.toLowerCase());
        if (!casa) return false;
      }
      return true;
    });
  });

  private readonly linhasOrdenadas = computed(() => {
    const order = this.ordenacao();
    const lines = this.linhasFiltradas();
    if (!order) return lines;

    const column = this.columns().find((c) => c.id === order.id);
    if (!column) return lines;

    const data = this.data();
    const sinal = order.dir === 'asc' ? 1 : -1;
    return [...lines].sort((a, b) => {
      const va = column.accessor(data[a.index]);
      const vb = column.accessor(data[b.index]);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sinal;
      return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true }) * sinal;
    });
  });

  protected readonly totalDePaginas = computed(() => {
    if (!this.showPagination()) return 1;
    return Math.max(1, Math.ceil(this.linhasOrdenadas().length / this.currentPageSize()));
  });

  protected readonly pageRows = computed(() => {
    const lines = this.linhasOrdenadas();
    if (!this.showPagination()) return lines;
    // A página é limitada aqui, e não por efeito colateral: um filtro que
    // encurta o resultado enquanto se está na última página deixaria o índice
    // apontando para o vazio, e a tabela pareceria não ter achado nada.
    const page = Math.min(this.currentPage(), this.totalDePaginas() - 1);
    const start = page * this.currentPageSize();
    return lines.slice(start, start + this.currentPageSize());
  });

  protected readonly showPagination = computed(() => this.enablePagination());

  protected readonly podeVoltar = computed(() => this.currentPage() > 0);
  protected readonly podeAvancar = computed(
    () => this.currentPage() < this.totalDePaginas() - 1,
  );

  // ─── Ordenação ──────────────────────────────────────────────────────────────

  protected direcaoAria(column: DataTableColumn<TData>): TableSortDirection | undefined {
    // Coluna que não ordena não anuncia ordenação: `aria-sort="none"` prometeria
    // uma capacidade que ela não tem.
    if (!column.sortable) return undefined;
    const order = this.ordenacao();
    if (order?.id !== column.id) return 'none';
    return order.dir === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(id: string): DataTableIconKind {
    const order = this.ordenacao();
    if (order?.id !== id) return 'arrow-up-down';
    return order.dir === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  /** Três estados, como nas outras stacks: ascendente → descendente → nenhum. */
  protected toggleSort(id: string): void {
    const order = this.ordenacao();
    if (order?.id !== id) this.ordenacao.set({ id, dir: 'asc' });
    else if (order.dir === 'asc') this.ordenacao.set({ id, dir: 'desc' });
    else this.ordenacao.set(null);
  }

  // ─── Filtros ────────────────────────────────────────────────────────────────

  protected columnFilterValue(id: string): string {
    return this.filtersByColumn().get(id) ?? '';
  }

  protected aoDigitarFiltroGlobal(evento: Event): void {
    this.filtroGlobal.set((evento.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  protected onColumnFilterInput(id: string, evento: Event): void {
    this.definirFiltro(id, (evento.target as HTMLInputElement).value);
  }

  protected aoEscolherFiltro(id: string, evento: Event): void {
    this.definirFiltro(id, (evento.target as HTMLSelectElement).value);
  }

  private definirFiltro(id: string, value: string): void {
    const next = new Map(this.filtersByColumn());
    if (value) next.set(id, value);
    else next.delete(id);
    this.filtersByColumn.set(next);
    this.currentPage.set(0);
  }

  // ─── Visibilidade ───────────────────────────────────────────────────────────

  /**
   * O item de marcação do menu emite TRÊS estados, não dois: além de ligado e
   * desligado existe o misto. Assinar `boolean` deixava o compilador de
   * templates sem como provar a chamada, e um `'indeterminate'` chegando aqui
   * ocultaria a coluna — porque só `true` é verdadeiro numa comparação estrita,
   * e misto não quer dizer "escondida".
   */
  protected toggleVisibility(id: string, visible: CheckedState): void {
    const next = new Set(this.ocultas());
    if (visible !== false) next.delete(id);
    else next.add(id);
    this.ocultas.set(next);
  }

  // ─── Seleção ────────────────────────────────────────────────────────────────

  protected readonly todasDaPaginaSelecionadas = computed(() => {
    const page = this.pageRows();
    if (page.length === 0) return false;
    const checked = this.selecionadas();
    return page.every((l) => checked.has(l.key));
  });

  protected readonly algumasDaPaginaSelecionadas = computed(() => {
    const page = this.pageRows();
    const checked = this.selecionadas();
    const quantas = page.filter((l) => checked.has(l.key)).length;
    return quantas > 0 && quantas < page.length;
  });

  protected toggleSelection(key: string, marcada: boolean): void {
    const next = new Set(this.selecionadas());
    if (marcada) next.add(key);
    else next.delete(key);
    this.selecionadas.set(next);
    this.emitirSelecao(next);
  }

  protected toggleAllOnPage(marcada: boolean): void {
    const next = new Set(this.selecionadas());
    for (const line of this.pageRows()) {
      if (marcada) next.add(line.key);
      else next.delete(line.key);
    }
    this.selecionadas.set(next);
    this.emitirSelecao(next);
  }

  private emitirSelecao(chaves: ReadonlySet<string>): void {
    const data = this.data();
    this.selectionChange.emit(
      this.linhasBrutas().filter((l) => chaves.has(l.key)).map((l) => data[l.index]),
    );
  }

  protected readonly selectionText = computed(() =>
    preencher(this.rotulos().rowsSelected, {
      s: this.linhasFiltradas().filter((l) => this.selecionadas().has(l.key)).length,
      n: this.linhasFiltradas().length,
    }),
  );

  protected readonly contagemText = computed(() =>
    this.enableRowSelection()
      ? this.selectionText()
      : preencher(this.rotulos().rowsTotal, { n: this.linhasFiltradas().length }),
  );

  // ─── Paginação ──────────────────────────────────────────────────────────────

  protected goToPage(index: number): void {
    this.currentPage.set(Math.max(0, Math.min(index, this.totalDePaginas() - 1)));
  }

  protected onPageSizeChange(evento: Event): void {
    this.currentPageSize.set(Number((evento.target as HTMLSelectElement).value));
    this.currentPage.set(0);
  }

  // ─── Edição inline ──────────────────────────────────────────────────────────

  protected openEdit(celula: CellRenderizada): void {
    this.rascunho.set(celula.raw);
    this.emEdicao.set(celula.key);
  }

  protected aoDigitarEdicao(evento: Event): void {
    this.rascunho.set((evento.target as HTMLInputElement).value);
  }

  protected confirmarEdicao(line: LineRenderizada, celula: CellRenderizada): void {
    if (this.emEdicao() !== celula.key) return;
    this.emEdicao.set(null);

    const column = this.columns().find((c) => c.id === celula.columnId);
    const previous = column?.accessor(this.data()[line.index]);
    const raw = this.rascunho();
    // O tipo do valor anterior manda: uma coluna numérica que voltasse como
    // string reordenaria por texto na próxima ordenação, sem erro nenhum.
    const value = typeof previous === 'number' ? Number(raw) : raw;

    this.cellEdit.emit({ rowIndex: line.index, columnId: celula.columnId, value: value });
  }

  protected aoTeclarNaEdicao(
    evento: KeyboardEvent,
    line: LineRenderizada,
    celula: CellRenderizada,
  ): void {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      this.confirmarEdicao(line, celula);
    } else if (evento.key === 'Escape') {
      // Cancela ANTES do blur: fechar o campo dispara `blur`, e sem zerar o
      // estado o handler de confirmação salvaria o rascunho descartado.
      this.emEdicao.set(null);
      this.rascunho.set('');
    }
  }
}
