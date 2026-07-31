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
		dismissible = false,
		onDismiss,
		dismissLabel = "Fechar alerta",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
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

	function handleDismiss() {
		dismissed = true;
		onDismiss?.();
	}
</script>

{#if !dismissed}
	<div
		bind:this={ref}
		data-slot="alert"
		role="alert"
		class={cn(alertVariants({ variant }), className)}
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
