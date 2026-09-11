/**
 * O estado de UMA prévia viva de menu nas docs pages do DropdownMenu e do
 * Menubar — as marcações e as escolhas únicas, pelo id estável de cada uma.
 *
 * A prévia (`DropdownMenuPreview.vue`, `MenubarPreview.vue`) cria o estado a
 * partir da MESMA lista de entradas que imprime o código do card
 * (`dropdownMenuSnippet`, `menubarSnippet`), e as entradas o leem por
 * `provide`/`inject`: a lista é recursiva (grupo e submenu têm entradas dentro),
 * e passar o estado de prop em prop pela recursão era ruído.
 *
 * O valor inicial de cada marcação é o `checked` da entrada, e o de cada grupo
 * de escolha única é o `selected` — os mesmos que o snippet declara no `ref`.
 * Por isso o código ao lado da prévia mostra o menu COMO ELE ABRE.
 */
import type { InjectionKey } from 'vue';

export interface MenuPreviewContext {
  /** Marcação de cada item de marcação, pelo `value` dele — objeto reativo. */
  checked: Record<string, boolean>;
  /** Opção escolhida de cada grupo de escolha única, pelo `value` do grupo — objeto reativo. */
  radio: Record<string, string>;
  /**
   * Um item foi escolhido (ou marcado): o `value` dele, que é o id estável. Na
   * barra de menus vem junto o `value` do menu em que o item mora — é ele que
   * distingue `demo-file` de `demo-edit` no evento.
   */
  select: (value: string, menu?: string) => void;
}

export const MENU_PREVIEW: InjectionKey<MenuPreviewContext> = Symbol('nds-docs-menu-preview');

/** O que o estado inicial precisa de uma entrada, nas duas famílias de lista. */
interface SelectionSource {
  kind: string;
  value?: string;
  checked?: boolean;
  selected?: string;
  items?: readonly SelectionSource[];
}

/** As marcações e as escolhas únicas iniciais, varrendo grupos e submenus. */
export function initialSelection(entries: readonly SelectionSource[]): Pick<MenuPreviewContext, 'checked' | 'radio'> {
  const checked: Record<string, boolean> = {};
  const radio: Record<string, string> = {};
  const visit = (list: readonly SelectionSource[]) => {
    for (const entry of list) {
      if (entry.kind === 'checkbox' && entry.value) checked[entry.value] = entry.checked === true;
      if (entry.kind === 'radio-group' && entry.value) radio[entry.value] = entry.selected ?? '';
      if (entry.items) visit(entry.items);
    }
  };
  visit(entries);
  return { checked, radio };
}
