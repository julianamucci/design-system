/**
 * Mapeamento slug → categoria de tag para filtros nativos da sidebar do Storybook.
 *
 * Cada componente UI pertence a UMA categoria. As tags são aplicadas no `meta.tags`
 * de cada `*.stories.ts` para permitir filtragem por categoria na sidebar.
 */

const CATEGORY_MAP: Record<string, string> = {
  // layout
  card: 'layout',
  sidebar: 'layout',
  'scroll-area': 'layout',
  'aspect-ratio': 'layout',
  resizable: 'layout',
  separator: 'layout',

  // navigation
  breadcrumb: 'navigation',
  menubar: 'navigation',
  'navigation-menu': 'navigation',
  pagination: 'navigation',
  tabs: 'navigation',

  // form
  button: 'form',
  input: 'form',
  textarea: 'form',
  select: 'form',
  'date-picker': 'form',
  calendar: 'form',
  checkbox: 'form',
  'radio-group': 'form',
  switch: 'form',
  slider: 'form',
  form: 'form',
  'input-otp': 'form',
  label: 'form',
  toggle: 'form',
  'toggle-group': 'form',

  // feedback
  alert: 'feedback',
  badge: 'feedback',
  progress: 'feedback',
  skeleton: 'feedback',
  sonner: 'feedback',

  // display
  avatar: 'display',
  carousel: 'display',
  chart: 'display',

  // tables
  table: 'tables',
  'data-table': 'tables',

  // disclosure
  accordion: 'disclosure',
  collapsible: 'disclosure',
  sheet: 'disclosure',
  drawer: 'disclosure',

  // overlay
  dialog: 'overlay',
  'alert-dialog': 'overlay',
  'dropdown-menu': 'overlay',
  popover: 'overlay',
  tooltip: 'overlay',
  'context-menu': 'overlay',
  command: 'overlay',
  'hover-card': 'overlay',
};

/**
 * Retorna a tag de categoria para um slug de componente.
 * Lança erro em runtime se o slug não tiver categoria mapeada,
 * forçando atualização do mapa quando novos componentes são adicionados.
 */
export function getCategoryTag(slug: string): string {
  const tag = CATEGORY_MAP[slug];
  if (!tag) {
    throw new Error(`[story-tags] sem categoria mapeada para o slug "${slug}"`);
  }
  return tag;
}
