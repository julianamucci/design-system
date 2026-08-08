<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> & {
		/** Obrigatório: a legenda sempre informa o valor corrente. Tipar como
		 * opcional obrigava a um caminho de fallback que nada exercitava. */
		value: number;
	} = $props();
</script>

<span
	class={cn(
		"nds-calendar-select-framed",
		className
	)}
>
	<CalendarPrimitive.YearSelect
		bind:ref
		class="nds-calendar-select-overlay"
		{...restProps}
	>
		{#snippet child({ props, yearItems, selectedYearItem })}
			<select {...props} {value}>
				{#each yearItems as yearItem (yearItem.value)}
					<option
						value={yearItem.value}
						selected={yearItem.value === value}
					>
						{yearItem.label}
					</option>
				{/each}
			</select>
			<span
				class="nds-calendar-select-display"
				aria-hidden="true"
			>
				<!-- O rótulo visível é o do item que a própria lib marca como escolhido.
				     Antes procurávamos na lista pelo nosso `value` com fallback para ele —
				     os dois vêm do mesmo placeholder, então a busca só acrescentava um
				     caminho que nada percorria. A story afirma este texto. -->
				{selectedYearItem.label}
				<ChevronDownIcon class={cn("nds-size-4", className)} />
			</span>
		{/snippet}
	</CalendarPrimitive.YearSelect>
</span>
