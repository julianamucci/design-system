<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> & {
		/** Obrigatório: a legenda sempre informa o valor corrente. Tipar como
		 * opcional obrigava a um caminho de fallback que nada exercitava. */
		value: number;
	} = $props();
</script>

<!-- Mesmo contrato do seletor de mês: o <select> é o controle. -->
<CalendarPrimitive.YearSelect bind:ref {...restProps}>
	{#snippet child({ props, yearItems })}
		<select {...props} {value} {onchange} class={cn("nds-calendar-select", className)}>
			{#each yearItems as yearItem (yearItem.value)}
				<option value={yearItem.value} selected={yearItem.value === value}>
					{yearItem.label}
				</option>
			{/each}
		</select>
	{/snippet}
</CalendarPrimitive.YearSelect>
