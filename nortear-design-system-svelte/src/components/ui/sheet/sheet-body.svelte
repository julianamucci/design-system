<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * Corpo rolável do painel.
	 *
	 * `tabindex="0"`, como no Vanilla: quando o conteúdo passa da altura do
	 * painel, a região rolável precisa ser alcançável por teclado (WCAG 2.1.1 —
	 * é a regra `scrollable-region-focusable` do axe). O `flex` do CSS
	 * compartilhado é o que mantém o rodapé no lugar enquanto o corpo rola.
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
	data-slot="sheet-body"
	tabindex="0"
	class={cn("nds-sheet-body", className)}
	{...restProps}
>
	{@render children?.()}
</div>
