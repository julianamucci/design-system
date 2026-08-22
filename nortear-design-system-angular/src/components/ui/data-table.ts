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
   * Coluna numérica: a CÉLULA alinha à direita.
   *
   * O CABEÇALHO não acompanha, e isso vale para as cinco stacks: no CSS
   * compartilhado `.nds-table th` declara `text-align: left` com
   * especificidade (0,1,1), acima da utilitária `.nds-text-right` (0,1,0).
   * Escrever a classe no `<th>` não faria nada — por isso ela não é escrita.
   */
  numeric?: boolean;
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

export const DATA_TABLE_LABELS_PADRAO: DataTableLabels = {
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

function preencher(modelo: string, valores: Record<string, string | number>): string {
  let saida = modelo;
  for (const [chave, valor] of Object.entries(valores)) {
    saida = saida.split(`{${chave}}`).join(String(valor));
  }
  return saida;
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
  colunaId: string;
  header: string;
  texto: string;
  /** Valor sem formatação — é ele que entra no campo de edição. */
  bruto: string;
  numeric: boolean;
  editable: boolean;
  rotuloEdicao: string;
  /** `linha:coluna` — identifica a célula que está em edição. */
  chave: string;
}

interface LineRenderizada {
  chave: string;
  indice: number;
  rotulo: string;
  rotuloSelecao: string;
  busca: string;
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
    NdsButton, NdsCheckbox, NdsInput, NdsDataTableIcon,
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
    @if (mostrarToolbar()) {
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
                  @for (coluna of colunasOcultaveis(); track coluna.id) {
                    <div class="nds-data-table-columns-menu-row">
                      <div
                        ndsDropdownMenuCheckboxItem
                        class="nds-data-table-columns-menu-check"
                        [checked]="!ocultas().has(coluna.id)"
                        (checkedChange)="alternarVisibilidade(coluna.id, $event)"
                      >
                        {{ coluna.header }}
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
      <div ndsTableWrapper>
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
                      (checkedChange)="alternarTodasDaPagina($event)"
                    ></button>
                  </div>
                </th>
              }
              @for (coluna of colunasVisiveis(); track coluna.id) {
                <th ndsTableHead class="nds-data-table-th" [sort]="direcaoAria(coluna)">
                  <div class="nds-data-table-th-inner">
                    @if (coluna.sortable) {
                      <button
                        type="button"
                        class="nds-data-table-sort-btn"
                        [attr.aria-label]="rotuloOrdenar(coluna)"
                        (click)="alternarOrdenacao(coluna.id)"
                      >
                        <span>{{ coluna.header }}</span>
                        <svg
                          ndsDataTableIcon
                          [kind]="iconeDaOrdem(coluna.id)"
                          [tone]="ordenacao()?.id === coluna.id ? 'default' : 'muted'"
                        ></svg>
                      </button>
                    } @else {
                      <div class="nds-data-table-th-label">{{ coluna.header }}</div>
                    }
                  </div>
                </th>
              }
            </tr>

            @if (mostrarLinhaDeFiltros()) {
              <tr ndsTableRow class="nds-data-table-filter-row">
                @if (enableRowSelection()) {
                  <th ndsTableHead>
                    <span class="nds-sr-only">{{ rotuloSemFiltro(rotulos().selectAll) }}</span>
                  </th>
                }
                @for (coluna of colunasVisiveis(); track coluna.id) {
                  <th ndsTableHead>
                    <!-- Todo th da linha de filtros carrega texto para leitor de
                         tela. O valor de um input NÃO entra no nome acessível da
                         célula, então uma célula que só tem o campo chega ao axe
                         como cabeçalho vazio (empty-table-header). -->
                    @if (coluna.filter) {
                      <span class="nds-sr-only">{{ rotuloFiltrar(coluna) }}</span>
                      @if (coluna.filter.type === 'select') {
                        <select
                          class="nds-data-table-filter-select"
                          [attr.aria-label]="rotuloFiltrar(coluna)"
                          (change)="aoEscolherFiltro(coluna.id, $event)"
                        >
                          <option value="">{{ rotulos().allOption }}</option>
                          @for (opcao of coluna.filter.options ?? []; track opcao) {
                            <option [value]="opcao" [selected]="filtroDaColuna(coluna.id) === opcao">
                              {{ opcao }}
                            </option>
                          }
                        </select>
                      } @else {
                        <input
                          ndsInput
                          class="nds-data-table-filter-input"
                          [value]="filtroDaColuna(coluna.id)"
                          [placeholder]="coluna.filter.placeholder ?? rotulos().filterPlaceholder"
                          [attr.aria-label]="rotuloFiltrar(coluna)"
                          (input)="aoDigitarFiltroDeColuna(coluna.id, $event)"
                        />
                      }
                    } @else {
                      <span class="nds-sr-only">{{ rotuloSemFiltro(coluna.header) }}</span>
                    }
                  </th>
                }
              </tr>
            }
          </thead>

          <tbody ndsTableBody>
            @for (linha of linhasDaPagina(); track linha.chave) {
              <tr
                ndsTableRow
                class="nds-data-table-tr"
                [selected]="selecionadas().has(linha.chave)"
              >
                @if (enableRowSelection()) {
                  <td ndsTableCell class="nds-data-table-td">
                    <button
                      ndsCheckbox
                      [attr.aria-label]="linha.rotuloSelecao"
                      [checked]="selecionadas().has(linha.chave)"
                      (checkedChange)="alternarSelecao(linha.chave, $event)"
                    ></button>
                  </td>
                }
                @for (celula of linha.celulas; track celula.colunaId) {
                  <td
                    ndsTableCell
                    class="nds-data-table-td"
                    [class.nds-text-right]="celula.numeric"
                    [class.nds-tabular-nums]="celula.numeric"
                  >
                    @if (celula.editable) {
                      <div class="nds-data-table-editable">
                        @if (emEdicao() === celula.chave) {
                          <input
                            #campoDeEdicao
                            ndsInput
                            class="nds-data-table-edit-input"
                            [value]="rascunho()"
                            [attr.aria-label]="celula.rotuloEdicao"
                            (input)="aoDigitarEdicao($event)"
                            (blur)="confirmarEdicao(linha, celula)"
                            (keydown)="aoTeclarNaEdicao($event, linha, celula)"
                          />
                        } @else {
                          <button
                            type="button"
                            class="nds-data-table-edit-btn"
                            [attr.aria-label]="celula.rotuloEdicao"
                            (click)="abrirEdicao(celula)"
                          >
                            {{ celula.texto }}
                          </button>
                        }
                      </div>
                    } @else {
                      {{ celula.texto }}
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

    @if (mostrarPaginacao()) {
      <div class="nds-data-table-pagination" data-slot="data-table-pagination">
        <div class="nds-data-table-pagination-count">{{ textoDaContagem() }}</div>

        <div class="nds-data-table-pagination-controls">
          <div class="nds-data-table-page-size">
            <span>{{ rotulos().rowsPerPage }}</span>
            <select
              class="nds-data-table-page-size-select"
              [attr.aria-label]="rotulos().rowsPerPage"
              (change)="aoTrocarTamanhoDePagina($event)"
            >
              @for (opcao of pageSizeOptions(); track opcao) {
                <option [value]="opcao" [selected]="opcao === tamanhoDePagina()">{{ opcao }}</option>
              }
            </select>
          </div>

          <div class="nds-data-table-pagination-count">
            {{ rotulos().page }} {{ paginaAtual() + 1 }} {{ rotulos().pageOf }} {{ totalDePaginas() }}
          </div>

          <div class="nds-data-table-pagination-nav">
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().firstPage"
              [disabled]="!podeVoltar()"
              (click)="irParaPagina(0)"
            ><svg ndsDataTableIcon kind="chevrons-left"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().prevPage"
              [disabled]="!podeVoltar()"
              (click)="irParaPagina(paginaAtual() - 1)"
            ><svg ndsDataTableIcon kind="chevron-left"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().nextPage"
              [disabled]="!podeAvancar()"
              (click)="irParaPagina(paginaAtual() + 1)"
            ><svg ndsDataTableIcon kind="chevron-right"></svg></button>
            <button
              ndsButton variant="outline" size="icon"
              [attr.aria-label]="rotulos().lastPage"
              [disabled]="!podeAvancar()"
              (click)="irParaPagina(totalDePaginas() - 1)"
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
      <div class="nds-sr-only" role="status" aria-live="polite">{{ textoDaSelecao() }}</div>
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
  protected readonly filtrosPorColuna = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly ocultas = signal<ReadonlySet<string>>(new Set());
  protected readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  protected readonly paginaAtual = signal(0);
  protected readonly tamanhoDePagina = signal(10);
  protected readonly emEdicao = signal<string | null>(null);
  protected readonly rascunho = signal('');

  private readonly campoDeEdicao = viewChild<ElementRef<HTMLInputElement>>('campoDeEdicao');

  constructor() {
    // O foco vai para o campo assim que ele existe. Sem isso, abrir a edição
    // exigiria um segundo clique — e quem chegou pelo teclado ficaria com o
    // foco no botão que acabou de sumir do DOM.
    effect(() => {
      const campo = this.campoDeEdicao();
      if (!campo) return;
      campo.nativeElement.focus();
      campo.nativeElement.select();
    });
  }

  ngOnInit(): void {
    // Ler `input()` no construtor devolveria o DEFAULT: o binding de quem
    // consome ainda não foi aplicado (armadilha 9 do CLAUDE.md deste stack).
    this.tamanhoDePagina.set(this.pageSize());
  }

  // ─── Rótulos ────────────────────────────────────────────────────────────────

  protected readonly rotulos = computed<DataTableLabels>(() => ({
    ...DATA_TABLE_LABELS_PADRAO,
    ...this.labels(),
  }));

  protected rotuloOrdenar(coluna: DataTableColumn<TData>): string {
    return preencher(this.rotulos().sortBy, { col: coluna.header });
  }

  protected rotuloFiltrar(coluna: DataTableColumn<TData>): string {
    return preencher(this.rotulos().filter, { col: coluna.header });
  }

  protected rotuloSemFiltro(col: string): string {
    return preencher(this.rotulos().noFilter, { col });
  }

  // ─── Colunas ────────────────────────────────────────────────────────────────

  protected readonly colunasVisiveis = computed(() => {
    const escondidas = this.ocultas();
    return this.columns().filter((c) => !escondidas.has(c.id));
  });

  protected readonly colunasOcultaveis = computed(() =>
    this.columns().filter((c) => c.hideable !== false),
  );

  /** Colunas visíveis mais a de seleção, quando existe — base do `colspan`. */
  protected readonly totalDeColunas = computed(
    () => this.colunasVisiveis().length + (this.enableRowSelection() ? 1 : 0),
  );

  protected readonly mostrarToolbar = computed(
    () => this.enableGlobalFilter() || this.enableColumnVisibility(),
  );

  protected readonly mostrarLinhaDeFiltros = computed(
    () => this.enableColumnFilters() && this.colunasVisiveis().some((c) => !!c.filter),
  );

  // ─── Derivação: bruto → filtrado → ordenado → paginado ──────────────────────

  private texto(coluna: DataTableColumn<TData>, row: TData): string {
    const valor = coluna.accessor(row);
    if (coluna.format) return coluna.format(valor, row);
    // Nunca a string "undefined" numa célula: travessão é o vazio tipográfico,
    // e é o que as outras stacks mostram.
    return valor === null || valor === undefined || valor === '' ? CELL_VAZIA : String(valor);
  }

  private readonly linhasBrutas = computed<LineRenderizada[]>(() => {
    const colunas = this.colunasVisiveis();
    const todas = this.columns();
    const keyOf = this.rowKey();
    const labelOf = this.rowLabel();
    const modeloSelection = this.rotulos().selectRow;
    const modeloEdit = this.rotulos().edit;

    return this.data().map((row, indice) => {
      const chave = keyOf(row, indice);
      // Cadeia do rótulo da linha, a mesma nas cinco stacks:
      //  1. `rowLabel`, quando quem usa souber qual campo identifica a linha;
      //  2. o valor da PRIMEIRA coluna — é ela que identifica a linha na leitura
      //     visual, então é o mesmo texto que a pessoa vidente usaria;
      //  3. a chave da linha, quando a primeira coluna vem vazia.
      // Nunca cai em "Selecionar linha" puro: nome repetido em doze controles é o
      // mesmo que nome nenhum (WCAG 4.1.2).
      const ofFirstColumn = todas.length > 0 ? this.texto(todas[0], row) : CELL_VAZIA;
      const rotulo =
        labelOf?.(row) || (ofFirstColumn === CELL_VAZIA ? chave : ofFirstColumn);
      return {
        chave,
        indice,
        rotulo,
        rotuloSelecao: preencher(modeloSelection, { row: rotulo }),
        // A busca livre casa em TODA coluna, inclusive nas escondidas pelo
        // menu: esconder uma coluna é decisão de leitura, não de escopo.
        busca: todas.map((c) => this.texto(c, row)).join(' ').toLowerCase(),
        celulas: colunas.map((c) => ({
          colunaId: c.id,
          header: c.header,
          texto: this.texto(c, row),
          // O rascunho da edição parte do valor CRU: abrir o campo com
          // "R$ 250,00" faria a pessoa editar a formatação, e o commit
          // devolveria NaN para uma coluna que é número.
          bruto: (() => {
            const v = c.accessor(row);
            return v === null || v === undefined ? '' : String(v);
          })(),
          numeric: !!c.numeric,
          editable: !!c.editable,
          rotuloEdicao: preencher(modeloEdit, { col: c.header }),
          chave: `${chave}:${c.id}`,
        })),
      };
    });
  });

  private readonly linhasFiltradas = computed(() => {
    const busca = this.filtroGlobal().trim().toLowerCase();
    const byColumn = this.filtrosPorColuna();
    const colunas = this.columns();
    const dados = this.data();

    return this.linhasBrutas().filter((linha) => {
      if (busca && !linha.busca.includes(busca)) return false;
      for (const [colunaId, valor] of byColumn) {
        if (!valor) continue;
        const coluna = colunas.find((c) => c.id === colunaId);
        if (!coluna) continue;
        const texto = this.texto(coluna, dados[linha.indice]);
        const casa = coluna.filter?.type === 'select'
          ? texto === valor
          : texto.toLowerCase().includes(valor.toLowerCase());
        if (!casa) return false;
      }
      return true;
    });
  });

  private readonly linhasOrdenadas = computed(() => {
    const ordem = this.ordenacao();
    const linhas = this.linhasFiltradas();
    if (!ordem) return linhas;

    const coluna = this.columns().find((c) => c.id === ordem.id);
    if (!coluna) return linhas;

    const dados = this.data();
    const sinal = ordem.dir === 'asc' ? 1 : -1;
    return [...linhas].sort((a, b) => {
      const va = coluna.accessor(dados[a.indice]);
      const vb = coluna.accessor(dados[b.indice]);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sinal;
      return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true }) * sinal;
    });
  });

  protected readonly totalDePaginas = computed(() => {
    if (!this.mostrarPaginacao()) return 1;
    return Math.max(1, Math.ceil(this.linhasOrdenadas().length / this.tamanhoDePagina()));
  });

  protected readonly linhasDaPagina = computed(() => {
    const linhas = this.linhasOrdenadas();
    if (!this.mostrarPaginacao()) return linhas;
    // A página é limitada aqui, e não por efeito colateral: um filtro que
    // encurta o resultado enquanto se está na última página deixaria o índice
    // apontando para o vazio, e a tabela pareceria não ter achado nada.
    const pagina = Math.min(this.paginaAtual(), this.totalDePaginas() - 1);
    const inicio = pagina * this.tamanhoDePagina();
    return linhas.slice(inicio, inicio + this.tamanhoDePagina());
  });

  protected readonly mostrarPaginacao = computed(() => this.enablePagination());

  protected readonly podeVoltar = computed(() => this.paginaAtual() > 0);
  protected readonly podeAvancar = computed(
    () => this.paginaAtual() < this.totalDePaginas() - 1,
  );

  // ─── Ordenação ──────────────────────────────────────────────────────────────

  protected direcaoAria(coluna: DataTableColumn<TData>): TableSortDirection | undefined {
    // Coluna que não ordena não anuncia ordenação: `aria-sort="none"` prometeria
    // uma capacidade que ela não tem.
    if (!coluna.sortable) return undefined;
    const ordem = this.ordenacao();
    if (ordem?.id !== coluna.id) return 'none';
    return ordem.dir === 'asc' ? 'ascending' : 'descending';
  }

  protected iconeDaOrdem(id: string): DataTableIconKind {
    const ordem = this.ordenacao();
    if (ordem?.id !== id) return 'arrow-up-down';
    return ordem.dir === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  /** Três estados, como nas outras stacks: ascendente → descendente → nenhum. */
  protected alternarOrdenacao(id: string): void {
    const ordem = this.ordenacao();
    if (ordem?.id !== id) this.ordenacao.set({ id, dir: 'asc' });
    else if (ordem.dir === 'asc') this.ordenacao.set({ id, dir: 'desc' });
    else this.ordenacao.set(null);
  }

  // ─── Filtros ────────────────────────────────────────────────────────────────

  protected filtroDaColuna(id: string): string {
    return this.filtrosPorColuna().get(id) ?? '';
  }

  protected aoDigitarFiltroGlobal(evento: Event): void {
    this.filtroGlobal.set((evento.target as HTMLInputElement).value);
    this.paginaAtual.set(0);
  }

  protected aoDigitarFiltroDeColuna(id: string, evento: Event): void {
    this.definirFiltro(id, (evento.target as HTMLInputElement).value);
  }

  protected aoEscolherFiltro(id: string, evento: Event): void {
    this.definirFiltro(id, (evento.target as HTMLSelectElement).value);
  }

  private definirFiltro(id: string, valor: string): void {
    const proximo = new Map(this.filtrosPorColuna());
    if (valor) proximo.set(id, valor);
    else proximo.delete(id);
    this.filtrosPorColuna.set(proximo);
    this.paginaAtual.set(0);
  }

  // ─── Visibilidade ───────────────────────────────────────────────────────────

  /**
   * O item de marcação do menu emite TRÊS estados, não dois: além de ligado e
   * desligado existe o misto. Assinar `boolean` deixava o compilador de
   * templates sem como provar a chamada, e um `'indeterminate'` chegando aqui
   * ocultaria a coluna — porque só `true` é verdadeiro numa comparação estrita,
   * e misto não quer dizer "escondida".
   */
  protected alternarVisibilidade(id: string, visivel: CheckedState): void {
    const proximo = new Set(this.ocultas());
    if (visivel !== false) proximo.delete(id);
    else proximo.add(id);
    this.ocultas.set(proximo);
  }

  // ─── Seleção ────────────────────────────────────────────────────────────────

  protected readonly todasDaPaginaSelecionadas = computed(() => {
    const pagina = this.linhasDaPagina();
    if (pagina.length === 0) return false;
    const marcadas = this.selecionadas();
    return pagina.every((l) => marcadas.has(l.chave));
  });

  protected readonly algumasDaPaginaSelecionadas = computed(() => {
    const pagina = this.linhasDaPagina();
    const marcadas = this.selecionadas();
    const quantas = pagina.filter((l) => marcadas.has(l.chave)).length;
    return quantas > 0 && quantas < pagina.length;
  });

  protected alternarSelecao(chave: string, marcada: boolean): void {
    const proximo = new Set(this.selecionadas());
    if (marcada) proximo.add(chave);
    else proximo.delete(chave);
    this.selecionadas.set(proximo);
    this.emitirSelecao(proximo);
  }

  protected alternarTodasDaPagina(marcada: boolean): void {
    const proximo = new Set(this.selecionadas());
    for (const linha of this.linhasDaPagina()) {
      if (marcada) proximo.add(linha.chave);
      else proximo.delete(linha.chave);
    }
    this.selecionadas.set(proximo);
    this.emitirSelecao(proximo);
  }

  private emitirSelecao(chaves: ReadonlySet<string>): void {
    const dados = this.data();
    this.selectionChange.emit(
      this.linhasBrutas().filter((l) => chaves.has(l.chave)).map((l) => dados[l.indice]),
    );
  }

  protected readonly textoDaSelecao = computed(() =>
    preencher(this.rotulos().rowsSelected, {
      s: this.linhasFiltradas().filter((l) => this.selecionadas().has(l.chave)).length,
      n: this.linhasFiltradas().length,
    }),
  );

  protected readonly textoDaContagem = computed(() =>
    this.enableRowSelection()
      ? this.textoDaSelecao()
      : preencher(this.rotulos().rowsTotal, { n: this.linhasFiltradas().length }),
  );

  // ─── Paginação ──────────────────────────────────────────────────────────────

  protected irParaPagina(indice: number): void {
    this.paginaAtual.set(Math.max(0, Math.min(indice, this.totalDePaginas() - 1)));
  }

  protected aoTrocarTamanhoDePagina(evento: Event): void {
    this.tamanhoDePagina.set(Number((evento.target as HTMLSelectElement).value));
    this.paginaAtual.set(0);
  }

  // ─── Edição inline ──────────────────────────────────────────────────────────

  protected abrirEdicao(celula: CellRenderizada): void {
    this.rascunho.set(celula.bruto);
    this.emEdicao.set(celula.chave);
  }

  protected aoDigitarEdicao(evento: Event): void {
    this.rascunho.set((evento.target as HTMLInputElement).value);
  }

  protected confirmarEdicao(linha: LineRenderizada, celula: CellRenderizada): void {
    if (this.emEdicao() !== celula.chave) return;
    this.emEdicao.set(null);

    const coluna = this.columns().find((c) => c.id === celula.colunaId);
    const anterior = coluna?.accessor(this.data()[linha.indice]);
    const bruto = this.rascunho();
    // O tipo do valor anterior manda: uma coluna numérica que voltasse como
    // string reordenaria por texto na próxima ordenação, sem erro nenhum.
    const valor = typeof anterior === 'number' ? Number(bruto) : bruto;

    this.cellEdit.emit({ rowIndex: linha.indice, columnId: celula.colunaId, value: valor });
  }

  protected aoTeclarNaEdicao(
    evento: KeyboardEvent,
    linha: LineRenderizada,
    celula: CellRenderizada,
  ): void {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      this.confirmarEdicao(linha, celula);
    } else if (evento.key === 'Escape') {
      // Cancela ANTES do blur: fechar o campo dispara `blur`, e sem zerar o
      // estado o handler de confirmação salvaria o rascunho descartado.
      this.emEdicao.set(null);
      this.rascunho.set('');
    }
  }
}
