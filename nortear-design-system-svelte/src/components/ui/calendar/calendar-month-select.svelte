<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.MonthSelectProps> & {
		/** Obrigatório: a legenda sempre informa o valor corrente. Tipar como
		 * opcional obrigava a um caminho de fallback que nada exercitava. */
		value: number;
	} = $props();
</script>

<!--
O <select> É o controle: nada de camada invisível sobre um rótulo desenhado à
mão. O truque antigo existia porque não dava para estilizar o select nativo, e
custava caro — o rótulo duplicava o texto para o leitor de tela e o contrato de
classe divergia das outras três stacks.
-->
<CalendarPrimitive.MonthSelect bind:ref {...restProps}>
	{#snippet child({ props, monthItems })}
		<select {...props} {value} {onchange} class={cn("nds-calendar-select", className)}>
			{#each monthItems as monthItem (monthItem.value)}
				<option value={monthItem.value} selected={monthItem.value === value}>
					{monthItem.label}
				</option>
			{/each}
		</select>
	{/snippet}
</CalendarPrimitive.MonthSelect>
