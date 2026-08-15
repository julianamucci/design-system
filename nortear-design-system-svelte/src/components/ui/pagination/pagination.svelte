<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";

	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		count = 0,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		children,
		"aria-label": ariaLabel = "Paginação",
		...restProps
	}: PaginationPrimitive.RootProps & { "aria-label"?: string } = $props();
</script>

<!--
	O snippet `child` existe para trocar a TAG: o primitivo renderiza um `<div>`, e
	a anatomia que o conteúdo compartilhado documenta — e que as outras quatro
	stacks entregam — é um `<nav>`. `role="navigation"` num `div` cobre o leitor de
	tela, mas não o seletor `nav` de quem consome nem o CSS de quem estiliza.

	O nome acessível sai em português, como a documentação que o cerca, e continua
	sobrescrevível: quem tem mais de uma paginação na página passa `aria-label` e
	evita o `landmark-unique` do axe.

	Os `snippetProps` (`pages`, `range`, `currentPage`) precisam ser repassados à
	mão aqui — com `child`, o primitivo deixa de renderizar `children` sozinho.
-->
<PaginationPrimitive.Root
	bind:page
	{count}
	{perPage}
	{siblingCount}
	{...restProps}
>
	{#snippet child({ props, pages, range, currentPage })}
		<!--
			O papel é implícito no `<nav>`, sim — mas ele está escrito nas cinco
			stacks, e `data-slot` + `role` são o contrato de markup que a auditoria
			cross-stack compara. Tirar só aqui reabriria a divergência.
		-->
		<!-- svelte-ignore a11y_no_redundant_roles -->
		<nav
			{...props}
			bind:this={ref}
			role="navigation"
			aria-label={ariaLabel}
			data-slot="pagination"
			class={cn("nds-pagination", className)}
		>
			{@render children?.({ pages, range, currentPage })}
		</nav>
	{/snippet}
</PaginationPrimitive.Root>
