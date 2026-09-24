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
		appearance = "ghost",
		"aria-label": ariaLabel = "Ir para a página anterior",
		...restProps
	}: PaginationPrimitive.PrevButtonProps & {
		text?: string;
		/** Aparência do controle. Padrão `ghost` — ver a nota em pagination-link.svelte. */
		appearance?: "ghost" | "outline";
		"aria-label"?: string;
	} = $props();

	/**
	 * Sem texto visível o direcional é um controle SÓ DE ÍCONE, e então ele é
	 * quadrado como o numerado. É a forma que o rodapé do DataTable usa.
	 */
	const iconOnly = $derived(!text);
</script>

<!--
	`nds-pagination-prev` é a classe do design system que dá o recuo assimétrico do
	lado do ícone. No lugar dela havia `pl-1.5!`, do framework utilitário que saiu:
	classe inerte, e o recuo nunca chegou à tela. O recuo existe para abrir espaço
	ENTRE o chevron e a palavra ao lado; num quadrado ele só desalinharia o ícone,
	e por isso ele sai junto com o texto.

	`data-slot="pagination-previous"`: o slot é o contrato de markup que as cinco
	stacks compartilham, e aqui ele dizia `pagination-link` — o mesmo dos números.

	O `<span>` do rótulo não nasce vazio: `.nds-pagination-label` é `block` acima
	de 40rem, e um bloco sem texto ainda ocuparia uma linha inteira dentro do
	botão. Quem nomeia o controle é o `aria-label`, que não depende do visível.
-->
<PaginationPrimitive.PrevButton
	bind:ref
	aria-label={ariaLabel}
	data-slot="pagination-previous"
	class={cn(
		buttonVariants({ variant: appearance, size: iconOnly ? "icon" : "default" }),
		iconOnly ? undefined : "nds-pagination-prev",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<ChevronLeftIcon data-icon="inline-start" />
		{#if !iconOnly}
			<span class="nds-pagination-label">{text}</span>
		{/if}
	{/if}
</PaginationPrimitive.PrevButton>
