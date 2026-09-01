<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { Input } from "@/components/ui/input/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Input> = $props();
</script>

<!-- O campo dentro da moldura.

     A CLASSE zera a moldura própria do campo — duas bordas concêntricas no foco
     é o que a regra da folha existe para evitar. O `data-slot` é o que o
     `FormField` desta casa usa para achar o campo e ligar rótulo e descrição, e
     é também o que o atalho do addon procura. Os dois andam juntos, e por isso
     saem daqui juntos.

     `data-slot` chega ao `Input` como PROP (ele a declara com padrão `"input"`),
     e não pelo espalhamento: é o que garante que o valor daqui sobreviva. -->
<Input
	bind:ref
	data-slot="input-group-control"
	class={cn("nds-input-group-control", className)}
	bind:value
	{...props}
/>
