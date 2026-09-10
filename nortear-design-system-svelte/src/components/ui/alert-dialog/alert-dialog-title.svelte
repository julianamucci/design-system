<script lang="ts">
	/**
	 * Título do painel — um CABEÇALHO de verdade, `<h2>` por padrão.
	 *
	 * O título da lib renderiza `<div role="heading">`, e o `level` dela só
	 * alimenta o `aria-level`: a tag nunca muda. As outras quatro stacks entregam
	 * `<h2>` (e a folha documenta `<h2 class="nds-alert-dialog-title">`), então o
	 * wrapper assume a tag pelo snippet `child`, que é a delegação de elemento da
	 * lib. `level` troca a tag E o `aria-level` juntos — os dois saem do mesmo
	 * valor e não têm como discordar.
	 *
	 * Sem `child` para quem consome: a tag é o que este wrapper existe para
	 * garantir, e o `level` já cobre o único motivo de trocá-la.
	 */
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		level = 2,
		children,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.TitleProps> = $props();
</script>

<AlertDialogPrimitive.Title
	bind:ref
	data-slot="alert-dialog-title"
	class={cn("nds-alert-dialog-title", className)}
	{level}
	{...restProps}
>
	{#snippet child({ props })}
		<svelte:element this={`h${level}`} {...props}>
			{@render children?.()}
		</svelte:element>
	{/snippet}
</AlertDialogPrimitive.Title>
