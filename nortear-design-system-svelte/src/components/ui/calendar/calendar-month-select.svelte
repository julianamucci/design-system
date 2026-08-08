<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

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

<span
	class={cn(
		"nds-calendar-select-framed",
		className
	)}
>
	<CalendarPrimitive.MonthSelect
		bind:ref
		class="nds-calendar-select-overlay"
		{...restProps}
	>
		{#snippet child({ props, monthItems, selectedMonthItem })}
			<select {...props} {value} {onchange}>
				{#each monthItems as monthItem (monthItem.value)}
					<option
						value={monthItem.value}
						selected={monthItem.value === value}
					>
						{monthItem.label}
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
				{selectedMonthItem.label}
				<ChevronDownIcon class={cn("nds-size-4", className)} />
			</span>
		{/snippet}
	</CalendarPrimitive.MonthSelect>
</span>
