/**
 * Mapeia o slug de um componente para sua tag de categoria,
 * usada nos filtros nativos da sidebar do Storybook.
 */
const CATEGORY_BY_SLUG: Record<string, string> = {
  // layout
  'card': 'layout',
  'sidebar': 'layout',
  'scroll-area': 'layout',
  'aspect-ratio': 'layout',
  'resizable': 'layout',
  'separator': 'layout',

  // navigation
  'breadcrumb': 'navigation',
  'menubar': 'navigation',
  'navigation-menu': 'navigation',
  'pagination': 'navigation',
  'tabs': 'navigation',

  // form
  'button': 'form',
  'input': 'form',
  'textarea': 'form',
  'select': 'form',
  'date-picker': 'form',
  'calendar': 'form',
  'checkbox': 'form',
  'radio-group': 'form',
  'switch': 'form',
  'slider': 'form',
  'form': 'form',
  'input-otp': 'form',
  'label': 'form',
  'toggle': 'form',
  'toggle-group': 'form',

  // feedback
  'alert': 'feedback',
  'badge': 'feedback',
  'progress': 'feedback',
  'skeleton': 'feedback',
  'sonner': 'feedback',

  // display
  'avatar': 'display',
  'carousel': 'display',
  'chart': 'display',

  // tables
  'table': 'tables',
  'data-table': 'tables',

  // disclosure
  'accordion': 'disclosure',
  'collapsible': 'disclosure',
  'sheet': 'disclosure',
  'drawer': 'disclosure',

  // overlay
  'dialog': 'overlay',
  'alert-dialog': 'overlay',
  'dropdown-menu': 'overlay',
  'popover': 'overlay',
  'tooltip': 'overlay',
  'context-menu': 'overlay',
  'command': 'overlay',
  'hover-card': 'overlay',
};

/**
 * Retorna a tag de categoria para um slug de componente.
 * Retorna string vazia caso o slug não esteja mapeado.
 */
export function getCategoryTag(slug: string): string {
  return CATEGORY_BY_SLUG[slug] ?? '';
}
