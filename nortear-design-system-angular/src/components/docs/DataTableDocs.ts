import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale, type Locale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsDataTable,
  type DataTableCellEdit,
  type DataTableColumn,
  type DataTableLabels,
} from '@/components/ui/data-table';
import {
  INVOICES_DT,
  METHOD_KEY_DT,
  STATUS_KEY_DT,
  statusBadgeDT,
  type InvoiceDT,
  type MethodKeyDT,
  type StatusKeyDT,
} from '@/components/ui/data-table.fixtures';
import uiTranslations from '@/i18n/ui.json';
import dataTableTranslations from '@shared/content/data-table/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// ─── Overrides ────────────────────────────────────────────────────────────────
//
// Três famílias, nenhuma delas snippet `*Code` (que ficaria preso a esta stack e
// invisível para o conteúdo compartilhado):
//
// 1. RÓTULOS COM MARCADOR que o componente precisa e o conteúdo compartilhado
//    não tem. "Selecionar linha" repetido em doze checkboxes é o mesmo que
//    nenhum nome, então o molde carrega o identificador da linha.
//
// 2. DESCRIÇÕES DE ENTRADA que só existem aqui — a coluna é uma definição com
//    `accessor`/`format`, e não uma `ColumnDef` do TanStack. Divergência de API
//    de framework: registrada, não "alinhada".
//
// 3. TEXTO que descreve recursos ausentes nesta stack. Redimensionar, reordenar
//    por arrasto, fixar coluna e virtualizar dependem de geometria em pixel
//    escrita no elemento, e CSS inline é proibido aqui (ver o cabeçalho de
//    `src/components/ui/data-table.ts`). O par do Do & Don't sobre virtualização
//    vira o par que esta stack consegue mostrar: paginar ou não paginar.
const { t, dict } = useTranslation(dataTableTranslations as Record<string, unknown>, {
  'pt-BR': {
    'labels.showColumns': 'Exibir colunas',
    'labels.selectAll': 'Selecionar todas as faturas',
    'labels.selectRow': 'Selecionar fatura {row}',
    'labels.sortBy': 'Ordenar por {col}',
    'labels.filter': 'Filtrar {col}',
    'labels.filterPlaceholder': 'Filtrar',
    'labels.edit': 'Editar {col}',
    'labels.allOption': 'Todos',
    'labels.rowsTotal': '{n} linha(s).',
    'labels.rowsSelected': '{s} de {n} linha(s) selecionada(s).',
    'labels.noFilter': 'Sem filtro para {col}',
    'labels.batchAction': 'Marcar como pagas as faturas selecionadas',
    'labels.batchEmpty': 'Nenhuma fatura selecionada.',
    'variants.angularScope':
      'Nesta stack estão entregues busca livre, filtros por coluna, ordenação, seleção com estado misto, menu de visibilidade, edição em célula e paginação. Redimensionar coluna, reordenar por arrasto, fixar coluna e virtualizar ficaram de fora: os quatro dependem de medida em pixel escrita no próprio elemento, e medida escrita no elemento vence a folha e tira o componente do tema, da densidade e da escala tipográfica.',
    'doDont.pair2.do':
      'Conjunto grande com paginação: o rodapé diz em que página se está e quantas linhas o recorte tem.',
    'doDont.pair2.dont':
      'Conjunto grande inteiro numa página só: a rolagem vira o único mapa e a contagem some da tela.',
    // `caption`, `rowKey` e `rowLabel` NÃO são sobrescritos: o conteúdo
    // compartilhado descreve os três em texto neutro de API, e é o mesmo que as
    // cinco stacks entregam. Só `labels` fica aqui, porque a forma diverge (ver
    // o comentário do tipo em `data-table.ts`).
    'props.table.labels':
      'Rótulos do componente, com marcadores para a coluna, a linha e as contagens. Sobrescreve só o que for passado.',
    'props.table.selectionChange': 'Emitido a cada mudança na seleção, com as linhas marcadas na ordem dos dados.',
    'props.table.colId': 'Identificador estável da coluna — usado em ordenação, filtro, visibilidade e edição.',
    'props.table.colHeader': 'Rótulo do cabeçalho. Substantivo curto, sem ponto final.',
    'props.table.colAccessor':
      'Devolve o valor BRUTO da célula. É ele que ordena e filtra — por isso um valor de dinheiro ordena como número, não como o texto que começa por "R".',
    'props.table.colFormat': 'Transforma o valor bruto no texto exibido. Sem ele, o vazio aparece como travessão.',
    'props.table.colSortable': 'Coluna ordenável ganha botão no cabeçalho e anuncia a direção aplicada.',
    'props.table.colHideable': 'Coluna que pode ser escondida pelo menu de colunas.',
    'props.table.colNumeric':
      'Coluna numérica: a célula e o cabeçalho alinham à direita, e a coluna passa a usar algarismos de largura fixa para não dançar a cada atualização.',
    'props.table.colBadge':
      'Devolve a variante do Badge para o valor da célula, ou nada para texto puro. A variante sai da chave estável do dado: rótulo traduzido mudaria com o idioma e levaria a cor junto.',
  },
  en: {
    'labels.showColumns': 'Show columns',
    'labels.selectAll': 'Select all invoices',
    'labels.selectRow': 'Select invoice {row}',
    'labels.sortBy': 'Sort by {col}',
    'labels.filter': 'Filter {col}',
    'labels.filterPlaceholder': 'Filter',
    'labels.edit': 'Edit {col}',
    'labels.allOption': 'All',
    'labels.rowsTotal': '{n} row(s).',
    'labels.rowsSelected': '{s} of {n} row(s) selected.',
    'labels.noFilter': 'No filter for {col}',
    'labels.batchAction': 'Mark the selected invoices as paid',
    'labels.batchEmpty': 'No invoice selected.',
    'variants.angularScope':
      'This stack ships free-text search, per-column filters, sorting, selection with a mixed state, the column visibility menu, in-cell editing and pagination. Column resizing, drag reordering, column pinning and virtualization are out: all four depend on a pixel measurement written on the element itself, and a measurement written on the element beats the stylesheet and takes the component out of the theme, the density and the type scale.',
    'doDont.pair2.do':
      'Large set with pagination: the footer says which page you are on and how many rows the current slice has.',
    'doDont.pair2.dont':
      'The whole large set on a single page: scrolling becomes the only map and the count disappears from the screen.',
    'props.table.labels':
      'Component labels, with placeholders for the column, the row and the counts. Only what you pass is overridden.',
    'props.table.selectionChange': 'Emitted on every selection change, with the checked rows in data order.',
    'props.table.colId': 'Stable column identifier — used by sorting, filtering, visibility and editing.',
    'props.table.colHeader': 'Header label. Short noun, no trailing period.',
    'props.table.colAccessor':
      'Returns the RAW cell value. It is what sorts and filters — which is why a money value sorts as a number, not as the text starting with a currency sign.',
    'props.table.colFormat': 'Turns the raw value into the displayed text. Without it, an empty value shows as an em dash.',
    'props.table.colSortable': 'A sortable column gets a header button and announces the applied direction.',
    'props.table.colHideable': 'Column that can be hidden from the column menu.',
    'props.table.colNumeric':
      'Numeric column: the cell and the header both align right, and the column switches to fixed-width figures so it does not shift on every update.',
    'props.table.colBadge':
      'Returns the Badge variant for the cell value, or nothing for plain text. The variant comes from the stable key of the data: a translated label would change with the language and take the colour with it.',
  },
  es: {
    'labels.showColumns': 'Mostrar columnas',
    'labels.selectAll': 'Seleccionar todas las facturas',
    'labels.selectRow': 'Seleccionar factura {row}',
    'labels.sortBy': 'Ordenar por {col}',
    'labels.filter': 'Filtrar {col}',
    'labels.filterPlaceholder': 'Filtrar',
    'labels.edit': 'Editar {col}',
    'labels.allOption': 'Todos',
    'labels.rowsTotal': '{n} fila(s).',
    'labels.rowsSelected': '{s} de {n} fila(s) seleccionada(s).',
    'labels.noFilter': 'Sin filtro para {col}',
    'labels.batchAction': 'Marcar como pagadas las facturas seleccionadas',
    'labels.batchEmpty': 'Ninguna factura seleccionada.',
    'variants.angularScope':
      'En esta stack están entregados la búsqueda libre, los filtros por columna, la ordenación, la selección con estado mixto, el menú de visibilidad, la edición en celda y la paginación. Redimensionar columna, reordenar arrastrando, fijar columna y virtualizar quedaron fuera: los cuatro dependen de una medida en píxeles escrita en el propio elemento, y una medida escrita en el elemento vence a la hoja y saca al componente del tema, de la densidad y de la escala tipográfica.',
    'doDont.pair2.do':
      'Conjunto grande con paginación: el pie indica en qué página se está y cuántas filas tiene el recorte.',
    'doDont.pair2.dont':
      'Todo el conjunto grande en una sola página: el desplazamiento se vuelve el único mapa y el recuento desaparece de la pantalla.',
    'props.table.labels':
      'Rótulos del componente, con marcadores para la columna, la fila y los recuentos. Solo se sobrescribe lo que se pasa.',
    'props.table.selectionChange': 'Se emite en cada cambio de selección, con las filas marcadas en el orden de los datos.',
    'props.table.colId': 'Identificador estable de la columna — lo usan la ordenación, el filtro, la visibilidad y la edición.',
    'props.table.colHeader': 'Rótulo del encabezado. Sustantivo corto, sin punto final.',
    'props.table.colAccessor':
      'Devuelve el valor BRUTO de la celda. Es lo que ordena y filtra — por eso un valor de dinero ordena como número y no como el texto que empieza por el símbolo de moneda.',
    'props.table.colFormat': 'Convierte el valor bruto en el texto mostrado. Sin él, el vacío aparece como raya.',
    'props.table.colSortable': 'Una columna ordenable recibe un botón en el encabezado y anuncia la dirección aplicada.',
    'props.table.colHideable': 'Columna que se puede ocultar desde el menú de columnas.',
    'props.table.colNumeric':
      'Columna numérica: la celda y el encabezado se alinean a la derecha, y la columna pasa a usar cifras de ancho fijo para no bailar en cada actualización.',
    'props.table.colBadge':
      'Devuelve la variante del Badge para el valor de la celda, o nada para texto plano. La variante sale de la clave estable del dato: una etiqueta traducida cambiaría con el idioma y se llevaría el color.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

// ─── Snippets ─────────────────────────────────────────────────────────────────
//
// A estrutura da anatomia NÃO mora aqui: ela sai de `anatomy.structureCode` do
// conteúdo compartilhado, como em toda docs page desta stack.
//
// Até 2026-09-22 havia uma cópia local no lugar dela, com um comentário que
// dizia que a chave compartilhada anunciava `@tanstack/angular-table` e passava
// flags de pin e resize. A chave já tinha sido corrigida — hoje ela abre com
// "Sem lib de tabela" —, mas a página tinha deixado de LÊ-LA, então nada na
// tela mudou quando o conteúdo mudou. Contorno que sobrevive à causa vira
// segunda fonte, e nesta casa a segunda é a que deixa de ser corrigida.
//
// O que fica abaixo são os snippets que a página monta por conta própria — os
// de import e os de cada recurso —, porque não têm chave compartilhada.

const IMPORT_CODE = `import { NdsDataTable, type DataTableColumn } from '@/components/ui/data-table';`;

const IMPORT_META_CODE = `interface Fatura { id: string; cliente: string; status: string; metodo: string; valor: number }

// Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
// ordenação, filtros e seleção.
const COLUNAS: DataTableColumn<Fatura>[] = [
  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id, sortable: true, hideable: false },
  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true, editable: true,
    filter: { type: 'text', placeholder: 'Filtrar cliente' } },
  { id: 'status',  header: 'Status',  accessor: (f) => f.status,
    filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },
  // accessor devolve o NÚMERO e format só o texto: sem isso "R$ 50,00" cairia
  // depois de "R$ 450,00" na ordenação.
  { id: 'valor',   header: 'Valor',   accessor: (f) => f.valor, format: brl, sortable: true, numeric: true },
];`;

const CODE_SEARCH = `<!-- Ligada por padrão. A busca casa em TODA coluna, inclusive nas escondidas
     pelo menu: esconder é decisão de leitura, não de escopo. -->
<div
  ndsDataTable
  [columns]="colunas"
  [data]="faturas"
  globalFilterPlaceholder="Buscar fatura, cliente, método..."
></div>`;

const CODE_FILTERS = `<!-- Segunda linha no cabeçalho, com input ou select conforme o tipo
     declarado na coluna. Os filtros se somam entre si e à busca livre. -->
<div
  ndsDataTable
  [columns]="colunasComFiltro"
  [data]="faturas"
  [enableColumnFilters]="true"
></div>`;

const CODE_SELECTION = `<div
  ndsDataTable
  [columns]="colunas"
  [data]="faturas"
  [enableRowSelection]="true"
  [rowKey]="invoiceKey"
  [rowLabel]="invoiceLabel"
  (selectionChange)="selecionadas.set($event)"
></div>`;

const CODE_VISIBILIDADE = `<!-- Ligado por padrão; desligue com [enableColumnVisibility]="false".
     Coluna com hideable: false não entra no menu. -->
<div ndsDataTable [columns]="colunas" [data]="faturas"></div>`;

const CODE_PAGINATION = `<div
  ndsDataTable
  [columns]="colunas"
  [data]="faturas"
  [pageSize]="5"
  [pageSizeOptions]="[5, 10, 20]"
></div>`;

const CODE_EDIT = `<!-- O componente NÃO guarda os dados: avisa a edição e quem consome
     atualiza o array. Enter confirma, Esc cancela. -->
<div
  ndsDataTable
  [columns]="colunasEditaveis"
  [data]="faturas()"
  [enablePagination]="false"
  [enableColumnFilters]="true"
  (cellEdit)="aplicarEdicao($event)"
></div>`;

const CODE_LOTE = `<div
  ndsDataTable
  [columns]="colunas"
  [data]="faturas"
  [enableRowSelection]="true"
  (selectionChange)="selecionadas.set($event)"
></div>

<!-- A ação em lote vive FORA da tabela: ela age sobre o recorte marcado. -->
<button ndsButton variant="outline" [disabled]="selecionadas().length === 0">
  Marcar como pagas ({{ selecionadas().length }})
</button>`;

const INTERFACE_CODE = `// Sem engine headless: o estado é de signal e cada derivação (filtrar →
// ordenar → paginar) é um computed que o template lê direto.
@Component({ selector: 'div[ndsDataTable]' })
export class NdsDataTable<TData> {
  readonly columns = input.required<readonly DataTableColumn<TData>[]>();
  readonly data = input.required<readonly TData[]>();

  readonly rowKey = input<(row: TData, index: number) => string>();
  readonly rowLabel = input<((row: TData) => string) | undefined>(undefined);
  readonly caption = input<string>('');

  readonly enableGlobalFilter = input(true);
  readonly globalFilterPlaceholder = input('Buscar...');
  readonly enableRowSelection = input(false);
  readonly enableColumnVisibility = input(true);
  readonly enableColumnFilters = input(false);
  readonly enablePagination = input(true);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  readonly emptyMessage = input('Sem resultados.');
  readonly labels = input<Partial<DataTableLabels>>({});

  readonly cellEdit = output<DataTableCellEdit>();
  readonly selectionChange = output<readonly TData[]>();
}

interface DataTableColumn<TData> {
  id: string;
  header: string;
  accessor: (row: TData) => unknown;
  format?: (value: unknown, row: TData) => string;
  sortable?: boolean;
  hideable?: boolean;
  editable?: boolean;
  numeric?: boolean;
  filter?: { type: 'text' | 'select'; options?: readonly string[]; placeholder?: string };
}`;

const TOKENS_CSS = `/* O DataTable não declara variáveis próprias: consome os mesmos tokens do
   Table primitivo. Personalizar é redefinir o token no tema. */
.meu-tema {
  --border: 220 13% 91%;
  --muted: 220 14% 96%;
  --primary: 221 83% 53%;
}`;

/**
 * Dinheiro formatado só na EXIBIÇÃO, e na moeda do idioma que a página está
 * lendo.
 *
 * O valor continua número no dado — guardar "R$ 250,00" faria a ordenação
 * comparar strings, e "R$ 50,00" cairia depois de "R$ 450,00".
 *
 * A moeda acompanha o idioma pelo mesmo motivo que o status e o método
 * acompanham: a coluna saía em reais no meio de uma tabela lida em `en` e em
 * `es`. Quem devolve o formatador é uma FUNÇÃO, nunca uma constante de módulo,
 * porque o `Intl.NumberFormat` congela o locale na construção — criado uma vez,
 * ele sobreviveria à troca de idioma mostrando a moeda anterior.
 */
function formatadorDeMoeda(locale: Locale): Intl.NumberFormat {
  if (locale === 'en') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  if (locale === 'es') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
}

@Component({
  selector: 'nds-data-table-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsDataTable,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews ──────────────────────────────────────────────────────────
         Nenhum preview usa <main> nem heading próprio: a docs page já está
         dentro de um <main>, e marco dentro de marco reprova no axe.

         Cada tabela recebe uma legenda PRÓPRIA: a legenda é o nome acessível da
         tabela, e meia dúzia de tabelas com o mesmo nome deixa a lista do leitor
         de tela indistinguível. -->

    <ng-template #tplDoDont1Do>
      <!-- Placeholder específico ao escopo: diz onde a busca procura. -->
      <div
        ndsDataTable
        [caption]="caption(toPlainText(t('doDont.pair1.do')))"
        [columns]="colunas()"
        [data]="faturasCurtas"
        [labels]="rotulos()"
        [globalFilterPlaceholder]="t('demonstration.labels.search')"
        [enableColumnVisibility]="false"
        [enablePagination]="false"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- Placeholder genérico: não orienta ninguém. -->
      <div
        ndsDataTable
        [caption]="caption(toPlainText(t('doDont.pair1.dont')))"
        [columns]="colunas()"
        [data]="faturasCurtas"
        [labels]="rotulos()"
        globalFilterPlaceholder="..."
        [enableColumnVisibility]="false"
        [enablePagination]="false"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div
        ndsDataTable
        [caption]="caption(toPlainText(t('doDont.pair2.do')))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [pageSize]="5"
        [pageSizeOptions]="[5, 10]"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <div
        ndsDataTable
        [caption]="caption(toPlainText(t('doDont.pair2.dont')))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [enablePagination]="false"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarBusca>
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.globalFilter.name'))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [globalFilterPlaceholder]="t('demonstration.labels.search')"
        [enableColumnVisibility]="false"
        [pageSize]="5"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarFiltros>
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.columnFilters.name'))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [enableColumnFilters]="true"
        [enablePagination]="false"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarSelecao>
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.selection.name'))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [rowKey]="invoiceKey"
        [rowLabel]="invoiceLabel"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [enableRowSelection]="true"
        [pageSize]="5"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarVisibilidade>
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.visibility.name'))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [pageSize]="5"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarPaginacao>
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.pagination.name'))"
        [columns]="colunas()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [pageSize]="5"
        [pageSizeOptions]="[5, 10, 20]"
        [emptyMessage]="t('demonstration.labels.noResults')"
      ></div>
    </ng-template>

    <ng-template #tplVarPlanilha>
      <!-- Edição em várias colunas, sem paginação e com filtro por coluna: a
           experiência mais próxima de uma planilha que esta stack entrega. -->
      <div
        ndsDataTable
        [caption]="caption(t('variants.items.editableSheet.name'))"
        [columns]="colunasEditaveis()"
        [data]="faturas()"
        [labels]="rotulos()"
        [enableGlobalFilter]="false"
        [enableColumnVisibility]="false"
        [enableColumnFilters]="true"
        [enablePagination]="false"
        [emptyMessage]="t('demonstration.labels.noResults')"
        (cellEdit)="aplicarEdicao($event)"
      ></div>
    </ng-template>

    <ng-template #tplCompLote>
      <div class="nds-stack nds-w-full" data-spacing="md">
        <div
          ndsDataTable
          [caption]="caption(t('variants.compositions.selectionWithActions.name'))"
          [columns]="colunas()"
          [data]="faturas()"
          [labels]="rotulos()"
          [rowKey]="invoiceKey"
          [rowLabel]="invoiceLabel"
          [enableGlobalFilter]="false"
          [enableColumnVisibility]="false"
          [enableRowSelection]="true"
          [pageSize]="5"
          [emptyMessage]="t('demonstration.labels.noResults')"
          (selectionChange)="selecionadas.set($event)"
        ></div>

        <!-- A ação em lote vive FORA da tabela: ela age sobre o recorte marcado,
             não faz parte da grade. -->
        <p class="nds-text-body nds-text-muted-foreground nds-m-0">{{ resumoDoLote() }}</p>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="data-table"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration>
          <div
            ndsDataTable
            class="nds-w-full"
            [caption]="caption(tNav('nav.demonstration'))"
            [columns]="colunasEditaveis()"
            [data]="faturas()"
            [labels]="rotulos()"
            [rowKey]="invoiceKey"
            [rowLabel]="invoiceLabel"
            [globalFilterPlaceholder]="t('demonstration.labels.search')"
            [enableRowSelection]="true"
            [enableColumnFilters]="true"
            [pageSize]="5"
            [pageSizeOptions]="[5, 10, 20]"
            [emptyMessage]="t('demonstration.labels.noResults')"
            (cellEdit)="aplicarEdicao($event)"
            (selectionChange)="selecionadas.set($event)"
          ></div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withMeta')"
          [secondaryCode]="importMetaCode"
          componentSlug="data-table"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [note]="variantsNote()"
          [items]="variantItems()"
          componentSlug="data-table"
          language="html"
        />

        <!-- nds-docs-compositions: é o NdsDocsVariants com a linha "Quando usar:"
             mesclada na descrição, e ele repassa o language. -->
        <nds-docs-compositions
          id="composicoes"
          [useWhenLabel]="useWhenLabel()"
          [items]="compositionItems()"
          componentSlug="data-table"
          language="html"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCss"
        />

        <nds-docs-accessibility
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="data-table"
        />

        <nds-docs-notes [items]="noteItems()" componentSlug="data-table" />

        <nds-docs-analytics
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsDataTableDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  // Exposto ao template porque o destino é atributo (textNode), não HTML: as
  // chaves de doDont guardam markup escapado e ele chegaria literal à tela.
  protected readonly toPlainText = toPlainText;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importMetaCode = IMPORT_META_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly tokensCss = TOKENS_CSS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // ─── Dados ──────────────────────────────────────────────────────────────────
  //
  // As mesmas faturas das stories: a regressão visual compara a mesma tabela na
  // docs page e na story, e um dado diferente aqui viraria diferença de pixel
  // sem causa. Cópia rasa porque a edição em célula reescreve a linha.
  protected readonly faturas = signal<InvoiceDT[]>(INVOICES_DT.map((f) => ({ ...f })));
  protected readonly faturasCurtas = INVOICES_DT.slice(0, 4).map((f) => ({ ...f }));
  protected readonly selecionadas = signal<readonly InvoiceDT[]>([]);

  protected readonly invoiceKey = (invoice: InvoiceDT): string => invoice.id;
  protected readonly invoiceLabel = (invoice: InvoiceDT): string => invoice.id;

  /**
   * Chave estável do status → texto na língua da página.
   *
   * O mapa é chaveado pela CHAVE, e não pelo rótulo em pt-BR que ele devolvia
   * antes: a variante do selo pende da mesma chave, e pendurá-la no texto faria
   * o selo perder a cor assim que a página fosse lida em outro idioma. O único
   * ponto que ainda conhece o rótulo guardado no dado é `STATUS_KEY_DT`, que
   * traduz dado → chave uma vez só.
   */
  private readonly statusLabels = computed<Record<StatusKeyDT, string>>(() => {
    dict();
    return {
      paid: t('demonstration.labels.paid'),
      pending: t('demonstration.labels.pending'),
      canceled: t('demonstration.labels.canceled'),
    };
  });

  /**
   * Chave estável do método de pagamento → texto na língua da página.
   *
   * Cada caminho vai escrito POR EXTENSO. Chave montada em tempo de execução
   * some da busca de quem lê a árvore e some do portão que compara o conjunto
   * de rótulos das cinco demonstrações.
   */
  private readonly methodLabels = computed<Record<MethodKeyDT, string>>(() => {
    dict();
    return {
      pix: t('demonstration.labels.methodPix'),
      bankSlip: t('demonstration.labels.methodBankSlip'),
      creditCard: t('demonstration.labels.methodCreditCard'),
      debitCard: t('demonstration.labels.methodDebitCard'),
      transfer: t('demonstration.labels.methodTransfer'),
    };
  });

  protected readonly colunas = computed<DataTableColumn<InvoiceDT>[]>(() => {
    dict();
    const status = this.statusLabels();
    const method = this.methodLabels();
    // `getLocale()` lê o signal de idioma por dentro: é isto que recria o
    // formatador na troca de idioma, em vez de manter o da primeira leitura.
    const moeda = formatadorDeMoeda(getLocale());
    /** O texto exibido de cada status, na ordem em que o domínio os lista. */
    const options = Object.values(status);
    const statusText = (value: unknown) => status[STATUS_KEY_DT[String(value)]!] ?? '—';
    const methodText = (value: unknown) => method[METHOD_KEY_DT[String(value)]!] ?? '—';
    return [
      {
        id: 'id',
        header: t('demonstration.labels.invoice'),
        accessor: (f) => f.id,
        sortable: true,
        // A coluna-chave não some pelo menu: sem ela a linha perde o identificador.
        hideable: false,
      },
      {
        id: 'cliente',
        header: t('demonstration.labels.customer'),
        accessor: (f) => f.cliente,
        sortable: true,
        filter: { type: 'text', placeholder: t('demonstration.labels.customer') },
      },
      {
        id: 'status',
        header: t('demonstration.labels.status'),
        accessor: (f) => f.status,
        format: statusText,
        // O status é um ESTADO, e estado se lê no selo: cor mais texto. A
        // variante sai da chave estável, nunca do rótulo traduzido.
        badge: statusBadgeDT,
        // As opções do select são o TEXTO exibido: o filtro compara o que se lê.
        filter: { type: 'select', options: options },
      },
      {
        id: 'metodo',
        header: t('demonstration.labels.method'),
        accessor: (f) => f.metodo,
        // O dado guarda o rótulo em pt-BR; a tela mostra a língua da página. Sem
        // isto a coluna saía em português no meio da tabela lida em `en` e `es`.
        format: methodText,
      },
      {
        id: 'valor',
        header: t('demonstration.labels.amount'),
        accessor: (f) => f.value,
        format: (value) => (typeof value === 'number' ? moeda.format(value) : '—'),
        sortable: true,
        numeric: true,
      },
    ];
  });

  /** Cliente e valor editáveis; o resto é leitura. */
  protected readonly colunasEditaveis = computed<DataTableColumn<InvoiceDT>[]>(() =>
    this.colunas().map((column) =>
      column.id === 'cliente' || column.id === 'valor' ? { ...column, editable: true } : column,
    ),
  );

  protected readonly rotulos = computed<Partial<DataTableLabels>>(() => {
    dict();
    return {
      columns: t('demonstration.labels.columns'),
      showColumns: t('labels.showColumns'),
      selectAll: t('labels.selectAll'),
      selectRow: t('labels.selectRow'),
      sortBy: t('labels.sortBy'),
      filter: t('labels.filter'),
      filterPlaceholder: t('labels.filterPlaceholder'),
      edit: t('labels.edit'),
      allOption: t('labels.allOption'),
      rowsPerPage: t('demonstration.labels.rowsPerPage'),
      page: t('demonstration.labels.page'),
      pageOf: t('demonstration.labels.of'),
      firstPage: t('demonstration.labels.firstPage'),
      prevPage: t('demonstration.labels.prevPage'),
      nextPage: t('demonstration.labels.nextPage'),
      lastPage: t('demonstration.labels.lastPage'),
      rowsTotal: t('labels.rowsTotal'),
      rowsSelected: t('labels.rowsSelected'),
      noFilter: t('labels.noFilter'),
    };
  });

  protected readonly resumoDoLote = computed(() => {
    dict();
    const checked = this.selecionadas();
    return checked.length === 0
      ? t('labels.batchEmpty')
      : `${t('labels.batchAction')}: ${checked.map((f) => f.id).join(', ')}`;
  });

  /**
   * Nome acessível de uma tabela do preview.
   *
   * A legenda é o nome da tabela para o leitor de tela — repetida em meia dúzia
   * de previews, a lista de tabelas fica indistinguível.
   *
   * A base é `demonstration.labels.caption`, e não o título da página: é a
   * mesma base das outras quatro stacks, e compor do título fazia a mesma
   * tabela chegar ao leitor de tela com nome diferente em cada uma.
   */
  protected caption(sufixo: string): string {
    return `${t('demonstration.labels.caption')} — ${toPlainText(sufixo)}`;
  }

  protected aplicarEdicao(edicao: DataTableCellEdit): void {
    // O componente não guarda os dados: ele avisa a edição e quem consome
    // atualiza o array. É esse o exemplo honesto do que se escreve ao usar.
    this.faturas.update((current) =>
      current.map((invoice, index) =>
        index === edicao.rowIndex ? { ...invoice, [edicao.columnId]: edicao.value } : invoice,
      ),
    );
  }

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarBusca = viewChild.required<TemplateRef<unknown>>('tplVarBusca');
  private readonly tplVarFiltros = viewChild.required<TemplateRef<unknown>>('tplVarFiltros');
  private readonly tplVarSelecao = viewChild.required<TemplateRef<unknown>>('tplVarSelecao');
  private readonly tplVarVisibilidade = viewChild.required<TemplateRef<unknown>>('tplVarVisibilidade');
  private readonly tplVarPaginacao = viewChild.required<TemplateRef<unknown>>('tplVarPaginacao');
  private readonly tplVarPlanilha = viewChild.required<TemplateRef<unknown>>('tplVarPlanilha');
  private readonly tplCompLote = viewChild.required<TemplateRef<unknown>>('tplCompLote');

  // ─── Seções ─────────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => numberedItems(dict(), 'anatomy'));

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: numberedItems(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        // O container lê `do`/`dont`; `correct`/`avoid` renderiza duas colunas
        // vazias, e o tsc não pega porque não valida template Angular.
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['columnHeader', 'filterPlaceholder', 'emptyState', 'selectionLabel'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: numberedItems(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: numberedItems(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  /**
   * A nota compartilhada lista recursos que esta stack não entrega. O parágrafo
   * de escopo entra logo depois, em vez de contradizê-la em silêncio.
   */
  protected readonly variantsNote = computed(() => {
    dict();
    return `${t('variants.note')}<br><br>${t('variants.angularScope')}`;
  });

  protected readonly variantItems = computed(() => {
    dict();
    // Só os recursos que existem nesta stack ganham card: um card com preview de
    // recurso ausente seria documentação de algo que não compila.
    return [
      { key: 'globalFilter',  code: CODE_SEARCH,        tpl: this.tplVarBusca()        },
      { key: 'columnFilters', code: CODE_FILTERS,      tpl: this.tplVarFiltros()      },
      { key: 'selection',     code: CODE_SELECTION,      tpl: this.tplVarSelecao()      },
      { key: 'visibility',    code: CODE_VISIBILIDADE, tpl: this.tplVarVisibilidade() },
      { key: 'pagination',    code: CODE_PAGINATION,    tpl: this.tplVarPaginacao()    },
      { key: 'editableSheet', code: CODE_EDIT,       tpl: this.tplVarPlanilha()     },
    ].map(({ key, code, tpl }) => ({
      // `.name` vem do conteúdo COMPARTILHADO para todas as flags desde
      // 2026-09-22: os cinco nomes que esta página carregava em override local
      // eram os únicos bons das cinco stacks e foram promovidos tal e qual.
      // Manter a cópia aqui faria duas fontes, e a segunda é a que deixa de ser
      // corrigida.
      name: t(`variants.items.${key}.name`),
      description: valueOuField(`variants.items.${key}`, 'description'),
      code,
      // O id de rastreio é a CHAVE da flag, nunca o `name`: o nome é texto
      // traduzido, e em `en`/`es` o mesmo botão emitiria outro valor no GA4.
      trackId: key,
      preview: tpl,
    }));
  });

  /** Rótulo da linha "Quando usar:" que o container mescla na descrição. */
  protected readonly useWhenLabel = computed(() => {
    dict();
    return tNav('common.useWhen');
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [{ key: 'selectionWithActions', code: CODE_LOTE, tpl: this.tplCompLote() }].map(
      ({ key, code, tpl }) => ({
        name: t(`variants.compositions.${key}.name`),
        description: t(`variants.compositions.${key}.description`),
        useWhen: t(`variants.compositions.${key}.use`),
        code,
        trackId: key,
        preview: tpl,
      }),
    );
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    // `resizing` e `virtualized` ficam fora: são estados de recursos que esta
    // stack não entrega, e listá-los prometeria comportamento inexistente.
    return ['empty', 'sorted', 'filtered', 'selected', 'editing'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const sim = tNav('common.yes');
    const not = tNav('common.no');
    // "—" e nunca a string "undefined": travessão é o vazio tipográfico, e é o
    // que as outras stacks mostram.
    const line = (
      name: string,
      key: string,
      type: string,
      defaultValue: string,
      required = not,
    ) => ({
      name,
      type: type,
      defaultValue,
      required,
      description: toPlainText(t(`props.table.${key}`)),
    });

    return [
      {
        title: t('props.containerTitle'),
        cols,
        items: [
          line('columns', 'columns', 'DataTableColumn<TData>[]', '—', sim),
          line('data', 'data', 'TData[]', '—', sim),
          // A cadeia do rótulo da linha: `rowLabel`, senão a primeira coluna,
          // senão a chave. Por isso `rowLabel` sem valor não vira nome vazio.
          line('rowKey', 'rowKey', '(row, index) => string', 'índice do array'),
          line('rowLabel', 'rowLabel', '(row) => string', '—'),
          line('caption', 'caption', 'string', `''`),
          line('enableGlobalFilter', 'enableGlobalFilter', 'boolean', 'true'),
          line('globalFilterPlaceholder', 'globalFilterPlaceholder', 'string', `'Buscar...'`),
          line('enableRowSelection', 'enableRowSelection', 'boolean', 'false'),
          line('enableColumnVisibility', 'enableColumnVisibility', 'boolean', 'true'),
          line('enableColumnFilters', 'enableColumnFilters', 'boolean', 'false'),
          line('enablePagination', 'enablePagination', 'boolean', 'true'),
          line('pageSize', 'pageSize', 'number', '10'),
          line('pageSizeOptions', 'pageSizeOptions', 'number[]', '[10, 20, 50, 100]'),
          line('emptyMessage', 'emptyMessage', 'string', `'Sem resultados.'`),
          line('labels', 'labels', 'Partial<DataTableLabels>', '{}'),
          line('cellEdit', 'onCellEdit', 'output<DataTableCellEdit>', '—'),
          line('selectionChange', 'selectionChange', 'output<TData[]>', '—'),
        ],
      },
      {
        title: t('props.tooltipTitle'),
        cols,
        items: [
          line('id', 'colId', 'string', '—', sim),
          line('header', 'colHeader', 'string', '—', sim),
          line('accessor', 'colAccessor', '(row) => unknown', '—', sim),
          line('format', 'colFormat', '(value, row) => string', '—'),
          line('sortable', 'colSortable', 'boolean', 'false'),
          line('hideable', 'colHideable', 'boolean', 'true'),
          line('editable', 'metaEditable', 'boolean', 'false'),
          line('numeric', 'colNumeric', 'boolean', 'false'),
          line('badge', 'colBadge', '(value, row) => BadgeVariant | null', '—'),
          line('filter', 'metaFilter', 'DataTableColumnFilter', '—'),
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.part'),
      description: t('tokens.table.class'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // A coluna do meio é SELETOR real desta stack, não a classe utilitária da
    // era anterior que o conteúdo compartilhado ainda guarda ao lado do token.
    return [
      // `.nds-data-table-th` não lê `--border`: a moldura da área rolável é
      // `.nds-data-table-scroll`, e o filete entre as linhas vem de
      // `table.css`, que a tabela de dados compõe.
      { token: '--border',           k: 'borderPart',           parte: '.nds-data-table-scroll · .nds-table tbody tr' },
      { token: '--muted',            k: 'mutedPart',            parte: '.nds-data-table-tr:hover'        },
      { token: '--muted-foreground', k: 'mutedForegroundPart',  parte: '.nds-data-table-pagination-count' },
      { token: '--primary',          k: 'primaryPart',          parte: '.nds-data-table-sort-btn:hover'  },
      // A barra de ferramentas não tem fundo próprio; quem cobre o conteúdo
      // durante a rolagem horizontal são as células fixadas.
      { token: '--background',       k: 'backgroundPart',       parte: '.nds-data-table-th-pinned, .nds-data-table-td-pinned' },
      { token: '--ring',             k: 'ringPart',             parte: '.nds-data-table-edit-btn:focus-visible' },
    ].map(({ token, k, parte }) => ({
      token,
      value: parte,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => numberedItems(dict(), 'accessibility'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',    description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter',  description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',  description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Esc',    description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: '← ↑ → ↓', description: toPlainText(t('accessibility.keyboard.arrowKeys')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onFocus', 'onSelect', 'onEdit', 'onEmpty', 'onPaging'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'table',        name: 'Table',        path: '?path=/docs/components-tables-table--docs'        },
      { key: 'chart',        name: 'Chart',        path: '?path=/docs/components-display-chart--docs'        },
      { key: 'pagination',   name: 'Pagination',   path: '?path=/docs/components-navigation-pagination--docs'   },
      { key: 'checkbox',     name: 'Checkbox',     path: '?path=/docs/components-form-checkbox--docs'     },
      { key: 'input',        name: 'Input',        path: '?path=/docs/components-form-input--docs'        },
      { key: 'dropdownMenu', name: 'DropdownMenu', path: '?path=/docs/components-navigation-dropdownmenu--docs' },
    ].map(({ key, name, path }) => ({
      name: name,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() =>
    numberedItems(dict(), 'notes', 'tip').map((content) => ({ title: '', content })),
  );

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // O DataTable é camada de UI: não dispara evento de produto por padrão. O
    // que sai daqui é o tracking da própria docs page.
    return [
      { e: 'pageView',      trigger: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', trigger: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    trigger: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, trigger, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${trigger}`)),
      payload: toPlainText(t(`analytics.table.${carga}`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    // A forma varia por componente: trinca criterion/level/how ou string solta.
    // `how` guarda o nome da tag como ENTIDADE (`&lt;button&gt;`) porque o mesmo
    // JSON alimenta destinos que renderizam HTML. Aqui o destino escreve
    // textNode, então a entidade precisa ser decodificada — sem isto a célula
    // mostraria "&lt;button&gt;" na tela.
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map(
      (r) => ({ ...r, how: toPlainText(r.how) }),
    );
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : numberedItems(d, 'testes.accessibility').map((text) => ({
          criterion: toPlainText(text),
          level: '',
          how: '',
        }));
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items,
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'data-table',
      });
      track('docs_page_view', {
        component_name: 'data-table',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'data-table',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// ─── Helpers de cauda ─────────────────────────────────────────────────────────


/**
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 * `t()` devolve a PRÓPRIA CHAVE quando ela aponta para um objeto — e é assim
 * que "variants.items.editableSheet" acaba escrito na tela, sem erro nenhum.
 */
function valueOuField(base: string, field: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const key = `${base}.${field}`;
  const ofField = t(key);
  return ofField === key ? '' : ofField;
}

/**
 * Lista numerada (`base.item1`, `base.item2`…) lida até acabar.
 *
 * Contar à mão é o defeito que aparece na tela: com um item a menos, a chave
 * crua sai escrita no lugar do texto; com um a mais, o item some da página.
 */
function numberedItems(
  d: Record<string, string>,
  base: string,
  prefixo = 'item',
): string[] {
  const items: string[] = [];
  for (let i = 1; ; i++) {
    const value = d[`${base}.${prefixo}${i}`];
    if (value === undefined) break;
    items.push(value);
  }
  return items;
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
