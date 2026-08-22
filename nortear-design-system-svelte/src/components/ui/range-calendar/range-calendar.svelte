<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
	import * as Calendar from "../calendar/index.js";
	import RangeCalendarCell from "./range-calendar-cell.svelte";
	import RangeCalendarDay from "./range-calendar-day.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ButtonVariant } from "../button/button.svelte";
	import { calendarLabels } from "@shared/primitives/calendar-labels";
	import {
		teclaTarget,
		gridDay,
		isoDoElemento,
	} from "@shared/primitives/calendar-teclado";
	import { parseDate, type DateValue } from "@internationalized/date";
	import { tick } from "svelte";

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

	// Os botões de mês só têm ícone: quem usa leitor de tela ouve o aria-label,
	// e o da lib vinha "Previous", em inglês e sem dizer do que é anterior.
	const rotulos = $derived(calendarLabels(locale));

	/**
	 * O resto do teclado da grade — `Home`, `End`, `PageUp`, `PageDown`. Gêmeo do
	 * que existe no calendário de data única, e pela mesma razão: a lib trata
	 * seta, Enter e Espaço, e estas quatro não chegavam a lugar nenhum.
	 */
	async function onGridKeyDown(evento: KeyboardEvent) {
		const raiz = evento.currentTarget as HTMLElement | null;
		const destination = teclaTarget(isoDoElemento(evento.target as Element | null), evento);
		if (!destination || !raiz) return;
		evento.preventDefault();
		placeholder = parseDate(destination);
		await tick();
		gridDay(raiz, destination)?.focus();
	}

	/** Nome do mês por extenso mais o ano — o rótulo acessível da grade. */
	const monthLabel = (m: DateValue) =>
		`${new Intl.DateTimeFormat(locale, { month: "long" }).format(
			new Date(m.year, m.month - 1, 1),
		)} ${m.year}`;
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
	onkeydown={onGridKeyDown}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} aria-label={rotulos.mesAnterior} />
				<Calendar.NextButton variant={buttonVariant} aria-label={rotulos.proximoMes} />
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
					<!-- A tabela se nomeia: sem `aria-label` o grid é anunciado como
					     "tabela" e nada mais. -->
					<Calendar.Grid aria-label={monthLabel(month.value)}>
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
