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
	// anunciada em inglês. O snippet `child` é a única forma de escrever depois do
	// merge da lib. Consumidor que passar `aria-label` continua vencendo.
	//
	// A página atual NÃO ganha rótulo diferente: quem anuncia "página atual" é o
	// `aria-current="page"`, nativamente e em qualquer idioma. Um rótulo especial
	// aqui divergia das outras stacks e duplicava o anúncio.
	const ariaLabel = $derived(
		((restProps as Record<string, unknown>)["aria-label"] as string | undefined) ??
			`Ir para página ${page.value}`,
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
	data-active={isActive ? "true" : undefined}
	class={cn(buttonVariants({ size, variant: isActive ? "outline" : "ghost" }), className)}
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
