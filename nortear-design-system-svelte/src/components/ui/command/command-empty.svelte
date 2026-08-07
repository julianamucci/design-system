<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.EmptyProps = $props();
</script>

<!-- role="option" + aria-disabled: quando a busca não casa com nada, a lista
     fica sendo um `role="listbox"` sem nenhum filho `option`, e o axe reprova
     (aria-required-children). Anunciar a mensagem como opção desabilitada
     mantém a estrutura ARIA válida e faz o leitor de tela ler o motivo da lista
     vazia, em vez de anunciar uma lista que parece quebrada. -->
<CommandPrimitive.Empty
	bind:ref
	data-slot="command-empty"
	role="option"
	aria-disabled="true"
	class={cn("nds-command-empty", className)}
	{...restProps}
/>
