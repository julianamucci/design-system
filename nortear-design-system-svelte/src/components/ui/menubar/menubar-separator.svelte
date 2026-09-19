<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenubarPrimitive.SeparatorProps = $props();
</script>

<!--
  O `role` vem DEPOIS do spread de propósito.

  O `MenuSeparatorState` do bits-ui fixa `role="group"` no separador
  (`bits-ui/dist/bits/menu/menu.svelte.js`, `props` do estado), e o componente da
  lib resolve com `mergeProps(restProps, state.props)` — o estado vem por último
  e ganha, então passar `role` como prop é ignorado em silêncio. Um
  `role="group"` vazio dentro de `role="menu"` é anunciado como um grupo sem nada
  dentro, e o divisor perde a semântica que as outras stacks entregam.
  Renderizar pelo snippet `child` é o que devolve a última palavra ao nosso
  markup — e o Vanilla, que é a referência, escreve `role="separator"`.

  Medido em navegador em 2026-09-18: este era o único dos quinze separadores da
  família que saía como `group`, e sem `aria-orientation`. O DropdownMenu e o
  ContextMenu desta stack já faziam o mesmo contorno.

  A premissa — o `role: "group"` cravado no estado da lib — é conferida por
  `bits-menu-premissas.test.ts`: se um bump do bits parar de cravá-lo, o contorno
  vira ruído e o portão avisa.
-->
<MenubarPrimitive.Separator bind:ref {...restProps}>
	{#snippet child({ props })}
		<div
			{...props}
			role="separator"
			aria-orientation="horizontal"
			data-slot="menubar-separator"
			class={cn("nds-dropdown-menu-separator", className)}
		></div>
	{/snippet}
</MenubarPrimitive.Separator>
