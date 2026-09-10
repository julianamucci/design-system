<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { useCommandSearchContext } from "./command-context.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		"aria-label": ariaLabel,
		onmousedown,
		...restProps
	}: CommandPrimitive.ListProps = $props();

	/**
	 * O ponteiro não tira o foco do campo — a forma do Vanilla, que cancela o
	 * `mousedown` na lista.
	 *
	 * Os itens não são focáveis (D1), e o `mousedown` num elemento não focável
	 * leva o foco para o ancestral focável mais próximo. Até 2026-09-10 esse
	 * ancestral era a raiz, que a lib marcava com `tabindex="-1"` e que também
	 * escutava as setas; sem ele (ver `command.svelte`), o foco cairia no
	 * `body` e a próxima seta não moveria nada. Cancelar o `mousedown` mantém o
	 * foco onde a paleta o quer, no campo — o `click` continua disparando, e é
	 * ele que escolhe o comando. O manipulador de quem consome roda antes.
	 */
	function handleMousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousedown?.(event);
		event.preventDefault();
	}

	/**
	 * O nome da lista é o placeholder do campo — a forma do Vanilla (ver
	 * `command-context.ts`). O default da lib é "Suggestions...", em inglês em
	 * qualquer idioma; o desta stack era "Resultados da busca", em português em
	 * qualquer idioma. Quem consome ainda pode nomear à mão.
	 *
	 * O último recurso, sem placeholder nenhum, é o mesmo do Vanilla.
	 */
	const search = useCommandSearchContext();
	const listName = $derived(ariaLabel ?? (search?.placeholder || "Resultados"));
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
	aria-label={listName}
	onmousedown={handleMousedown}
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
