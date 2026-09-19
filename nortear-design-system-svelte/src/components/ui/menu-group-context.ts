// Arquivo próprio, ao lado das três pastas de menu, e não dentro de uma delas:
// serve os TRÊS membros da família — o ContextMenu, o DropdownMenu e o Menubar.
// É a mesma decisão do `menu-close-reason.ts` vizinho, pelo mesmo motivo: um
// arquivo por componente vira três cópias que divergem.

import { getContext, setContext } from 'svelte';

/** Os três membros da família de menus desta stack. */
export type MenuFamilyMember = 'dropdown-menu' | 'context-menu' | 'menubar';

/**
 * Marca de "estou dentro de um grupo" — é ela que decide se o rótulo NOMEIA.
 *
 * O rótulo nomeia um bloco, e nomear exige que exista um bloco: o `Label` das
 * três peças era um `<div>` solto que desenhava igual ao das outras quatro
 * stacks e não amarrava nada — quem nomeava era outra peça, com outro
 * `data-slot` (`*-group-heading`). Dentro de `Group` ou `RadioGroup` o `Label`
 * passa a ser o cabeçalho da lib, e a lib escreve o `id` dele no
 * `aria-labelledby` do grupo: o leitor de tela anuncia "Visualização, grupo" em
 * vez de um bloco anônimo, como no vanilla (onde o rótulo abre o grupo sozinho).
 *
 * A marca existe porque o cabeçalho da lib EXIGE o contexto de grupo e lança
 * erro fora dele, e o contexto da lib não é exportado. Os dois contextos correm
 * pela mesma árvore de componentes, então a marca acompanha o da lib: é ligada
 * pelos wrappers `*-group.svelte` e `*-radio-group.svelte`, os dois pontos em
 * que a lib também abre um grupo. Fora deles o rótulo continua sendo o `<div>`
 * de antes — solto, e sem nome a dar.
 *
 * A chave é POR MEMBRO, e não uma só: o painel de um menu pode nascer dentro da
 * árvore de componentes de outro (um DropdownMenu montado a partir de um item de
 * ContextMenu), e uma chave compartilhada faria o rótulo do de fora se declarar
 * dentro do grupo do de dentro. Foi por isso que o ContextMenu já nasceu com a
 * sua, e o que este módulo faz é deixar de ter três cópias do mecanismo.
 */
const KEYS: Record<MenuFamilyMember, symbol> = {
  'dropdown-menu': Symbol('nds-dropdown-menu-group'),
  'context-menu': Symbol('nds-context-menu-group'),
  menubar: Symbol('nds-menubar-group'),
};

/** Abre o escopo de grupo deste membro. Chamado no wrapper de `Group`/`RadioGroup`. */
export function markMenuGroup(member: MenuFamilyMember): void {
  setContext(KEYS[member], true);
}

/** O rótulo deste membro está dentro de um grupo dele? */
export function isInsideMenuGroup(member: MenuFamilyMember): boolean {
  return getContext<boolean | undefined>(KEYS[member]) === true;
}
