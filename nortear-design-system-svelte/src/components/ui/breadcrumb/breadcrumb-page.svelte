<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<!-- A anatomia documentada é literal: "último item com aria-current='page'; nunca é
   link". O role="link" com aria-disabled fazia o leitor de tela anunciar
   justamente o contrário — "link, desabilitado" — para um texto que nunca foi
   navegável. Quem marca a página atual é o aria-current, e ele vale em
   qualquer elemento. -->
<span
	bind:this={ref}
	data-slot="breadcrumb-page"
	aria-current="page"
	class={cn("nds-breadcrumb-page", className)}
	{...restProps}
>
	{@render children?.()}
</span>
