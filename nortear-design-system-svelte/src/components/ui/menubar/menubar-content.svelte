<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import MenubarPortal from "./menubar-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	/**
	 * O `id` do painel é NOSSO, e é carimbado no elemento à mão.
	 *
	 * A busca por letra do bits-ui (`Letras alfabéticas — typeahead em Items`, que
	 * o conteúdo compartilhado promete) só roda quando
	 * `target.closest('[data-menubar-content]').id` é igual ao `contentId` que a
	 * lib guarda. E o `menubar-content` dela consome o `id` recebido para montar o
	 * estado e NÃO o repassa ao `MenuContent` que renderiza o elemento: o painel
	 * nasce sem `id`, a comparação é sempre falsa, e o typeahead nunca dispara.
	 * Medido em 2026-09-03 — digitar `s` com o menu aberto deixava o foco onde
	 * estava, ainda depois de 600ms; as outras quatro stacks levavam para
	 * "Salvar". Passar o `id` como prop, sozinho, não resolve: ele é engolido no
	 * mesmo ponto.
	 *
	 * Como o `contentId` interno passa a ser exatamente o valor que enviamos, o
	 * conserto é carimbar esse mesmo valor no nó. As duas pontas voltam a
	 * concordar sem tocar na lib, e o `aria-controls` do gatilho — que aponta para
	 * esse id — passa a resolver para um elemento que existe.
	 *
	 * Se um bump do bits-ui passar a emitir o `id`, este efeito vira no-op: ele só
	 * escreve quando o atributo está vazio.
	 */
	const uid = $props.id();

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		alignOffset = -4,
		align = "start",
		side = "bottom",
		portalProps,
		id = `nds-menubar-content-${uid}`,
		...restProps
	}: MenubarPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof MenubarPortal>>;
	} = $props();

	$effect(() => {
		if (ref && !ref.id) ref.id = id;
	});
</script>

<MenubarPortal {...portalProps}>
	<MenubarPrimitive.Content
		bind:ref
		data-slot="menubar-content"
		{id}
		{align}
		{alignOffset}
		{side}
		{sideOffset}
		class={cn("nds-dropdown-menu-content", className)}
		{...restProps}
	/>
</MenubarPortal>
