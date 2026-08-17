<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import * as Calendar from "./index.js";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ButtonVariant } from "../button/button.svelte";
	import { rotulosDoCalendario } from "@shared/primitives/calendar-labels";
	import {
		destinoDaTecla,
		diaNaGrade,
		isoDoElemento,
	} from "@shared/primitives/calendar-teclado";
	import { isEqualMonth, parseDate, type DateValue } from "@internationalized/date";
	import { tick, type Snippet } from "svelte";

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

	// Mês por EXTENSO nas duas legendas, como no Vanilla, que é a referência. A
	// forma curta em pt-BR sai com ponto ("jan."), e o ponto numa opção de uma
	// palavra só é ruído — o mesmo motivo pelo qual ele já era removido do
	// cabeçalho da semana. Medido, o seletor com o nome inteiro tem 61px contra
	// 58px: cabe. Era prop configurável que nenhuma story passava.
	const monthFormat = "long";
	const yearFormat = "numeric";

	// Os botões de mês só têm ícone: quem usa leitor de tela ouve o aria-label,
	// e o da lib vinha "Previous", em inglês e sem dizer do que é anterior.
	const rotulos = $derived(rotulosDoCalendario(locale));

	/**
	 * Anos oferecidos para cada lado do ano em vista.
	 *
	 * A lista é COMPLETA, e não uma janela que anda: o painel de um <select> é
	 * desenhado pelo navegador e não entrega evento de rolagem ao JS, então não
	 * há onde pendurar um "carregar mais ao chegar na ponta". Uma janela
	 * obrigava a escolher o último ano da lista e reabrir para andar mais. Quem
	 * limita o que aparece é a altura do painel (onze itens, no CSS): abre com o
	 * ano corrente no meio e rola livre para os dois lados.
	 *
	 * Simétrico, e não o padrão da lib (cem anos para trás, dez para frente).
	 */
	const ANOS_PARA_CADA_LADO = 100;

	/**
	 * O resto do teclado da grade — `Home`, `End`, `PageUp`, `PageDown`.
	 *
	 * A lib trata seta, Enter e Espaço; estas quatro não chegavam a lugar nenhum,
	 * apesar de o conteúdo compartilhado prometê-las desde sempre (medido: o foco
	 * ficava parado no mesmo dia nas quatro).
	 *
	 * A data de partida vem do elemento em FOCO, e não do `placeholder`: a
	 * navegação por setas da lib move o foco sem mexer na visão.
	 *
	 * O foco é devolvido depois do `tick` porque mudar o mês recria a grade — o
	 * botão de destino ainda não existe no instante da tecla.
	 */
	async function aoTeclarNaGrade(evento: KeyboardEvent) {
		const raiz = evento.currentTarget as HTMLElement | null;
		const destino = destinoDaTecla(isoDoElemento(evento.target as Element | null), evento);
		if (!destino || !raiz) return;
		evento.preventDefault();
		placeholder = parseDate(destino);
		await tick();
		diaNaGrade(raiz, destino)?.focus();
	}

	/** Nome do mês por extenso mais o ano — o rótulo acessível da grade. */
	const rotuloDoMes = (m: DateValue) =>
		`${new Intl.DateTimeFormat(locale, { month: "long" }).format(
			new Date(m.year, m.month - 1, 1),
		)} ${m.year}`;

	const anoEmVista = $derived(placeholder?.year ?? new Date().getFullYear());
	const anosDaLista = $derived(
		years ??
			Array.from(
				{ length: ANOS_PARA_CADA_LADO * 2 + 1 },
				(_, i) => anoEmVista - ANOS_PARA_CADA_LADO + i,
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
	onkeydown={aoTeclarNaGrade}
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
					<!-- A tabela se nomeia: sem `aria-label` o grid é anunciado como
					     "tabela" e nada mais, e com dois meses na tela as duas soam
					     iguais. -->
					<Calendar.Grid aria-label={rotuloDoMes(month.value)}>
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
