<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { buttonVariants, type ButtonSize } from "@/components/ui/button/index.js";
	let {
		ref = $bindable(null),
		class: className,
		size = "icon",
		isActive,
		page,
		children,
		...restProps
	}: PaginationPrimitive.PageProps & {
		size?: ButtonSize;
		isActive: boolean;
	} = $props();

	// O bits-ui fixa `aria-label="Page N"` — em inglês — nos próprios props da
	// Page, e vence o que o consumidor passa. Resultado: a paginação inteira era
	// anunciada em inglês, e a página atual não se distinguia das outras.
	// O snippet `child` é a única forma de escrever depois do merge da lib.
	// Consumidor que passar `aria-label` continua vencendo.
	const ariaLabel = $derived(
		((restProps as Record<string, unknown>)["aria-label"] as string | undefined) ??
			(isActive ? `Página atual, ${page.value}` : `Ir para página ${page.value}`),
	);
</script>

{#snippet Fallback()}
	{page.value}
{/snippet}

<PaginationPrimitive.Page
	bind:ref
	{page}
	aria-current={isActive ? "page" : undefined}
	data-slot="pagination-link"
	data-active={isActive}
	data-size={size}
	class={cn(
		buttonVariants({ size, variant: isActive ? "outline" : "ghost" }),
		"cn-pagination-link",
		className
	)}
	{...restProps}
>
	{#snippet child({ props })}
		<button {...props} aria-label={ariaLabel}>
			{#if children}
				{@render children?.()}
			{:else}
				{@render Fallback()}
			{/if}
		</button>
	{/snippet}
</PaginationPrimitive.Page>
