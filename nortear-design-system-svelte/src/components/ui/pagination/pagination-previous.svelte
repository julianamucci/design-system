<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { buttonVariants } from "../button/index.js";
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	let {
		ref = $bindable(null),
		class: className,
		children,
		text = "Anterior",
		"aria-label": ariaLabel = "Ir para a página anterior",
		...restProps
	}: PaginationPrimitive.PrevButtonProps & { text?: string; "aria-label"?: string } = $props();
</script>

<!--
	`nds-pagination-prev` é a classe do design system que dá o recuo assimétrico do
	lado do ícone. No lugar dela havia `pl-1.5!`, do framework utilitário que saiu:
	classe inerte, e o recuo nunca chegou à tela.

	`data-slot="pagination-previous"`: o slot é o contrato de markup que as cinco
	stacks compartilham, e aqui ele dizia `pagination-link` — o mesmo dos números.
-->
<PaginationPrimitive.PrevButton
	bind:ref
	aria-label={ariaLabel}
	data-slot="pagination-previous"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "nds-pagination-prev", className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<ChevronLeftIcon data-icon="inline-start" />
		<span class="nds-pagination-label">{text}</span>
	{/if}
</PaginationPrimitive.PrevButton>
