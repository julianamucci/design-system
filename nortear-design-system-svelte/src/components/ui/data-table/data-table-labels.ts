/**
 * Textos da interface do DataTable.
 *
 * Vive em `.ts` e não dentro do `.svelte` porque arquivo de componente não
 * exporta tipo: `import type { DataTableLabels } from './data-table.svelte'`
 * não compila, e quem consome precisa do tipo para montar o objeto parcial.
 *
 * O contrato — nomes das chaves e valores do padrão — é o MESMO nas quatro
 * stacks que rodam TanStack. As chaves de coluna e de linha são FUNÇÕES, e não
 * templates com `{col}`: só o Angular usa template, porque lá o rótulo é
 * interpolado dentro do template do componente, onde não se declara função.
 * Isso é divergência de API de framework, registrada e não "alinhada".
 */
export interface DataTableLabels {
  columns: string;
  showColumns: string;
  selectAll: string;
  selectRow: (row: string) => string;
  sortBy: (col: string) => string;
  filter: (col: string) => string;
  noFilter: (col: string) => string;
  pinLeft: (col: string) => string;
  unpin: (col: string) => string;
  resize: (col: string) => string;
  edit: (col: string) => string;
  rowsPerPage: string;
  page: string;
  pageOf: string;
  firstPage: string;
  prevPage: string;
  nextPage: string;
  lastPage: string;
  rowsTotal: (n: number) => string;
  rowsSelected: (s: number, n: number) => string;
  allOption: string;
}

export const DATA_TABLE_LABELS_PADRAO: DataTableLabels = {
  columns: 'Colunas',
  showColumns: 'Exibir colunas',
  selectAll: 'Selecionar todas as linhas',
  selectRow: (r) => `Selecionar linha ${r}`,
  sortBy: (c) => `Ordenar por ${c}`,
  filter: (c) => `Filtrar ${c}`,
  noFilter: (c) => `Sem filtro para ${c}`,
  pinLeft: (c) => `Fixar ${c} à esquerda`,
  unpin: (c) => `Desafixar ${c}`,
  resize: (c) => `Redimensionar coluna ${c}`,
  edit: (c) => `Editar ${c}`,
  rowsPerPage: 'Linhas por página',
  page: 'Página',
  pageOf: 'de',
  firstPage: 'Primeira página',
  prevPage: 'Página anterior',
  nextPage: 'Próxima página',
  lastPage: 'Última página',
  rowsTotal: (n) => `${n} linha(s).`,
  rowsSelected: (s, n) => `${s} de ${n} linha(s) selecionada(s).`,
  allOption: 'Todos',
};
