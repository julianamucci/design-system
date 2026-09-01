<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	/**
	 * Nome curto da etapa.
	 *
	 * Sem altura declarada (WCAG 1.4.4): o bloco cresce por `line-height`, e o
	 * título vive FORA do círculo do indicador, então nunca é recortado quando a
	 * pessoa aumenta a fonte do navegador.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> = $props();
</script>

<span
	bind:this={ref}
	{...restProps}
	data-slot="stepper-title"
	class={cn("nds-stepper-title", className)}
>
	{@render children?.()}
</span>
