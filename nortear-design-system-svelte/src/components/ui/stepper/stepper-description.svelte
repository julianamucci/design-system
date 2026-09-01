<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	/**
	 * Texto de apoio da etapa, opcional.
	 *
	 * Fica dentro do gatilho, logo abaixo do título, e entra no nome acessível do
	 * controle junto com ele — é conteúdo, não decoração, e por isso não leva
	 * `aria-hidden`.
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
	data-slot="stepper-description"
	class={cn("nds-stepper-description", className)}
>
	{@render children?.()}
</span>
