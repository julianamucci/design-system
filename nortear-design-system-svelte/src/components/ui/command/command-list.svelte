<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		// O default da lib é "Suggestions..." — nome acessível em inglês num
		// produto em português. Quem consome pode sobrescrever.
		"aria-label": ariaLabel = "Resultados da busca",
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<!--
	Lista e viewport no MESMO nó.

	O bits-ui deriva do "viewport", e não da lista, os dois atributos que fazem
	o campo de busca ser uma combobox de verdade: `aria-controls` (que ele lê de
	`viewportNode.id`) e `aria-activedescendant` (que ele procura DENTRO do
	viewport). Sem um `Command.Viewport` montado os dois nascem `undefined` — o
	campo não aponta para lista nenhuma e as setas não anunciam o comando em
	destaque, que é o que `accessibility.aria` documenta e o que as outras
	stacks entregam. Até aqui o remendo morava nas stories, que escreviam
	`aria-controls` e `id` à mão: quem consumisse o componente recebia a
	combobox quebrada.

	Um viewport ANINHADO acenderia o `aria-activedescendant`, mas faria o
	`aria-controls` apontar para um `<div>` sem papel em vez do `role="listbox"`.
	Fundindo os dois conjuntos de props num nó só, o id apontado É o do listbox
	e os itens ficam dentro do viewport. Cada `attachRef` do bits-ui usa um
	símbolo próprio, então os dois refs continuam sendo preenchidos; o `id`
	fecha por último para o da lista vencer o gerado pelo viewport.
-->
<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	aria-label={ariaLabel}
	class={cn("nds-command-list", className)}
	{...restProps}
>
	{#snippet child({ props: listProps })}
		<CommandPrimitive.Viewport>
			{#snippet child({ props: viewportProps })}
				<div {...listProps} {...viewportProps} id={listProps.id as string}>
					{@render children?.()}
				</div>
			{/snippet}
		</CommandPrimitive.Viewport>
	{/snippet}
</CommandPrimitive.List>
