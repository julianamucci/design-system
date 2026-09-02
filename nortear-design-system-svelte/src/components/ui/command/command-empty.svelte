<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.EmptyProps = $props();
</script>

<!--
	`role="option"` + `aria-disabled` porque a mensagem mora DENTRO do
	`role="listbox"`, e ali só `option` e `group` são filhos permitidos.

	Medido no axe-core desta versão (`ariaRequiredChildrenEvaluate`): quando a
	busca não casa com nada, todos os itens saem do DOM e a lista fica sem
	nenhuma opção — um listbox vazio está em `reviewEmpty` e sai como
	"incomplete", que não reprova. Mas a frase é conteúdo: um `<div>` sem papel
	dentro do listbox faz o avaliador descer até o nó de texto, `isContent`
	devolve verdadeiro e a regra passa a REPROVAR. `role="status"` reprova
	antes disso, como filho não permitido.

	Divergência conhecida, e ela é de CONTEÚDO: `accessibility.screenReader.onFilter`
	promete, nas cinco docs pages, uma região viva anunciando o vazio — o que
	três das cinco stacks entregam pondo a mensagem FORA da lista, com
	`role="status"` + `aria-live`. Aqui ela é lida como opção não selecionável,
	e não é anunciada.

	Correção de 2026-09-02, porque o texto anterior estava errado: esta stack
	NÃO herda a variante `react` de `anatomy.structureCode` — existe uma chave
	`svelte`, e ela mostra o vazio dentro da lista, exatamente como o componente
	faz. Snippet e componente estão de acordo; o que está em desacordo é a
	promessa da região viva.

	Sair disso é decisão da dona, e o caminho está medido: `Command.Root` desta
	lib aceita `onStateChange`, que entrega `filtered.count` — dá para montar a
	região viva fora da `Command.List` sem tocar na lib. Nenhuma story declara
	cobertura de "região viva" enquanto isso não acontece.
-->
<CommandPrimitive.Empty
	bind:ref
	data-slot="command-empty"
	role="option"
	aria-disabled="true"
	class={cn("nds-command-empty", className)}
	{...restProps}
/>
