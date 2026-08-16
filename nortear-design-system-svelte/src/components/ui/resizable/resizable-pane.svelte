<script lang="ts">
	import * as ResizablePrimitive from "paneforge";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ResizablePrimitive.PaneProps = $props();
</script>

<!--
	O painel vinha CRU da lib: sem `data-slot` e sem a classe do contrato. A sonda
	procurou os painéis pelo contrato `.nds-*` e encontrou zero nesta stack — os
	testes contavam grupos e punhos, nunca painéis, e por isso a ausência
	atravessou todas as auditorias. O tamanho continua vindo do primitivo, em
	`style` inline; a classe traz identidade, não medida.
-->
<ResizablePrimitive.Pane
	bind:ref
	data-slot="resizable-panel"
	class={cn("nds-resizable-panel", className)}
	{...restProps}
>
	{@render children?.()}
</ResizablePrimitive.Pane>
