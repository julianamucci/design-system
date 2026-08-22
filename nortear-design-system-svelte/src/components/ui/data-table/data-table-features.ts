// O conjunto de RECURSOS do DataTable, num módulo só dele.
//
// Mora aqui, e não no `index.ts`, porque o `index.ts` importa o componente e o
// componente precisa do conjunto: juntos, os dois fechariam um ciclo. Separado,
// cada um importa deste, e ninguém importa de volta.
import type { ColumnDef, RowData } from '@tanstack/table-core';
import { storeReactivityBindings } from '@tanstack/table-core/store-reactivity-bindings';
import type { TableReactivityBindings } from '@tanstack/table-core/reactivity';
import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/table-core';

// ─── Os RECURSOS que esta tabela usa ──────────────────────────────────────────
//
// No TanStack 9 os recursos deixam de vir todos ligados: cada um é registrado
// aqui, e só o que está nesta lista entra no pacote. É por isso que o bloco
// existe — e por isso que ele é a fonte de verdade sobre o que o DataTable faz.
//
// Os dois `meta` também mudaram de lugar, e para melhor. Antes era
// `declare module '@tanstack/table-core'`: augmentação GLOBAL, que vazava os
// nossos campos para qualquer outra tabela do projeto que importasse a lib, e
// exigia repetir `TData`/`TValue` só para casar a assinatura. Agora são slots
// de tipo dentro do próprio conjunto — o escopo é este componente, e acabou.
type DataTableColumnMeta<TData extends RowData, TValue> = {
  filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
  editable?: boolean;
  /** Formata o valor da célula como string. */
  format?: (value: TValue, row: TData) => string;
  /** Envolve o valor da célula em <Badge> com a variant retornada. */
  badgeVariant?: (value: TValue, row: TData) => 'default' | 'secondary' | 'destructive' | 'outline';
  /** Classes .nds-* extras aplicadas no <td> de cada célula da coluna. */
  cellClass?: string;
};

type DataTableTableMeta = {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
};

const RECURSOS_BASE = {
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
  columnMeta: {} as DataTableColumnMeta<RowData, unknown>,
  tableMeta: {} as DataTableTableMeta,
};

/**
 * O conjunto COMPLETO, com paginação. É esta função que dá nome ao tipo — e ela
 * é chamada de verdade, no caminho paginado da fábrica abaixo. Antes o nome saía
 * de uma função que ninguém chamava, e o lint cobrou, com razão.
 */
function recursosCompletos(reatividade: TableReactivityBindings) {
  return tableFeatures({
    ...RECURSOS_BASE,
    coreReactivityFeature: reatividade,
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
  });
}

/** O conjunto completo — é ele que tipa tudo que sai deste módulo. */
export type DataTableFeatures = ReturnType<typeof recursosCompletos>;

/**
 * Uma FÁBRICA, e não uma constante de módulo.
 *
 * `constructTable` — o construtor agnóstico de framework — exige que alguém
 * forneça as ligações de reatividade. React e Vue recebem as do adaptador; aqui
 * não há adaptador, então usamos as que o próprio core publica para uso vanilla.
 * E elas guardam estado por instância (assinaturas, desmontagem): compartilhar
 * um conjunto entre tabelas misturaria as assinaturas de todas elas. Por isso o
 * conjunto nasce a cada tabela.
 *
 * O parâmetro escolhe o elenco. O modelo de linhas paginado é um RECURSO no 9,
 * não mais um `get*RowModel` passado por chamada — e recurso registrado é
 * recurso ativo. Como a tabela virtualizada entrega todas as linhas de propósito
 * (quem recorta é o virtualizador, não a paginação), ela precisa de um conjunto
 * que simplesmente não tenha o recurso.
 */
export function createRecursos(comPaginacao: boolean): DataTableFeatures {
  const reatividade = storeReactivityBindings();
  return comPaginacao
    ? recursosCompletos(reatividade)
    : (tableFeatures({
        ...RECURSOS_BASE,
        coreReactivityFeature: reatividade,
      }) as DataTableFeatures);
}

export type DataTableColumn<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;
