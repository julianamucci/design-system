<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<!--
  O `role` vem DEPOIS do spread de propósito.

  O `MenuSeparatorState` do bits-ui fixa `role="group"` no separador, e o
  componente da lib resolve as props com `mergeProps(restProps, state.props)` —
  o estado vem por último e ganha, então passar `role` como prop é ignorado em
  silêncio. Um `role="group"` vazio dentro de `role="menu"` é anunciado como um
  grupo sem nada dentro, e o divisor perde a semântica que as outras stacks
  entregam. Renderizar pelo snippet `child` é o que devolve a última palavra ao
  nosso markup — e o Vanilla, que é a referência, escreve `role="separator"`.
-->
<DropdownMenuPrimitive.Separator bind:ref {...restProps}>
	{#snippet child({ props })}
		<div
			{...props}
			role="separator"
			aria-orientation="horizontal"
			data-slot="dropdown-menu-separator"
			class={cn("nds-dropdown-menu-separator", className)}
		></div>
	{/snippet}
</DropdownMenuPrimitive.Separator>
