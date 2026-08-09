<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import * as Calendar from "./index.js";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ButtonVariant } from "../button/button.svelte";
	import { isEqualMonth, type DateValue } from "@internationalized/date";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = "short",
		buttonVariant = "ghost",
		captionLayout = "label",
		locale = "en-US",
		months: monthsProp,
		years,
		day,
		disableDaysOutsideMonth = false,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
		buttonVariant?: ButtonVariant;
		// `label | dropdown`, e não os quatro valores da lib: o conteúdo
		// compartilhado documenta dois, o Vanilla entrega dois, e nenhuma story
		// exercitava os parciais (`dropdown-months`, `dropdown-years`). Variante
		// que só três stacks fazem e nada documenta não é contrato — é sobra, e
		// prometê-la na tabela de props era promessa que o produto não cumpria.
		captionLayout?: "dropdown" | "label";
		months?: CalendarPrimitive.MonthSelectProps["months"];
		years?: CalendarPrimitive.YearSelectProps["years"];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	// O formato do mês acompanha a legenda: por extenso no texto, abreviado no
	// seletor, onde não cabe. Era prop configurável que nenhuma story passava.
	const monthFormat = $derived(captionLayout === "dropdown" ? "short" : "long");
	const yearFormat = "numeric";

	/** Anos oferecidos para cada lado do ano em vista, como no Vanilla. */
	const JANELA_DE_ANOS = 10;

	// A lista padrão da lib tem 111 entradas (o ano corrente menos 100, mais
	// 10). Aberta, ela é mais alta que o calendário inteiro e a pessoa rola um
	// século para achar o ano ao lado. A janela anda junto ao navegar, porque
	// sai do ano em vista.
	const anoEmVista = $derived(placeholder?.year ?? new Date().getFullYear());
	const anosDaLista = $derived(
		years ??
			Array.from(
				{ length: JANELA_DE_ANOS * 2 + 1 },
				(_, i) => anoEmVista - JANELA_DE_ANOS + i,
			),
	);
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn(
		"nds-calendar-root",
		className
	)}
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
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							years={anosDaLista}
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
										<Calendar.Cell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value),
												})}
											{:else}
												<Calendar.Day />
											{/if}
										</Calendar.Cell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
	{/snippet}
</CalendarPrimitive.Root>
