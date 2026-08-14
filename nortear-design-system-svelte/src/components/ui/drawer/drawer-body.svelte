<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	/**
	 * Corpo rolável do painel.
	 *
	 * `tabindex="0"` é obrigatório, não decoração: região que rola precisa ser
	 * alcançável por teclado (WCAG 2.1.1 — regra `scrollable-region-focusable`
	 * do axe). `role` e nome acessível ficam com quem compõe, porque só ali se
	 * sabe o que a região contém.
	 *
	 * `.nds-drawer-body` traz `flex: 1`, `min-height: 0` e `overflow: auto`. É o
	 * `min-height: 0` que faz o corpo ceder altura dentro do flex em coluna, em
	 * vez de esticar o painel e empurrar o rodapé (com as ações) para fora da
	 * tela.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	data-slot="drawer-body"
	tabindex="0"
	class={cn("nds-drawer-body", className)}
	{...restProps}
>
	{@render children?.()}
</div>
