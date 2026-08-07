<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef, type WithoutChildren } from "@/lib/utils.js";
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';

	let {
		ref = $bindable(null),
		class: className,
		label,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
		/**
		 * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
		 * são anunciadas; sem ele, ficam decorativas — que é o certo quando um
		 * gatilho as envolve e já carrega o próprio nome.
		 */
		label?: string;
	} = $props();
</script>

<!-- O texto sr-only morava DENTRO de um aria-hidden: nenhum leitor de tela chegava
   nele, então o rótulo não existia na prática — e ainda estava em inglês num
   produto em português. As reticências são decorativas mesmo; quem nomeia o
   conjunto oculto é o gatilho que as envolve, como na composição com menu. -->
<span
	bind:this={ref}
	data-slot="breadcrumb-ellipsis"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	class={cn("nds-breadcrumb-ellipsis", className)}
	{...restProps}
>
	<MoreHorizontalIcon />
</span>
