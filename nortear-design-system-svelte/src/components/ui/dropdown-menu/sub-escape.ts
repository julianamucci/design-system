import { getContext, setContext } from 'svelte';

/**
 * Escape dentro de um submenu fecha SÓ o submenu — C5 do PRD do DropdownMenu,
 * e a mesma regra na barra de menus (`testes.functional.item12` do dropdown,
 * `item5` do menubar).
 *
 * O contrato é o da WAI-ARIA APG e o do vanilla: Escape fecha o menu em que o
 * foco está, devolve o foco ao item que o abriu, e o menu de fora segue aberto.
 * O bits fecha a árvore inteira. As camadas de Escape dele moram numa lista
 * global (`bits/utilities/escape-layer/use-escape-layer.svelte.js`), e a
 * responsável pela tecla é a ÚLTIMA com comportamento `close`: o painel raiz
 * nasce `close` e o do submenu `defer-otherwise-close`, então quem responde ao
 * Escape dado DENTRO do submenu é o raiz — e ele fecha tudo. Um nível de volta
 * custava os dois. Medido na fonte em 2026-09-11 (`bits-ui` 2.19.0); é o mesmo
 * mecanismo que o menu de contexto desta stack já contornava (`context-menu/
 * context.ts`).
 *
 * A camada ouve `keydown` no `document`, na borbulha. O painel do submenu ouve
 * na CAPTURA e interrompe a propagação antes dela; o resto é o que a própria lib
 * faz na seta esquerda (`SUB_CLOSE_KEYS`, em `menu-sub-content.svelte`): fecha o
 * submenu e foca o gatilho. Quem fecha é o nosso `Sub`, que guarda o estado
 * aberto — o contexto de menu do bits não é exportado. O gatilho se registra
 * aqui pelo `SubTrigger`, sem consulta ao DOM.
 *
 * Com o foco no menu RAIZ (o submenu aberto só pelo ponteiro), a tecla não passa
 * pelo painel do submenu: o raiz responde e fecha tudo, que é o certo — o foco
 * estava nele. Serve ao DropdownMenu, ao Menubar e ao ContextMenu: a lib dos
 * três é a mesma. O menu de contexto tinha uma cópia deste arquivo, linha a
 * linha, em `context-menu/context.ts` até 2026-09-11.
 */
export type MenuSubAccess = {
  setTrigger(node: HTMLElement | null): void;
  closeToTrigger(): void;
};

const MENU_SUB_KEY = Symbol('nds-menu-sub');

export function setMenuSub(access: MenuSubAccess): void {
  setContext(MENU_SUB_KEY, access);
}

export function useMenuSub(): MenuSubAccess | undefined {
  return getContext<MenuSubAccess | undefined>(MENU_SUB_KEY);
}

/**
 * Ouvinte de CAPTURA do painel do submenu — ver o docblock do módulo.
 *
 * Devolve a função que o remove, para o `$effect` do painel.
 */
export function keepRootOpenOnSubEscape(panel: HTMLElement, sub: MenuSubAccess): () => void {
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    // PATCH: a11y — o bits fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#svelte-menu-submenu-escape)
    event.preventDefault();
    event.stopPropagation();
    sub.closeToTrigger();
  }
  panel.addEventListener('keydown', onKeydown, true);
  return () => panel.removeEventListener('keydown', onKeydown, true);
}
