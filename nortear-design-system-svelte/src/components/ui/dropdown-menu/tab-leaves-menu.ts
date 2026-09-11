import { getContext, setContext } from 'svelte';

/**
 * Tab SAI do menu e o fecha — C2 do PRD do DropdownMenu, e a mesma regra na
 * barra de menus ("Tab sai do Menubar inteiro").
 *
 * A lib cumpre quando existe uma próxima parada de tabulação depois do gatilho:
 * em `handleTabKeyDown` (`bits-ui/dist/bits/menu/menu.svelte.js:816-848`) ela
 * barra a tecla, fecha a raiz e leva o foco a essa parada. Quando o gatilho é a
 * ÚLTIMA parada da página — ou a primeira, no Shift+Tab —, `getTabbableFrom`
 * não acha ninguém e o ramo `else` só chama `body.focus()`: a tecla continua
 * barrada, a raiz continua aberta e o foco continua no menu. Tab passava a
 * prender o foco, o contrário de C2. Medido em 2026-09-10 nas stories
 * `TabAtPageEnd` do DropdownMenu e do Menubar, vermelhas antes deste arquivo.
 *
 * O conserto fica nos wrappers, sem patch: DEPOIS que a lib trata a tecla, se a
 * raiz ainda estiver aberta, ela fecha por aqui — e o foco volta ao gatilho pelo
 * caminho de sempre da lib. Mesmo desenho do menu de contexto desta stack.
 */
export type MenuRootAccess = {
  isOpen(): boolean;
  /** Fecha E avisa quem consome: o fechamento vindo de fora do primitivo não
   *  passa pelo aviso dele. */
  close(): void;
};

const DROPDOWN_ROOT_KEY = Symbol('nds-dropdown-menu-root');

export function setDropdownMenuRoot(access: MenuRootAccess): void {
  setContext(DROPDOWN_ROOT_KEY, access);
}

export function useDropdownMenuRoot(): MenuRootAccess | undefined {
  return getContext<MenuRootAccess | undefined>(DROPDOWN_ROOT_KEY);
}

/**
 * O fechamento por Tab que a lib não faz.
 *
 * Roda numa microtarefa para ver o que a lib JÁ fez com a mesma tecla: se ela
 * fechou (havia próxima parada), a raiz está fechada e nada acontece aqui — sem
 * aviso duplicado. Só o ramo que ela deixa aberto fecha.
 */
export function closeAfterTab(event: KeyboardEvent, root: MenuRootAccess | undefined): void {
  if (event.key !== 'Tab' || !root) return;
  queueMicrotask(() => {
    if (root.isOpen()) root.close();
  });
}
