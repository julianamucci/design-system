<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	/**
	 * Traço até a próxima etapa.
	 *
	 * Mora DENTRO do item, depois do gatilho, como a folha documenta — e não
	 * entre os itens. É isso que faz `.nds-stepper-item[data-state="completed"]
	 * .nds-stepper-separator` alcançá-lo sem regra extra.
	 *
	 * `aria-hidden` porque é desenho: a passagem de uma etapa para a seguinte já
	 * está na ordem da lista.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="stepper-separator"
	aria-hidden="true"
	class={cn("nds-stepper-separator", className)}
>
	{@render children?.()}
</div>
