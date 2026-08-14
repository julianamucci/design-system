<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn("nds-progress", className)}
	{value}
	{max}
	{...restProps}
>
	<!-- Sem classe de animação aqui: a lib já marca `data-indeterminate` na raiz
	     quando `value` é null, e é desse atributo que o CSS compartilhado tira a
	     largura do traço e a animação. As duas classes que moravam nesta linha
	     (`animate-indeterminate w-1/3`) não existem em CSS nenhum do projeto —
	     o indeterminado desenhava uma barra vazia e parada. -->
	<div
		data-slot="progress-indicator"
		class="nds-progress-indicator"
		style={value == null ? undefined : `transform: translateX(-${100 - (100 * value) / (max ?? 1)}%)`}
	></div>
</ProgressPrimitive.Root>
