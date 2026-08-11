<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		size = "md",
		isActive = false,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		size?: "sm" | "md";
		isActive?: boolean;
	} = $props();

	const mergedProps = $derived({
		class: cn(
			"nds-sidebar-menu-sub-button",
			className
		),
		"data-slot": "sidebar-menu-sub-button",
		"data-sidebar": "menu-sub-button",
		"data-size": size,
		// "true" quando ativo e ausente quando não: é a forma que a folha
		// compartilhada casa, e a mesma que as outras implementações emitem.
		"data-active": isActive ? "true" : undefined,
		...restProps,
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<a bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</a>
{/if}
