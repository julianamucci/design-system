<script lang="ts" module>
	import { cva, type VariantProps } from "class-variance-authority";

	export const tabsListVariants = cva("nds-tabs-list", {
		
		variants: {
			variant: {
				default: "",
				line: "",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();

	// ─── Guarda da aba desabilitada ────────────────────────────────────────────
	//
	// A aba desabilitada continua no percurso da seta (ver `tabs-trigger.svelte`),
	// e para o primitivo ela é uma aba comum: o clique ativa, o Enter/Espaço
	// ativa, e o simples FOCO ativa, porque a ativação é automática. Estes três
	// caminhos precisam ser barrados de verdade — `pointer-events: none` na folha
	// só resolve o ponteiro, e nada resolve o teclado.
	//
	// A guarda mora na LISTA, em fase de captura, porque essa é a única posição
	// determinística: num ancestral, a captura precede sempre os ouvintes do
	// alvo. No próprio botão, a ordem passaria a depender de quem registrou
	// primeiro. E ela é instalada por `addEventListener` em vez de atributo
	// `on…capture` para não depender de como o spread do primitivo trata o
	// sufixo de captura.
	//
	// `focus` não é cancelável, então `preventDefault()` não o conteria — quem
	// contém é `stopPropagation()`, que impede o evento de chegar ao ouvinte do
	// primitivo. O foco em si acontece: é ele que faz o leitor de tela anunciar.

	const abaBloqueada = (alvo: EventTarget | null): boolean =>
		alvo instanceof Element && !!alvo.closest('[role="tab"][aria-disabled="true"]');

	function bloquearAtivacao(e: Event): void {
		if (!abaBloqueada(e.target)) return;
		e.preventDefault();
		e.stopPropagation();
	}

	function bloquearTecla(e: Event): void {
		const tecla = (e as KeyboardEvent).key;
		// Só Enter e Espaço. As setas, Home e End seguem para o primitivo — é
		// como a aba desabilitada continua alcançável.
		if (tecla !== "Enter" && tecla !== " ") return;
		bloquearAtivacao(e);
	}

	$effect(() => {
		const el = ref;
		if (!el) return;
		el.addEventListener("mousedown", bloquearAtivacao, true);
		el.addEventListener("click", bloquearAtivacao, true);
		el.addEventListener("keydown", bloquearTecla, true);
		el.addEventListener("focus", bloquearAtivacao, true);
		return () => {
			el.removeEventListener("mousedown", bloquearAtivacao, true);
			el.removeEventListener("click", bloquearAtivacao, true);
			el.removeEventListener("keydown", bloquearTecla, true);
			el.removeEventListener("focus", bloquearAtivacao, true);
		};
	});
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
