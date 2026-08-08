<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import * as Calendar from "../calendar/index.js";
	import RangeCalendarCell from "./range-calendar-cell.svelte";
	import RangeCalendarDay from "./range-calendar-day.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ButtonVariant } from "../button/button.svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = "short",
		buttonVariant = "ghost",
		locale = "en-US",
		disableDaysOutsideMonth = false,
		...restProps
	}: WithoutChildrenOrChild<RangeCalendarPrimitive.RootProps> & {
		buttonVariant?: ButtonVariant;
	} = $props();

	// Legenda sempre em texto, sem a variante de selects. O intervalo já pede
	// dois cliques, e trocar mês e ano por dropdown no meio disso desfaz a
	// seleção pela metade. O calendário de data única continua oferecendo os
	// dois layouts, que é onde a navegação longa faz sentido.
	const monthFormat = "long";
	const yearFormat = "numeric";
</script>

<!--
`nds-calendar-range` não é decoração: é o que distingue o miolo do intervalo de
uma data única. A lib marca `data-selected` em TODOS os dias do intervalo, ponta
e miolo, então sem um marcador na raiz a folha de estilo não teria como pintar
o miolo diferente sem despintar também a seleção simples.
-->
<RangeCalendarPrimitive.Root
	bind:value
	bind:ref
	bind:placeholder
	{weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn("nds-calendar-root nds-calendar-range", className)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} />
				<Calendar.NextButton variant={buttonVariant} />
			</Calendar.Nav>
			{#each months as month, monthIndex (month)}
				<Calendar.Month>
					<Calendar.Header>
						<Calendar.Caption
							captionLayout="label"
							months={undefined}
							{monthFormat}
							years={undefined}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
						/>
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHead>
							<Calendar.GridRow class="nds-calendar-row">
								{#each weekdays as weekday, i (i)}
									<Calendar.HeadCell>
										{weekday.replace(/\.$/, "")}
									</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<Calendar.GridRow class="nds-calendar-week">
									{#each weekDates as date (date)}
										<RangeCalendarCell {date} month={month.value}>
											<RangeCalendarDay />
										</RangeCalendarCell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
	{/snippet}
</RangeCalendarPrimitive.Root>
