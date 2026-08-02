<script lang="ts" module>
	import { cva, type VariantProps } from "class-variance-authority";

	export const alertVariants = cva("nds-alert", {
		
		variants: {
			variant: {
				default: "",
				destructive: "nds-alert-destructive",
				success: "nds-alert-success",
				warning: "nds-alert-warning",
				info: "nds-alert-info",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];

	// Janelas de segurança das animações de `.nds-animate-in` / `.nds-animate-out`
	// (utilities.css). Os timeouts NÃO são redundância defensiva genérica: sem
	// eles o alert quebra em dois cenários reais — `prefers-reduced-motion`, onde
	// a animação é suprimida e `animationend` jamais dispara, e ambiente sem
	// composição de quadros (Chromium headless dos testes), onde a animação fica
	// presa no primeiro quadro com playState "running".
	const EXIT_FALLBACK_MS = 300; // --duration-base (200ms) + folga
	const ENTER_FALLBACK_MS = 450; // --duration-spring (400ms) + folga
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { Button } from "@/components/ui/button";
	import X from "@lucide/svelte/icons/x";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		role = "alert",
		dismissible = false,
		onDismiss,
		dismissLabel = "Fechar alerta",
		children,
		...restProps
	}: WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "role">> & {
		variant?: AlertVariant;
		/**
		 * Semântica de anúncio do elemento raiz.
		 *
		 * `alert` (padrão) é live region ASSERTIVA: o leitor de tela interrompe o
		 * que estiver fazendo e anuncia na hora — correto só para mensagem urgente
		 * que SURGE em tempo de execução. `status` é live region polida (anuncia
		 * sem interromper). `note` não é live region — é o valor certo para alert
		 * estático, já presente quando a página carrega.
		 */
		role?: "alert" | "status" | "note";
		/** Exibe o botão de fechar; fechar remove o alert da tela. */
		dismissible?: boolean;
		/** Callback de fechamento — dispara uma vez ao acionar o botão. */
		onDismiss?: () => void;
		/** Rótulo acessível do botão de fechar. */
		dismissLabel?: string;
	} = $props();

	// Estado interno: fechar remove o alert da tela. Consumidor que quiser
	// modo controlado renderiza condicionalmente por conta própria.
	let dismissed = $state(false);

	// Classe de animação corrente. Só o alert dismissible entra/sai animado —
	// as demais variantes são conteúdo estático da página.
	//
	// A entrada é TRANSITÓRIA: `nds-animate-in` fica aplicada apenas enquanto a
	// animação roda e é limpa em seguida. Se persistisse, um ambiente que não
	// avança a animação (headless) manteria o alert preso em opacity: 0 —
	// invisível para sempre.
	// A leitura do valor INICIAL de `dismissible` é intencional: a classe precisa
	// estar no primeiro render (aplicá-la depois da montagem faria o alert
	// piscar em opacidade cheia antes de voltar a zero).
	// svelte-ignore state_referenced_locally
	let classeAnimacao = $state<string | undefined>(dismissible ? "nds-animate-in" : undefined);
	let fechando = false;

	$effect(() => {
		const el = ref;
		if (!dismissible || !el) return;

		const limparEntrada = () => {
			if (classeAnimacao === "nds-animate-in") classeAnimacao = undefined;
		};
		el.addEventListener("animationend", limparEntrada, { once: true });
		const timer = window.setTimeout(limparEntrada, ENTER_FALLBACK_MS);

		return () => {
			window.clearTimeout(timer);
			el.removeEventListener("animationend", limparEntrada);
		};
	});

	function handleDismiss() {
		if (fechando) return;
		fechando = true;

		const el = ref;
		let finalizado = false;
		let timer = 0;
		const finalizar = () => {
			if (finalizado) return;
			finalizado = true;
			window.clearTimeout(timer);
			el?.removeEventListener("animationend", finalizar);
			dismissed = true;
			onDismiss?.();
		};

		// Trocar a classe já remove `nds-animate-in` — fechar antes da entrada
		// terminar não deixa as duas no elemento.
		classeAnimacao = "nds-animate-out";

		// Corrida entre `animationend` e o timeout: quem vencer remove o nó e
		// chama `onDismiss` (uma vez só). NUNCA depender só de `animationend` —
		// ver o comentário dos fallbacks no bloco module.
		el?.addEventListener("animationend", finalizar);
		timer = window.setTimeout(finalizar, EXIT_FALLBACK_MS);
	}
</script>

{#if !dismissed}
	<div
		bind:this={ref}
		data-slot="alert"
		{role}
		class={cn(alertVariants({ variant }), classeAnimacao, className)}
		{...restProps}
	>
		{@render children?.()}
		{#if dismissible}
			<Button
				variant="ghost"
				size="icon-sm"
				class="nds-alert-dismiss"
				type="button"
				aria-label={dismissLabel}
				data-slot="alert-dismiss"
				onclick={handleDismiss}
			>
				<X class="nds-icon" aria-hidden="true" />
			</Button>
		{/if}
	</div>
{/if}
