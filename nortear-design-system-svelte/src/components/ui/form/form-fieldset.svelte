<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "@/lib/utils.js";

	let {
		legend,
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLFieldSetElement> & {
		/** Texto da legenda. Leitores de tela a anunciam antes de cada campo. */
		legend?: string;
		children: Snippet;
	} = $props();
</script>

<fieldset data-slot="fieldset" class={cn("nds-form-fieldset", className)} {...restProps}>
	<!-- A legenda é o PRIMEIRO filho: fora da primeira posição ela deixa de
	     rotular o <fieldset>, o texto continua na tela e o grupo fica anônimo. -->
	{#if legend}
		<legend data-slot="fieldset-legend" class="nds-form-legend">{legend}</legend>
	{/if}
	{@render children()}
</fieldset>
