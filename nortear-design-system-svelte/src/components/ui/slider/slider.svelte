<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	/**
	 * O ramo MÚLTIPLO da união de props da lib.
	 *
	 * `SliderPrimitive.RootProps` é uma união discriminada por `type`
	 * (`"single"` | `"multiple"`), e o wrapper herdava a união inteira. Duas
	 * consequências, as duas medidas:
	 *
	 *  1. `type` virava prop OBRIGATÓRIA de quem consome — e ninguém passava.
	 *     Eram 16 erros de `svelte-check` ("Property 'type' is missing"),
	 *     espalhados por docs page, stories e andaimes, todos dizendo a mesma
	 *     coisa: o contrato declarado não é o contrato usado.
	 *  2. Sem o discriminante, o TypeScript não conseguia estreitar a união, e
	 *     `min`/`step` chegavam ao `saltoWide` sem tipo numérico — daí os dois
	 *     erros de "arithmetic operation" na conta do PageUp/PageDown. Erro de
	 *     tipo em cima de aritmética de valor não é ruído: era a conta do salto
	 *     rodando sem garantia nenhuma de que os operandos eram números.
	 *
	 * O contrato das cinco stacks é `value` SEMPRE array, ou seja, sempre o ramo
	 * múltiplo. Ele já era o comportamento em runtime por acidente: a lib faz
	 * `if (type === "single")`, e com `type` ausente caía no `else`. Fixar o ramo
	 * aqui transforma esse acidente em contrato — o `type` sai da superfície de
	 * quem consome e passa a ser decidido pelo wrapper.
	 */
	type RangeProps = Extract<SliderPrimitive.RootProps, { type: "multiple" }>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		min = 0,
		max = 100,
		step = 1,
		largeStep = 10,
		class: className,
		thumbAriaLabels,
		thumbAriaLabel = "Valor",
		"aria-label": ariaLabel,
		...restProps
	}: Omit<WithoutChildrenOrChild<RangeProps>, "type" | "step"> & {
		/**
		 * Incremento de cada passo. NÚMERO, não lista.
		 *
		 * A lib aceita `number | number[]` — a forma em lista são pontos discretos
		 * de encaixe. O contrato das cinco stacks é um passo numérico, e só ele
		 * está implementado aqui: com uma lista, a conta do PageUp/PageDown
		 * (`Math.round((bruto - min) / step) * step`) faria aritmética sobre um
		 * array e devolveria `NaN` — o valor sumiria da alça, sem erro nenhum.
		 * Era o que os dois erros de "arithmetic operation" do `svelte-check`
		 * estavam apontando.
		 *
		 * Estreitar aqui fecha a porta no tipo em vez de no runtime.
		 */
		step?: number;
		thumbAriaLabels?: string[];
		thumbAriaLabel?: string;
		"aria-label"?: string;
		/** Salto de PageUp/PageDown. */
		largeStep?: number;
	} = $props();

	/**
	 * O nome acessível de cada alça.
	 *
	 * `aria-label` era engolido pelo `restProps` e pousava na RAIZ — um elemento
	 * sem papel nenhum, onde nome acessível não é exposto. Quem tem
	 * `role="slider"` é a alça, e ela ficava com o "Valor" do default: o leitor
	 * de tela anunciava "Valor" em todos os sliders da página, inclusive nos dois
	 * de um mesmo formulário. A prop era aceita e ignorada em silêncio.
	 *
	 * As outras stacks já nomeiam por `aria-label` (nas headless ele é
	 * encaminhado à alça; no vanilla vai ao `<input type="range">`, que É o
	 * `role="slider"`). Aqui o encaminhamento passa a ser explícito.
	 *
	 * `thumbAriaLabels` continua acima na ordem: é o único jeito de dar nomes
	 * DIFERENTES às duas alças de uma faixa ("mínimo" e "máximo").
	 */
	const handleName = (index: number): string =>
		thumbAriaLabels?.[index] ?? ariaLabel ?? thumbAriaLabel;

	/**
	 * PageUp/PageDown — o salto largo que a lib headless não implementa.
	 *
	 * A lista de teclas dela cobre setas, Home e End; as de página caem no
	 * `return` antes do `switch` e nada acontece. O contrato do design system
	 * documenta as duas, então elas nascem aqui: o `keydown` sobe da alça até a
	 * raiz e o valor é recalculado à mão.
	 *
	 * `preventDefault` porque, sem ele, PageUp/PageDown rolam a página inteira
	 * enquanto a pessoa mexe no controle.
	 */
	function saltoWide(evento: KeyboardEvent) {
		if (evento.key !== "PageUp" && evento.key !== "PageDown") return;
		if (restProps.disabled) return;

		const thumb = (evento.target as HTMLElement | null)?.closest<HTMLElement>(
			'[data-slot="slider-thumb"]'
		);
		if (!thumb) return;

		const alcas = [
			...(ref?.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]') ?? []),
		];
		const index = Math.max(0, alcas.indexOf(thumb));
		const direction = evento.key === "PageUp" ? 1 : -1;

		const current = Array.isArray(value) ? [...value] : [value ?? min];
		const raw = (current[index] ?? min) + largeStep * direction;
		// Arredonda ao passo antes de prender na faixa: um salto que caísse entre
		// dois passos deixaria o controle num valor que as setas não alcançam.
		const inStep = min + Math.round((raw - min) / step) * step;
		current[index] = Math.min(max, Math.max(min, inStep));

		evento.preventDefault();
		value = (Array.isArray(value) ? current : current[0]) as never;
	}
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.

`thumbPositioning="exact"` — o valor mapeia direto em 0–100% do trilho.

O default da lib é "contain": ela encolhe a escala em meia alça de cada lado
para que a alça nunca ultrapasse o trilho. Com alça de 24px num trilho de 320,
isso é 3,75% de cada lado, e o preenchimento de uma faixa 20–80 desenhava menos
que os 60% que as outras stacks desenham, com os mesmos dados.

O desenho que o design system define é o das outras quatro: o centro da alça
percorre de 0% a 100% e sobra meia alça fora do trilho nos extremos. É
deliberado, e o CSS compartilhado protege isso ao não recortar o trilho com
`overflow: hidden`. "exact" é a opção que a própria lib oferece para esse
desenho — não é remendo.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	type="multiple"
	data-slot="slider"
	{orientation}
	{min}
	{max}
	{step}
	thumbPositioning="exact"
	onkeydown={saltoWide}
	class={cn(
		"nds-slider",
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			data-orientation={orientation}
			class={cn(
				"nds-slider-track"
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn(
					"nds-slider-range"
				)}
			/>
		</span>
		<!--
		Chaveado pelo ÍNDICE, não pelo objeto.

		`thumbItems` é derivado, e cada item é um objeto novo `{ value, index }`
		criado a cada mudança de valor. Chaveando por `(thumb)` — o objeto — a
		identidade mudava a cada tecla, e o Svelte destruía e recriava a alça em
		vez de atualizá-la. Como o elemento focado deixava de existir, o FOCO
		voltava para o body a cada movimento: dava para apertar a seta uma vez
		depois de focar, e a segunda não fazia nada. O contrato de teclado
		inteiro (setas, Home/End, PageUp/PageDown) só funcionava na primeira
		tecla, e o defeito era invisível para toda story que focasse de novo
		antes de cada tecla.

		`thumb.index` é a posição da alça, estável enquanto o número de alças não
		muda — que é exatamente o que uma chave de `{#each}` deve ser.
		-->
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				aria-label={handleName(thumb.index)}
				class="nds-slider-thumb"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
