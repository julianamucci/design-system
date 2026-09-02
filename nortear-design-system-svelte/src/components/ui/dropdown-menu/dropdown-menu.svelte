<script lang="ts">
	/**
	 * CONTRATO DE ACESSIBILIDADE DO MENU — versão curta; o bloco canônico, com a
	 * medição das cinco stacks, está no cabeçalho do `dropdown-menu` do Vanilla.
	 *
	 * Cumprido igual em todas: `aria-haspopup="menu"` + `aria-expanded` no
	 * gatilho; `role="menu"` no painel e `menuitem` / `menuitemcheckbox` /
	 * `menuitemradio` nos itens; setas, `Home`/`End` e typeahead; `Escape` fecha
	 * e devolve o foco ao gatilho; nenhuma região viva.
	 *
	 * MECANISMO DESTA STACK: o item DESABILITADO SAI do percurso das setas. Em
	 * `bits/menu/menu.svelte.js` o painel coleta candidatos por
	 * `querySelectorAll('[…item]:not([data-disabled])')`, e `Home`/`End` vêm do
	 * `internal/roving-focus-group`. Duas das cinco stacks fazem o contrário e
	 * nenhuma prop inverte isso; a story `ItemDisabled` assere o que ESTA lib
	 * faz. Medido na fonte em 2026-09-02.
	 */
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: DropdownMenuPrimitive.RootProps = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps} />
