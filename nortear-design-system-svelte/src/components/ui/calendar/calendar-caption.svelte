<script lang="ts">
	import type { ComponentProps } from "svelte";
	import type Calendar from "./calendar.svelte";
	import CalendarMonthSelect from "./calendar-month-select.svelte";
	import CalendarYearSelect from "./calendar-year-select.svelte";
	import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";

	let {
		captionLayout,
		months,
		monthFormat,
		years,
		yearFormat,
		month,
		locale,
		placeholder = $bindable(),
		monthIndex = 0,
	}: {
		captionLayout: ComponentProps<typeof Calendar>["captionLayout"];
		months: ComponentProps<typeof CalendarMonthSelect>["months"];
		// Opção de Intl, e não o união da lib (que aceita função): o componente
		// nunca expôs o formatador como função, e tipar o que não se aceita
		// obrigava a uma guarda que nenhuma story alcançava.
		monthFormat: Intl.DateTimeFormatOptions["month"];
		years: ComponentProps<typeof CalendarYearSelect>["years"];
		yearFormat: Intl.DateTimeFormatOptions["year"];
		month: DateValue;
		placeholder: DateValue | undefined;
		locale: string;
		monthIndex: number;
	} = $props();

	// O formato chega sempre como string de Intl: a variante "formatador como
	// função" da lib nunca foi exposta pelo componente nem documentada, e a
	// guarda de tipo era ramo que nenhuma story alcançava.
	function formatYear(date: DateValue) {
		return new DateFormatter(locale, { year: yearFormat }).format(date.toDate(getLocalTimeZone()));
	}

	function formatMonth(date: DateValue) {
		return new DateFormatter(locale, { month: monthFormat }).format(date.toDate(getLocalTimeZone()));
	}
</script>

{#snippet MonthSelect()}
	<CalendarMonthSelect
		{months}
		{monthFormat}
		value={month.month}
		onchange={(e) => {
			/* v8 ignore next -- o calendário sempre vincula o placeholder; a guarda
			   cobre uso da legenda solta, que nenhuma story representa. */
			if (!placeholder) return;
			const v = Number.parseInt(e.currentTarget.value);
			const newPlaceholder = placeholder.set({ month: v });
			placeholder = newPlaceholder.subtract({ months: monthIndex });
		}}
	/>
{/snippet}

{#snippet YearSelect()}
	<!-- O `onchange` faltava: o seletor de ano renderizava, abria a lista, e
	     escolher um ano não movia o calendário. O de mês tinha o handler desde
	     sempre, e a assimetria passou porque nenhuma story operava o de ano. -->
	<CalendarYearSelect
		{years}
		{yearFormat}
		value={month.year}
		onchange={(e) => {
			/* v8 ignore next -- o calendário sempre vincula o placeholder; a guarda
			   cobre uso da legenda solta, que nenhuma story representa. */
			if (!placeholder) return;
			const v = Number.parseInt(e.currentTarget.value);
			placeholder = placeholder.set({ year: v }).subtract({ months: monthIndex });
		}}
	/>
{/snippet}

{#if captionLayout === "dropdown"}
	{@render MonthSelect()}
	{@render YearSelect()}
{:else}
	{formatMonth(month)} {formatYear(month)}
{/if}
