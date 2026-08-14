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

	Divergência conhecida, e ela é de conteúdo, não de código: `screenReader.onFilter`
	descreve uma região viva anunciando o vazio, que é o que a stack Angular faz
	tirando a mensagem de dentro da lista. Aqui a estrutura básica publicada em
	`anatomy.structureCode` (que esta stack herda da variante `react`, onde o
	cmdk de fato mantém o vazio dentro da lista) ensina o contrário — mover a
	peça aqui deixaria o componente e o snippet documentado em desacordo. A
	saída é uma variante `svelte` no conteúdo compartilhado; enquanto ela não
	existe, a mensagem continua sendo lida (como opção não selecionável), e
	nenhuma story declara cobertura de "região viva".
-->
<CommandPrimitive.Empty
	bind:ref
	data-slot="command-empty"
	role="option"
	aria-disabled="true"
	class={cn("nds-command-empty", className)}
	{...restProps}
/>
