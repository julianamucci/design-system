/**
 * Textos da interface do DataTable — o catálogo, uma vez só.
 *
 * ─── Por que isto mora aqui ───────────────────────────────────────────────
 *
 * Até 2026-09-22 estas 21 chaves e os 21 valores padrão estavam copiados
 * PALAVRA POR PALAVRA em quatro stacks. O comentário do svelte já declarava que
 * "o contrato é o mesmo nas quatro" — e declarar que quatro cópias são iguais é
 * exatamente o estado em que uma delas muda sem ninguém ver. Conferido antes de
 * unificar: react, vue e svelte eram idênticos a menos do estilo de aspas, e o
 * vanilla trazia os mesmos valores sob outro nome de constante.
 *
 * Catálogo de rótulo é REGRA, não implementação: não precisa de `HTMLElement`
 * para existir, decide o que se lê e não o que acontece. É a régua do
 * `@nortear/ds-core` — `resolveX(dados)` entra, `attachX(elemento)` não —, e é
 * por isso que o Flutter consegue consumir daqui.
 *
 * ─── O que NÃO vem para cá ────────────────────────────────────────────────
 *
 * O **angular** continua com os moldes dele (D8 do PRD). As chaves de coluna e
 * de linha são FUNÇÕES aqui, e lá o rótulo é interpolado dentro do template do
 * componente, onde não se declara função — os moldes com `{col}` são a forma
 * que aquele framework permite. Isso é divergência de API de framework:
 * registra-se, não se "alinha".
 *
 * ─── Idioma ───────────────────────────────────────────────────────────────
 *
 * O padrão é pt-BR porque é o idioma do componente sem configuração. Quem
 * mostra a tabela em outro idioma passa o `labels` montado a partir do próprio
 * conteúdo — é o que as docs pages fazem, lendo `demonstration.labels`.
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
  /**
   * Nome acessível do `<nav>` do rodapé, composto a partir da LEGENDA da
   * tabela.
   *
   * É função, e não texto montado em cada stack, porque o rodapé passou a ser
   * um landmark: `landmark-unique` do axe reprova dois `<nav>` com o mesmo
   * nome na mesma página, e a docs page do DataTable instancia até SETE
   * tabelas com paginação. A legenda já é única por instância (D4), então ela
   * é o que distingue.
   *
   * Sem legenda, devolve só a palavra — uma tabela sem nome é problema anterior
   * a este, e o portão de nome acessível é quem o cobra.
   */
  paginationNav: (caption: string) => string;
  rowsTotal: (n: number) => string;
  rowsSelected: (s: number, n: number) => string;
  allOption: string;
}

export const DATA_TABLE_LABELS_DEFAULT: DataTableLabels = {
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
  paginationNav: (caption) => (caption ? `Paginação — ${caption}` : 'Paginação'),
  rowsTotal: (n) => `${n} linha(s).`,
  rowsSelected: (s, n) => `${s} de ${n} linha(s) selecionada(s).`,
  allOption: 'Todos',
};
