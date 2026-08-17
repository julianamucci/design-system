<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		loadingStatus = $bindable("loading"),
		delayMs,
		size = "md",
		class: className,
		children,
		...restProps
	}: AvatarPrimitive.RootProps & {
		/** Atraso da troca entre fallback e imagem. Nesta lib a prop é da raiz. */
		delayMs?: number;
		/** Presets do CSS: sm 24 · md 32 · lg 40 · xl 48 · 2xl 64. */
		size?: "sm" | "md" | "lg" | "xl" | "2xl";
	} = $props();
</script>

<!--
	`<span>` pela snippet `child`, e não o `<div>` que o bits-ui renderiza por
	padrão. O contrato de markup do design system é span (docblock de
	nds/avatar.css, e as outras quatro stacks), e a diferença não é cosmética: o
	avatar mora dentro de texto corrido — nome de autor, item de lista, célula de
	tabela — e `<div>` dentro de `<p>` é aninhamento inválido, que o navegador
	corrige fechando o parágrafo antes do avatar. `.nds-avatar` já é
	`inline-flex`, então o desenho não muda. Medido pela sonda: era a única stack
	com a raiz em `div`.
-->
<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	{delayMs}
	data-slot="avatar"
	data-size={size}
	class={cn(
		"nds-avatar",
		className
	)}
	{...restProps}
>
	{#snippet child({ props })}
		<span {...props}>{@render children?.()}</span>
	{/snippet}
</AvatarPrimitive.Root>
