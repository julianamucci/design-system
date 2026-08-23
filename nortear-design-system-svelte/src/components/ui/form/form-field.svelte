<script lang="ts" module>
	// ─── Form ─────────────────────────────────────────────────────────────────
	//
	// Visual: classes .nds-form-* (docs/shared/styles/nds/form.css).
	//
	// O produto deste componente NÃO é o que se vê: é a costura de
	// ACESSIBILIDADE em volta do campo, e ela só existe em atributo. Um campo
	// pode estar perfeito na tela e mudo no leitor de tela, e nenhuma foto do
	// Chromatic acusa.
	//
	//   · o <label> aponta para o controle (`for` ↔ `id`), com id gerado quando falta
	//   · descrição e mensagem ganham id e entram no `aria-describedby` do controle
	//   · a mensagem nasce com `aria-live="polite"`, então é anunciada ao aparecer
	//   · o rótulo ganha `data-error`, que é o que o CSS usa para pintá-lo
	//
	// O ESTADO DE FORMULÁRIO NÃO MORA AQUI. Esta pasta guardava um wrapper preso
	// a `formsnap` + `sveltekit-superforms`, com props genéricas exigindo um
	// `SuperForm`; nenhuma story o renderizava e os `data-slot` divergiam do
	// Vanilla (`form-description` em vez de `field-description`, sem
	// `field-error`). Valor, `touched`, `dirty` e erros de validação são da lib
	// que a aplicação escolher, e reimplementá-los daria dois donos para a mesma
	// informação — a mesma decisão registrada no Form do Angular.
	//
	// A fiação é feita PELO CAMPO, em uma direção só, varrendo o próprio DOM: o
	// campo acha o controle projetado dentro dele e escreve nele e no rótulo.

	/**
	 * Ordem de prioridade para achar o controle dentro do campo.
	 *
	 * `querySelector` devolve o primeiro elemento em ordem de DOM, não o primeiro
	 * seletor que casa — por isso a busca é seletor a seletor. Os `data-slot`
	 * compostos vêm antes dos elementos nativos de propósito: checkbox, switch e
	 * select desta stack renderizam um `<input>` escondido para participar do
	 * formulário, e ele casaria com `input` antes do controle de verdade.
	 */
	const SELECTORS_CONTROL = [
		'[data-slot="input-group-control"]',
		'[data-slot="checkbox"]',
		'[data-slot="switch"]',
		'[data-slot="select-trigger"]',
		'[data-slot="slider"]',
		'input:not([type="hidden"])',
		"textarea",
		"select",
	];

	/** Contador de módulo: id curto aparece legível no `aria-describedby`. */
	let sequencia = 0;
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "@/lib/utils.js";

	let {
		label,
		description,
		error,
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		/** Texto do rótulo. O campo o associa ao controle. */
		label?: string;
		/** Texto de apoio abaixo do controle — formato esperado, política, exemplo. */
		description?: string;
		/** Mensagem de erro. Presente, é anunciada e pinta o rótulo. */
		error?: string;
		children: Snippet;
	} = $props();

	sequencia += 1;
	const base = `nds-form-field-${sequencia}`;
	const idDescription = `${base}-description`;
	const idError = `${base}-error`;

	let root = $state<HTMLDivElement | null>(null);
	/** Ids que quem compõe já tinha escrito no controle — preservados na junção. */
	let describedbyEscrito: string[] | null = null;

	$effect(() => {
		// Lidos aqui para que o efeito re-rode quando as peças entram ou saem.
		const hasDescription = Boolean(description);
		const hasError = Boolean(error);
		const el = root;
		if (!el) return;

		let control: HTMLElement | null = null;
		for (const selector of SELECTORS_CONTROL) {
			control = el.querySelector<HTMLElement>(selector);
			if (control) break;
		}

		const label = el.querySelector<HTMLLabelElement>("label");
		// `for` só quando falta. Label que ENVOLVE o controle já está associado
		// pela estrutura, e escrever `for` ali não acrescenta nada.
		if (label && control && !label.getAttribute("for") && !label.contains(control)) {
			if (!control.id) control.id = `${base}-control`;
			label.setAttribute("for", control.id);
		}

		if (!control) return;

		// Junção, não substituição: quem compõe pode já ter apontado o controle
		// para um texto fora do campo, e sobrescrever descartaria essa instrução.
		describedbyEscrito ??= (control.getAttribute("aria-describedby") ?? "")
			.split(/\s+/)
			.filter(Boolean);

		const ids = [
			...describedbyEscrito,
			...(hasDescription ? [idDescription] : []),
			...(hasError ? [idError] : []),
		];
		if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
		else control.removeAttribute("aria-describedby");
	});
</script>

<div
	bind:this={root}
	data-slot="field"
	data-invalid={error ? "true" : undefined}
	class={cn("nds-form-field", className)}
	{...restProps}
>
	<!-- `.nds-form-label[data-error="true"]` é a regra que pinta o rótulo de
	     destructive. Sem o atributo, o erro só existiria abaixo do campo. -->
	{#if label}
		<!-- svelte-ignore a11y_label_has_associated_control -->
		<!-- O `for` é escrito em tempo de execução pelo `$effect` acima, a partir
		     do controle projetado no slot — o compilador não enxerga o que ainda
		     não está no markup. A associação em si tem asserção: a play do
		     Playground compara `label.htmlFor` com `controle.id` e alcança o campo
		     por `getByLabelText`. -->
		<label data-slot="label" data-error={error ? "true" : undefined} class="nds-form-label">
			{label}
		</label>
	{/if}

	{@render children()}

	{#if description}
		<p id={idDescription} data-slot="field-description" class="nds-form-description">
			{description}
		</p>
	{/if}

	<!-- `aria-live="polite"` e não `role="alert"`: em validação a cada tecla,
	     interromper a digitação a cada caractere é pior que esperar a pausa. -->
	{#if error}
		<p id={idError} data-slot="field-error" aria-live="polite" class="nds-form-error">
			{error}
		</p>
	{/if}
</div>
