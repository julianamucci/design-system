import { getContext, setContext } from 'svelte';
import type { MenuRootAccess } from '@/components/ui/dropdown-menu/tab-leaves-menu';

/**
 * A raiz da barra, para o Tab que a lib deixa sem fechar quando o gatilho do
 * menu aberto é a última (ou, no Shift+Tab, a primeira) parada da página. O
 * mecanismo e a medição estão em `dropdown-menu/tab-leaves-menu.ts`, de onde vem
 * o `closeAfterTab`: a lib é a mesma (`handleTabKeyDown` do menu do bits-ui).
 */
const MENUBAR_ROOT_KEY = Symbol('nds-menubar-root');

export function setMenubarRoot(access: MenuRootAccess): void {
  setContext(MENUBAR_ROOT_KEY, access);
}

export function useMenubarRoot(): MenuRootAccess | undefined {
  return getContext<MenuRootAccess | undefined>(MENUBAR_ROOT_KEY);
}
