<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Textarea } from "@/components/ui/textarea/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Textarea> = $props();
</script>

<!-- A alternativa de várias linhas para o mesmo lugar do campo. Presente, a
     folha compartilhada faz o grupo empilhar sozinha, por `:has(> textarea)` —
     não há opção de direção para passar.

     Mesma dupla do campo de uma linha: a classe zera a moldura própria e o
     `data-slot` é o gancho do `FormField` e do atalho do addon. Procurar o campo
     pela CLASSE, e não pelo elemento `input`, é o que faz o atalho alcançar
     também esta área de texto. -->
<Textarea
	bind:ref
	data-slot="input-group-control"
	class={cn("nds-input-group-control", className)}
	bind:value
	{...props}
/>
