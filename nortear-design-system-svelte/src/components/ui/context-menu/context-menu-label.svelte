<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { isInsideContextMenuGroup } from "./context";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		inset?: boolean;
	} = $props();

	const insideGroup = isInsideContextMenuGroup();
</script>

<!--
	O rótulo NOMEIA o grupo em que está — ver `context.ts`.

	Dentro de um grupo, quem desenha é o cabeçalho da lib, pelo `child`: é ele
	que escreve o próprio `id` no `aria-labelledby` do grupo. Duas coisas do que a
	lib entrega são corrigidas aqui, e as duas por atributo depois do espalhamento
	(no Svelte 5 o último vence):

	- `role="group"`, que a lib põe no CABEÇALHO: seria um segundo grupo, vazio de
	  itens, dentro do grupo que ele nomeia — o leitor de tela anunciaria um bloco
	  a mais. O rótulo é texto, e fica sem papel, como no vanilla;
	- o `data-slot`, que é `context-menu-label` nas cinco stacks, com ou sem grupo.

	`data-inset` só existe quando o recuo é pedido: a folha lê a PRESENÇA do
	atributo, e `inset={false}` renderizaria `data-inset="false"`, que recua.
-->
{#if insideGroup}
	<!-- Os atributos de quem consome vão no `<div>`, depois dos da lib: um `id`
	     próprio continua valendo, porque a lib lê o `id` do NÓ montado para
	     escrever o `aria-labelledby`. -->
	<ContextMenuPrimitive.GroupHeading>
		{#snippet child({ props })}
			<div
				{...props}
				{...restProps}
				bind:this={ref}
				role={undefined}
				data-slot="context-menu-label"
				data-inset={inset || undefined}
				class={cn("nds-dropdown-menu-label", className)}
			>
				{@render children?.()}
			</div>
		{/snippet}
	</ContextMenuPrimitive.GroupHeading>
{:else}
	<div
		bind:this={ref}
		data-slot="context-menu-label"
		data-inset={inset || undefined}
		class={cn("nds-dropdown-menu-label", className)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
