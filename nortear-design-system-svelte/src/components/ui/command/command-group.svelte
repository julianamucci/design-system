<script lang="ts">
	import { Command as CommandPrimitive, useId } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		heading,
		value,
		...restProps
	}: CommandPrimitive.GroupProps & {
		heading?: string;
	} = $props();

	/**
	 * As props que a lib funde no nó dos comandos, sem `role` — ver o
	 * comentário da marcação. Cópia, e não mutação: o objeto é da lib. O
	 * espalhamento leva junto o atributo `data-command-group-items`, que é por
	 * onde a lib reordena os comandos dentro do grupo depois de filtrar.
	 */
	function withoutGroupRole(props: Record<string, unknown>): Record<string, unknown> {
		const rest = { ...props };
		delete rest.role;
		delete rest["aria-labelledby"];
		return rest;
	}
</script>

<!--
	Grupo SEM cabeçalho não é `role="group"` (2026-09-10).

	O bits-ui 2.19.0 põe `role="presentation"` no contêiner e `role="group"` no
	nó dos comandos (`CommandGroupItemsState`, `command.svelte.js`), com o
	`aria-labelledby` apontando para o cabeçalho — que, sem `heading`, não
	existe. Sobrava um "grupo" anônimo entre a lista e cada opção: o leitor de
	tela anuncia a fronteira sem dizer de quê, e o `mergeProps` da lib aplica as
	props dela depois das de quem consome, então passar `role` por prop não
	vence. O contorno é o mesmo da raiz (`command.svelte`): o snippet `child`,
	espalhando as props sem o papel.

	Sem cabeçalho, o grupo é só a caixa que dá aos comandos os 4px de respiro
	que o raio aninhado desconta (PRD, D10) — a forma da fábrica do Vanilla, que
	é a referência e só escreve `role="group"` quando há cabeçalho que o nomeie.
	Guardado pelas stories `EmptyState` e `WithSeparator`.
-->
<CommandPrimitive.Group
	bind:ref
	data-slot="command-group"
	class={cn("nds-command-group", className)}
	value={value ?? heading ?? `----${useId()}`}
	{...restProps}
>
	{#if heading}
		<CommandPrimitive.GroupHeading
			class="nds-command-group-heading"
		>
			{heading}
		</CommandPrimitive.GroupHeading>
		<CommandPrimitive.GroupItems {children} />
	{:else}
		<CommandPrimitive.GroupItems>
			{#snippet child({ props })}
				<div {...withoutGroupRole(props)}>
					{@render children?.()}
				</div>
			{/snippet}
		</CommandPrimitive.GroupItems>
	{/if}
</CommandPrimitive.Group>
