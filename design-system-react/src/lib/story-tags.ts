/**
 * Mapa de slug do componente -> categoria usada como tag no Storybook.
 *
 * As tags habilitam o filtro nativo da sidebar (`tags-filter`). Cada arquivo
 * `*.stories.tsx` em `src/components/ui/` deve incluir manualmente a tag de
 * categoria correspondente no array `tags` do `meta`. Este helper serve como
 * fonte canônica do mapeamento e referência para manutenção.
 *
 * Categorias (8):
 *  - layout      contêineres e espaçamento
 *  - navigation  navegação primária/secundária
 *  - form        entrada de dados
 *  - feedback    sinais de estado do sistema
 *  - display     apresentação de dados/mídia
 *  - tables      tabelas e data grids
 *  - disclosure  expansão/colapso de conteúdo
 *  - overlay     camadas flutuantes (dialog, popover, menu...)
 */

const CATEGORY_BY_SLUG: Record<string, string> = {
  // layout
  card: "layout",
  sidebar: "layout",
  "scroll-area": "layout",
  "aspect-ratio": "layout",
  resizable: "layout",
  separator: "layout",

  // navigation
  breadcrumb: "navigation",
  menubar: "navigation",
  "navigation-menu": "navigation",
  pagination: "navigation",
  tabs: "navigation",

  // form
  button: "form",
  input: "form",
  textarea: "form",
  select: "form",
  "date-picker": "form",
  calendar: "form",
  checkbox: "form",
  "radio-group": "form",
  switch: "form",
  slider: "form",
  form: "form",
  "input-otp": "form",
  label: "form",
  toggle: "form",
  "toggle-group": "form",

  // feedback
  alert: "feedback",
  badge: "feedback",
  progress: "feedback",
  skeleton: "feedback",
  sonner: "feedback",

  // display
  avatar: "display",
  carousel: "display",
  chart: "display",

  // tables
  table: "tables",
  "data-table": "tables",

  // disclosure
  accordion: "disclosure",
  collapsible: "disclosure",
  sheet: "disclosure",
  drawer: "disclosure",

  // overlay
  dialog: "overlay",
  "alert-dialog": "overlay",
  "dropdown-menu": "overlay",
  popover: "overlay",
  tooltip: "overlay",
  "context-menu": "overlay",
  command: "overlay",
  "hover-card": "overlay",
};

/**
 * Slugs compostos reconhecidos pelo filename (parte antes do primeiro `-`
 * já não é suficiente). Use este array para extrair o slug a partir do nome
 * do arquivo de story (ex.: `alert-dialog-estados.stories.tsx` -> `alert-dialog`).
 */
export const COMPOUND_SLUGS = [
  "alert-dialog",
  "data-table",
  "dropdown-menu",
  "hover-card",
  "context-menu",
  "navigation-menu",
  "scroll-area",
  "aspect-ratio",
  "radio-group",
  "toggle-group",
  "input-otp",
  "date-picker",
] as const;

/**
 * Retorna a tag de categoria para um slug. Slugs desconhecidos retornam
 * `undefined` (o caller decide se omite a tag ou lança erro).
 */
export function getCategoryTag(slug: string): string | undefined {
  return CATEGORY_BY_SLUG[slug];
}
